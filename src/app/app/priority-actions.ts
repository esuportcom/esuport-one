"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function scoped(workspaceId:string){
 if(!uuid.test(workspaceId))throw new Error("Invalid workspace");
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)throw new Error("Not signed in");
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",workspaceId).eq("user_id",user.id).maybeSingle();
 if(!member)throw new Error("Workspace access denied");
 return supabase;
}
export async function updateConversationPriority(form:FormData){
 const workspaceId=String(form.get("workspace_id")||""),conversationId=String(form.get("conversation_id")||"");
 const priority=String(form.get("priority")||"normal");
 const dueRaw=String(form.get("due_at")||"").trim();
 if(!uuid.test(conversationId)||!["low","normal","high","urgent"].includes(priority))throw new Error("Invalid priority");
 const supabase=await scoped(workspaceId);
 const due_at=dueRaw?new Date(dueRaw).toISOString():null;
 if(dueRaw&&Number.isNaN(Date.parse(dueRaw)))throw new Error("Invalid due date");
 const {error}=await supabase.from("conversations").update({priority,due_at,updated_at:new Date().toISOString()}).eq("workspace_id",workspaceId).eq("id",conversationId);
 if(error)throw new Error(error.message);
 revalidatePath("/app/inbox");
 revalidatePath("/app");
}
