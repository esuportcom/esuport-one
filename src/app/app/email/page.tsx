import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
export default async function EmailInbox(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const {data:members}=await supabase.from("workspace_members").select("workspace_id").eq("user_id",user.id);const ids=members?.map(m=>m.workspace_id)||[];
 const {data:messages,error}=ids.length?await supabase.from("external_messages").select("id,sender,subject,snippet,received_at,provider").in("workspace_id",ids).order("received_at",{ascending:false}).limit(100):{data:[],error:null};
 return <div><h2 className="text-3xl font-bold">Email Inbox</h2><p className="text-slate-500 mt-2">Read-only Gmail and Outlook imports. To refresh, use Sync on the Channels page.</p><div className="panel mt-6 divide-y divide-slate-100">{error?<p className="p-5 text-red-600">Could not load messages. Apply migration 0006.</p>:messages?.length?messages.map(m=><Link href={`/app/email/${m.id}`} className="block p-5 hover:bg-blue-50" key={m.id}><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{m.subject||"(No subject)"}</p><span className="text-xs text-slate-400">{m.received_at?new Date(m.received_at).toLocaleString():""}</span></div><p className="text-sm text-brand mt-1">{m.sender||"Unknown sender"}</p><p className="text-sm text-slate-500 mt-2">{m.snippet}</p></Link>):<p className="p-6 text-slate-500">No imported emails. Connect Gmail and run a sync.</p>}</div></div>
}
