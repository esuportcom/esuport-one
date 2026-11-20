import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SocialPublisher from "@/components/social-publisher";

export default async function SocialPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
  const { workspace } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: members } = await supabase.from("workspace_members")
    .select("workspace_id,role,workspaces(name)")
    .eq("user_id", user.id);
  const admins = (members ?? []).filter(m => ["owner","agency_admin"].includes(m.role));
  const active = workspace && admins.some(m => m.workspace_id === workspace) ? workspace : admins[0]?.workspace_id;

  if (!active) return <div className="panel p-8"><h2 className="text-2xl font-bold">Social Publishing</h2><p className="text-slate-500 mt-2">Create or administer a workspace first.</p><Link className="btn inline-block mt-5" href="/app/workspaces">Manage workspaces</Link></div>;

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div><h2 className="text-3xl font-bold">Social Publishing</h2><p className="text-slate-500 mt-2">Connect and publish to your brand's social channels from eSuport One.</p></div>
      {admins.length > 1 && <form><select name="workspace" defaultValue={active} className="border border-slate-200 rounded-xl p-3" onChange={e=>{ window.location.href=`/app/social?workspace=${e.target.value}`; }}><option value="">Select workspace</option>{admins.map(m=><option key={m.workspace_id} value={m.workspace_id}>{Array.isArray(m.workspaces)?m.workspaces[0]?.name:(m.workspaces as any)?.name}</option>)}</select></form>}
    </div>
    <SocialPublisher workspaceId={active} />
  </div>;
}
