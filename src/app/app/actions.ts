
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
 const supabase = await createClient();
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user) throw new Error("Sign in required");
 return {supabase,user};
}
const clean=(v:FormDataEntryValue|null,max=250)=>typeof v==="string"?v.trim().slice(0,max):"";
function assertUuid(id:string){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new Error("Invalid identifier")}
async function requireMembership(workspaceId:string){
 assertUuid(workspaceId);
 const {supabase,user}=await requireUser();
 const {data,error}=await supabase.from("workspace_members").select("role").eq("workspace_id",workspaceId).eq("user_id",user.id).single();
 if(error||!data)throw new Error("Workspace access denied");
 return {supabase,user,role:data.role as string};
}
export async function createWorkspace(form:FormData){
 const name=clean(form.get("name"),100);
 if(name.length<2)throw new Error("Workspace name must contain at least two characters");
 const {supabase}=await requireUser();
 const {error}=await supabase.rpc("create_workspace",{workspace_name:name});
 if(error)throw new Error(error.message);
 revalidatePath("/app");redirect("/app");
}
export async function createContact(form:FormData){
 const workspaceId=clean(form.get("workspace_id"),36);const name=clean(form.get("name"),120);
 if(!name)throw new Error("Contact name is required");
 const {supabase}=await requireMembership(workspaceId);
 const {error}=await supabase.from("contacts").insert({workspace_id:workspaceId,name,channel:clean(form.get("channel"),30)||null});
 if(error)throw new Error(error.message);
 revalidatePath("/app/customers");
}
export async function createConversation(form:FormData){
 const workspaceId=clean(form.get("workspace_id"),36),contactId=clean(form.get("contact_id"),36),subject=clean(form.get("subject"),180);
 if(!contactId||!subject)throw new Error("Select a contact and enter a subject");
 assertUuid(contactId);
 const {supabase}=await requireMembership(workspaceId);
 const {error}=await supabase.from("conversations").insert({workspace_id:workspaceId,contact_id:contactId,subject});
 if(error)throw new Error(error.message);
 revalidatePath("/app/inbox");redirect("/app/inbox");
}
export async function sendInternalMessage(form:FormData){
 const workspaceId=clean(form.get("workspace_id"),36),conversationId=clean(form.get("conversation_id"),36),body=clean(form.get("body"),5000);
 if(!body)throw new Error("Message cannot be empty");
 assertUuid(conversationId);
 const {supabase,user}=await requireMembership(workspaceId);
 const {error}=await supabase.from("messages").insert({workspace_id:workspaceId,conversation_id:conversationId,sender_id:user.id,body,is_internal:true});
 if(error)throw new Error(error.message);
 revalidatePath("/app/inbox");redirect(`/app/inbox?conversation=${conversationId}&workspace=${workspaceId}`);
}
export async function changeConversationStatus(form:FormData){
 const workspaceId=clean(form.get("workspace_id"),36),conversationId=clean(form.get("conversation_id"),36),status=clean(form.get("status"),12);
 if(!["open","pending","resolved"].includes(status))throw new Error("Invalid status");
 assertUuid(conversationId);
 const {supabase}=await requireMembership(workspaceId);
 const {error}=await supabase.from("conversations").update({status,updated_at:new Date().toISOString()}).eq("id",conversationId).eq("workspace_id",workspaceId);
 if(error)throw new Error(error.message);
 revalidatePath("/app/inbox");
}
