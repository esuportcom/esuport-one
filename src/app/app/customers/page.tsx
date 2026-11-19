import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {createContact} from "../actions";

export default async function Customers({searchParams}:{searchParams:Promise<{search?:string,workspace?:string,channel?:string}>}){
 const params=await searchParams;
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const {data:members}=await supabase.from("workspace_members").select("workspace_id,workspaces(name)").eq("user_id",user.id);
 const ids=members?.map(m=>m.workspace_id)??[];
 const selectedWorkspace=params.workspace&&ids.includes(params.workspace)?params.workspace:"";
 const selectedChannel=["Email","WhatsApp","Instagram","Facebook"].includes(params.channel||"")?params.channel:"";
 const search=(params.search||"").trim();
 const scopedIds=selectedWorkspace?[selectedWorkspace]:ids;
 let query=supabase.from("contacts").select("id,name,email,phone,channel,workspace_id,created_at").in("workspace_id",scopedIds).order("created_at",{ascending:false}).limit(200);
 if(search) query=query.ilike("name",`%${search}%`);
 if(selectedChannel) query=query.eq("channel",selectedChannel);
 const {data:contacts}=scopedIds.length?await query:{data:[]};
 const total=contacts?.length??0;
 const channels=(contacts??[]).reduce<Record<string,number>>((acc,c)=>{const key=c.channel||"Other";acc[key]=(acc[key]||0)+1;return acc;},{});
 return <div>
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"><div><h2 className="text-3xl font-bold">Customers</h2><p className="text-slate-500 mt-2">Search, segment and manage tenant-scoped customer records.</p></div><div className="flex gap-2 text-xs">{Object.entries(channels).slice(0,4).map(([k,v])=><span key={k} className="rounded-full bg-blue-50 px-3 py-1">{k}: {v}</span>)}</div></div>
  <div className="grid lg:grid-cols-3 gap-5 mt-7">
   <form action={createContact} className="panel p-6 space-y-4"><h3 className="font-bold text-lg">Add customer</h3><label className="text-sm block">Workspace<select className="field mt-2" name="workspace_id" required>{members?.map(m=><option key={m.workspace_id} value={m.workspace_id}>{Array.isArray(m.workspaces)?m.workspaces[0]?.name:(m.workspaces as {name:string}|null)?.name}</option>)}</select></label><label className="text-sm block">Name<input className="field mt-2" name="name" maxLength={120} required/></label><label className="text-sm block">Channel<select className="field mt-2" name="channel"><option value="">Not specified</option><option>Email</option><option>WhatsApp</option><option>Instagram</option><option>Facebook</option></select></label><button disabled={!ids.length} className="btn w-full">Add customer</button></form>
   <div className="panel p-6 lg:col-span-2">
    <form method="get" className="grid sm:grid-cols-[1fr_160px_160px_auto] gap-2 mb-5"><input name="search" defaultValue={search} className="field" placeholder="Search customer name..."/><select name="channel" defaultValue={selectedChannel} className="field"><option value="">All channels</option><option>Email</option><option>WhatsApp</option><option>Instagram</option><option>Facebook</option></select><select name="workspace" defaultValue={selectedWorkspace} className="field"><option value="">All workspaces</option>{members?.map(m=><option key={m.workspace_id} value={m.workspace_id}>{Array.isArray(m.workspaces)?m.workspaces[0]?.name:(m.workspaces as {name:string}|null)?.name}</option>)}</select><button className="btn">Filter</button></form>
    <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-lg">Customer directory</h3><span className="text-xs text-slate-500">{total} shown</span></div>
    {contacts?.length?contacts.map(c=><div key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 py-4"><div><Link href={`/app/customers/${c.id}`} className="text-brand font-semibold hover:underline">{c.name}</Link><p className="text-xs text-slate-500 mt-1">{c.email||c.phone||"No contact details"}</p></div><span className="text-slate-500 text-sm">{c.channel||"—"}</span></div>):<p className="text-slate-500">No customers match the current filters.</p>}
   </div>
  </div>
 </div>;
}
