"use server";
import {revalidatePath} from "next/cache";
import {requireWorkspaceAdmin} from "@/lib/teams";
import {adminClient} from "@/lib/supabase/admin";
import {isUuid} from "@/lib/channels";
export async function disconnectChannel(form:FormData){
 const workspaceId=String(form.get("workspace_id")||""),id=String(form.get("connection_id")||"");
 if(!isUuid(workspaceId)||!isUuid(id))throw new Error("Invalid connection");
 await requireWorkspaceAdmin(workspaceId);
 const {error}=await adminClient().from("channel_connections").update({status:"disconnected",encrypted_access_token:null,encrypted_refresh_token:null,token_expires_at:null,updated_at:new Date().toISOString()}).eq("id",id).eq("workspace_id",workspaceId);
 if(error)throw new Error("Could not disconnect channel");
 revalidatePath("/app/channels");
}
