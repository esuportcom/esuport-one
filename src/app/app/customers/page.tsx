import Link from "next/link";

import {createClient} from "@/lib/supabase/server";
import {createContact} from "../actions";
export default async function Customers(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const {data:members}=await supabase.from("workspace_members").select("workspace_id,workspaces(name)").eq("user_id",user.id);
 const ids=members?.map(m=>m.workspace_id)??[];
 const {data:contacts}=ids.length?await supabase.from("contacts").select("id,name,channel,workspace_id").in("workspace_id",ids).order("created_at",{ascending:false}).limit(100):{data:[]};
 return <div><h2 className="text-3xl font-bold">Customers</h2><p className="text-slate-500 mt-2">Tenant-scoped customer records</p>
 <div className="grid lg:grid-cols-3 gap-5 mt-7"><form action={createContact} className="panel p-6 space-y-4"><h3 className="font-bold text-lg">Add customer</h3><label className="text-sm block">Workspace<select className="field mt-2" name="workspace_id" required>{members?.map(m=><option key={m.workspace_id} value={m.workspace_id}>{Array.isArray(m.workspaces)?m.workspaces[0]?.name:(m.workspaces as {name:string}|null)?.name}</option>)}</select></label><label className="text-sm block">Name<input className="field mt-2" name="name" maxLength={120} required/></label><label className="text-sm block">Channel<select className="field mt-2" name="channel"><option value="">Not specified</option><option>Email</option><option>WhatsApp</option><option>Instagram</option><option>Facebook</option></select></label><button disabled={!ids.length} className="btn w-full">Add customer</button></form>
 <div className="panel p-6 lg:col-span-2"><h3 className="font-bold text-lg mb-4">Customer directory</h3>{contacts?.length?contacts.map(c=><div key={c.id} className="flex justify-between border-b border-slate-100 py-3"><Link href={`/app/customers/${c.id}`} className="text-brand hover:underline">{c.name}</Link><span className="text-slate-500 text-sm">{c.channel||"—"}</span></div>):<p className="text-slate-500">No customers yet.</p>}</div></div></div>
}
