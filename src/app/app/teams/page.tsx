import {createClient} from "@/lib/supabase/server";
import {createInvitation} from "../team-actions";
import {headers} from "next/headers";
export default async function Teams({searchParams}:{searchParams:Promise<{invite?:string}>}){
 const {invite}=await searchParams;
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const {data:memberships}=await supabase.from("workspace_members").select("workspace_id,role,workspaces(name)").eq("user_id",user.id);
 const managed=memberships?.filter(m=>["owner","agency_admin"].includes(m.role))??[];
 const ids=memberships?.map(m=>m.workspace_id)??[];
 const {data:team}=ids.length?await supabase.from("workspace_members").select("workspace_id,user_id,role").in("workspace_id",ids).limit(200):{data:[]};
 const {data:invitations}=managed.length?await supabase.from("workspace_invitations").select("id,workspace_id,email,role,expires_at,accepted_at").in("workspace_id",managed.map(m=>m.workspace_id)).order("created_at",{ascending:false}).limit(100):{data:[]};
 const host=(await headers()).get("host")||"localhost:3000";
 const origin=(process.env.NEXT_PUBLIC_SITE_URL||`http://${host}`).replace(/\/$/,"");
 return <div><h2 className="text-3xl font-bold">Team & Invitations</h2><p className="text-slate-500 mt-2">Invite colleagues using secure one-time links.</p>
 {invite&&<div className="panel p-5 mt-5"><p className="font-bold">Invitation created — copy this link now</p><p className="text-sm text-slate-500 my-2">This link is displayed once; share it privately with the intended recipient.</p><input readOnly className="field" value={`${origin}/invite/${invite}`}/></div>}
 <div className="grid lg:grid-cols-2 gap-5 mt-6"><form action={createInvitation} className="panel p-6 space-y-4"><h3 className="font-bold text-lg">Invite teammate</h3><label className="block text-sm">Workspace<select className="field mt-2" name="workspace_id" required>{managed.map(m=><option key={m.workspace_id} value={m.workspace_id}>{Array.isArray(m.workspaces)?m.workspaces[0]?.name:(m.workspaces as {name:string}|null)?.name}</option>)}</select></label><label className="block text-sm">Email<input name="email" type="email" required maxLength={254} className="field mt-2"/></label><label className="block text-sm">Role<select name="role" className="field mt-2"><option value="agency_agent">Agency Agent</option><option value="agency_admin">Agency Admin</option><option value="client_admin">Client Admin</option></select></label><button disabled={!managed.length} className="btn">Create invitation</button><p className="text-xs text-slate-500">Email sending is not configured. Share the generated link manually.</p></form>
 <div className="panel p-6"><h3 className="font-bold text-lg">Workspace members</h3>{team?.length?team.map(m=><div className="flex justify-between py-3 border-b" key={`${m.workspace_id}:${m.user_id}`}><span className="text-sm font-mono">{m.user_id.slice(0,8)}…</span><span className="text-sm text-brand">{m.role}</span></div>):<p className="text-slate-500 mt-4">No members yet.</p>}</div></div>
 <div className="panel p-6 mt-6"><h3 className="font-bold text-lg">Invitation status</h3>{invitations?.length?invitations.map(i=><div className="flex flex-wrap justify-between gap-3 py-3 border-b" key={i.id}><span>{i.email}</span><span className="text-sm text-slate-500">{i.role} · {i.accepted_at?"Accepted":new Date(i.expires_at)<new Date()?"Expired":"Pending"}</span></div>):<p className="text-slate-500 mt-3">No invitations yet.</p>}</div></div>
}
