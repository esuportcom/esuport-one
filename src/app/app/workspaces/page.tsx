
import {createWorkspace} from "../actions";
import {createClient} from "@/lib/supabase/server";
export default async function Workspaces(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const {data:members}=await supabase.from("workspace_members").select("workspace_id,role,workspaces(name)").eq("user_id",user.id);
 return <div className="max-w-3xl"><h2 className="text-3xl font-bold">Workspaces</h2><p className="text-slate-500 mt-2">Create a workspace for your business or agency.</p>
 <form action={createWorkspace} className="panel p-6 mt-6 space-y-4"><label className="block font-semibold text-sm">Workspace name<input className="field mt-2" name="name" minLength={2} maxLength={100} required placeholder="eSuport Agency"/></label><button className="btn">Create workspace</button></form>
 <div className="panel p-6 mt-6"><h3 className="font-bold mb-3">My workspaces</h3>{members?.length?members.map(m=><div className="py-3 border-b border-slate-100 flex justify-between" key={m.workspace_id}><span>{Array.isArray(m.workspaces)?m.workspaces[0]?.name:(m.workspaces as {name:string}|null)?.name}</span><span className="text-brand">{m.role}</span></div>):<p className="text-slate-500">No workspaces yet.</p>}</div></div>
}
