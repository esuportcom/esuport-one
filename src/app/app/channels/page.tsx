import ChannelSyncButton from "@/components/channel-sync-button";
import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {adminClient} from "@/lib/supabase/admin";
import {disconnectChannel} from "../channel-actions";
import {Mail,MessageCircle,ShieldCheck} from "lucide-react";

export default async function Channels({searchParams}:{searchParams:Promise<{result?:string}>}){
 const {result}=await searchParams;
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;

 const {data:members}=await supabase.from("workspace_members").select("workspace_id,role,workspaces(name)").eq("user_id",user.id);
 const admins=members?.filter(m=>["owner","agency_admin"].includes(m.role))||[];

 // The admin client is only needed for cross-workspace channel listings. If the
 // service-role key is not configured, keep the page usable instead of crashing.
 const {data:connections}=admins.length&&process.env.SUPABASE_SERVICE_ROLE_KEY
   ?await adminClient().from("channel_connections").select("id,workspace_id,provider,account_label,status,created_at").in("workspace_id",admins.map(m=>m.workspace_id)).order("created_at",{ascending:false})
   :{data:[]};

 return <div>
  <h2 className="text-3xl font-bold">Connected Channels</h2>
  <p className="text-slate-500 mt-2">Manage channel authorization for your support workspaces.</p>
  {result&&<p className="panel p-4 mt-5 text-sm">Connection result: {result.replaceAll("_"," ")}</p>}
  {!process.env.SUPABASE_SERVICE_ROLE_KEY&&<p className="panel p-4 mt-5 text-sm">Channel connections are not fully configured yet. The rest of the workspace remains available.</p>}
  <div className="grid md:grid-cols-2 gap-5 mt-6">
   <div className="panel p-6">
    <Mail className="text-brand" size={28}/><h3 className="font-bold text-xl mt-4">Gmail</h3>
    <p className="text-slate-500 text-sm mt-2">Authorize Gmail read-only access and manually synchronize recent inbox messages.</p>
    {admins.map(m=><Link key={m.workspace_id} className="btn mt-4 mr-2" href={`/api/channels/gmail/connect?workspace=${m.workspace_id}`}>Connect Gmail · {Array.isArray(m.workspaces)?m.workspaces[0]?.name:(m.workspaces as {name:string}|null)?.name}</Link>)}
    {!admins.length&&<p className="text-slate-500 mt-4 text-sm">Create or administer a workspace to connect channels.</p>}
   </div>
   <div className="panel p-6">
    <MessageCircle className="text-brand" size={28}/><h3 className="font-bold text-xl mt-4">Outlook</h3>
    <p className="text-slate-500 text-sm mt-2">Connect Microsoft 365 or Outlook using Microsoft OAuth for read-only inbox imports.</p>
    {admins.map(m=><Link key={m.workspace_id} className="btn mt-4 mr-2" href={`/api/channels/outlook/connect?workspace=${m.workspace_id}`}>Connect Outlook · {Array.isArray(m.workspaces)?m.workspaces[0]?.name:(m.workspaces as {name:string}|null)?.name}</Link>)}
   </div>
  </div>
  <div className="panel p-6 mt-6">
   <div className="flex items-center gap-2"><ShieldCheck className="text-brand"/><h3 className="font-bold text-lg">Authorized accounts</h3></div>
   {connections?.length?connections.map(c=><div key={c.id} className="py-4 border-b flex flex-wrap items-center justify-between gap-3">
    <div><p className="font-semibold">{c.account_label||c.provider}</p><p className="text-slate-500 text-xs">{c.provider} · {c.status}</p></div>
    {c.status==="connected"&&(c.provider==="gmail"||c.provider==="outlook")&&<ChannelSyncButton connectionId={c.id} provider={c.provider}/>}
    {c.status==="connected"&&<form action={disconnectChannel}><input type="hidden" name="workspace_id" value={c.workspace_id}/><input type="hidden" name="connection_id" value={c.id}/><button className="border border-slate-200 rounded-xl px-4 py-2 text-sm">Disconnect</button></form>}
   </div>):<p className="text-slate-500 mt-4">No connected channels.</p>}
  </div>
 </div>;
}
