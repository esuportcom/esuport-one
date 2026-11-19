import {createClient} from "@/lib/supabase/server";
export default async function SyncHistory(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const {data:members}=await supabase.from("workspace_members").select("workspace_id").eq("user_id",user.id).in("role",["owner","agency_admin"]);
 const ids=members?.map(x=>x.workspace_id)??[];
 const {data:runs}=ids.length?await supabase.from("channel_sync_runs").select("id,provider,status,processed,finished_at,error_message").in("workspace_id",ids).order("finished_at",{ascending:false}).limit(100):{data:[]};
 return <div><h2 className="text-3xl font-bold">Email Sync History</h2><p className="text-slate-500 mt-2">Recent Gmail and Outlook synchronization jobs.</p><div className="panel mt-6 p-6">{runs?.length?runs.map(r=><div key={r.id} className="border-b py-3 flex flex-wrap gap-3 justify-between"><span className="font-semibold capitalize">{r.provider}</span><span className={r.status==="success"?"text-green-700":"text-red-600"}>{r.status}</span><span className="text-slate-500">{r.processed} processed</span><span className="text-slate-500">{new Date(r.finished_at).toLocaleString()}</span>{r.error_message&&<span className="text-red-600 text-xs">{r.error_message}</span>}</div>):<p className="text-slate-500">No sync jobs yet.</p>}</div></div>
}
