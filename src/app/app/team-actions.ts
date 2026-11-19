"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createHash,randomBytes} from "node:crypto";
import {adminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";
import {requireWorkspaceAdmin} from "@/lib/teams";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash=(token:string)=>createHash("sha256").update(token).digest("hex");
export async function createInvitation(form:FormData){
 const workspaceId=String(form.get("workspace_id")||"");
 const email=String(form.get("email")||"").trim().toLowerCase();
 const role=String(form.get("role")||"agency_agent");
 if(!uuid.test(workspaceId)||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!["agency_admin","agency_agent","client_admin"].includes(role))throw new Error("Invalid invitation details");
 const {user}=await requireWorkspaceAdmin(workspaceId);
 const token=randomBytes(32).toString("hex");
 const {error}=await adminClient().from("workspace_invitations").insert({workspace_id:workspaceId,email,role,token_hash:hash(token),invited_by:user.id});
 if(error)throw new Error("Could not create invitation. An invitation may already exist.");
 revalidatePath("/app/teams");
 // No email delivery is configured yet. Admin copies the one-time invitation URL.
 redirect("/app/teams?invite="+encodeURIComponent(token));
}
export async function acceptInvitation(form:FormData){
 const token=String(form.get("token")||"");
 if(!/^[a-f0-9]{64}$/.test(token))throw new Error("Invalid invitation token");
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user||!user.email)throw new Error("Sign in with the invited email first");
 const admin=adminClient();
 const {data:invite}=await admin.from("workspace_invitations").select("*").eq("token_hash",hash(token)).is("accepted_at",null).gt("expires_at",new Date().toISOString()).maybeSingle();
 if(!invite||invite.email!==user.email.toLowerCase())throw new Error("Invitation invalid, expired, or for another account");
 const {error}=await admin.from("workspace_members").upsert({workspace_id:invite.workspace_id,user_id:user.id,role:invite.role},{onConflict:"workspace_id,user_id",ignoreDuplicates:true});
 if(error)throw new Error("Could not join workspace");
 await admin.from("workspace_invitations").update({accepted_at:new Date().toISOString()}).eq("id",invite.id).is("accepted_at",null);
 revalidatePath("/app/teams");redirect("/app/teams");
}
export async function assignConversation(form:FormData){
 const workspaceId=String(form.get("workspace_id")||""),conversationId=String(form.get("conversation_id")||"");
 const assignee=String(form.get("assigned_to")||"");
 if(!uuid.test(workspaceId)||!uuid.test(conversationId)||(assignee&&!uuid.test(assignee)))throw new Error("Invalid assignment");
 const {supabase}=await requireWorkspaceAdmin(workspaceId);
 if(assignee){const {data:member}=await supabase.from("workspace_members").select("user_id").eq("workspace_id",workspaceId).eq("user_id",assignee).maybeSingle();if(!member)throw new Error("Agent does not belong to workspace")}
 const {error}=await supabase.from("conversations").update({assigned_to:assignee||null,updated_at:new Date().toISOString()}).eq("workspace_id",workspaceId).eq("id",conversationId);
 if(error)throw new Error(error.message);
 revalidatePath("/app/inbox");
}
