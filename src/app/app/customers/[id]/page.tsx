import Link from "next/link";
import {notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {updateCustomerProfile} from "../../inbox-extras-actions";

export default async function CustomerProfile({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const {data:members}=await supabase.from("workspace_members").select("workspace_id").eq("user_id",user.id);
 const ids=members?.map(m=>m.workspace_id)??[];
 if(!ids.length)notFound();
 const {data:c}=await supabase.from("contacts").select("id,workspace_id,name,email,phone,channel,notes").eq("id",id).in("workspace_id",ids).maybeSingle();
 if(!c)notFound();
 const {data:conversations}=await supabase.from("conversations").select("id,subject,status,updated_at").eq("workspace_id",c.workspace_id).eq("contact_id",c.id).order("updated_at",{ascending:false}).limit(25);
 return <div className="max-w-4xl">
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"><div><h2 className="text-3xl font-bold">Customer Profile</h2><p className="text-slate-500 mt-2">Customer details, internal notes and conversation history.</p></div><Link href="/app/customers" className="text-brand font-semibold">← Customers</Link></div>
  <div className="grid lg:grid-cols-2 gap-5 mt-7">
   <form action={updateCustomerProfile} className="panel p-7 space-y-4"><input type="hidden" name="workspace_id" value={c.workspace_id}/><input type="hidden" name="contact_id" value={c.id}/><label className="block text-sm">Name<input className="field mt-2" name="name" required maxLength={120} defaultValue={c.name}/></label><label className="block text-sm">Email<input className="field mt-2" name="email" type="email" maxLength={254} defaultValue={c.email||""}/></label><label className="block text-sm">Phone<input className="field mt-2" name="phone" maxLength={40} defaultValue={c.phone||""}/></label><label className="block text-sm">Channel<select className="field mt-2" name="channel" defaultValue={c.channel||""}><option value="">Not specified</option><option>Email</option><option>WhatsApp</option><option>Instagram</option><option>Facebook</option></select></label><label className="block text-sm">Notes<textarea className="field mt-2" name="notes" rows={5} maxLength={2000} defaultValue={c.notes||""}/></label><button className="btn">Save customer</button></form>
   <div className="panel p-7"><h3 className="font-bold text-lg">Conversation history</h3>{conversations?.length?conversations.map(x=><Link key={x.id} href={`/app/inbox?conversation=${x.id}&workspace=${c.workspace_id}`} className="block border-b border-slate-100 py-4 hover:bg-slate-50"><p className="font-semibold">{x.subject||"Conversation"}</p><p className="text-xs text-slate-500 mt-1 capitalize">{x.status} · {new Date(x.updated_at).toLocaleString()}</p></Link>):<p className="text-slate-500 text-sm mt-4">No conversations for this customer yet.</p>}</div>
  </div>
 </div>;
}
