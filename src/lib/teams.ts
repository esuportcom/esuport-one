import { createClient } from "@/lib/supabase/server";
export async function requireWorkspaceAdmin(workspaceId:string){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)throw new Error("Sign in required");
 const {data:membership,error}=await supabase.from("workspace_members").select("role").eq("workspace_id",workspaceId).eq("user_id",user.id).single();
 if(error||!membership||!["owner","agency_admin"].includes(membership.role))throw new Error("Workspace administrator access required");
 return {user,supabase};
}
export function safeReturnPath(input:string|null){return input&&input.startsWith("/app")&&!input.startsWith("//")?input:"/app/teams"}
