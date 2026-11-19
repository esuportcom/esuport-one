import Link from "next/link";
import {
  MessageSquareText,
  Clock3,
  CheckCircle2,
  Users,
  FolderKanban,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function Overview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id,role,workspaces(name)")
    .eq("user_id", user.id)
    .limit(10);

  const workspaceIds = (memberships ?? []).map((membership) => membership.workspace_id);
  const [conversationStats, activeStats, customerStats] = workspaceIds.length
    ? await Promise.all([
        supabase.from("conversations").select("*", { count: "exact", head: true }).in("workspace_id", workspaceIds),
        supabase.from("conversations").select("*", { count: "exact", head: true }).in("workspace_id", workspaceIds).in("status", ["open", "pending"]),
        supabase.from("contacts").select("*", { count: "exact", head: true }).in("workspace_id", workspaceIds),
      ])
    : [{ count: 0 }, { count: 0 }, { count: 0 }];

  const totalConversations = conversationStats.count ?? 0;
  const activeConversations = activeStats.count ?? 0;
  const totalCustomers = customerStats.count ?? 0;
  const resolved = Math.max(totalConversations - activeConversations, 0);
  const resolutionRate = totalConversations ? Math.round((resolved / totalConversations) * 100) : 0;

  return (
    <>
      <div className="flex justify-between items-start mb-7 gap-4">
        <div>
          <h2 className="text-3xl font-bold">Welcome to eSuport One 👋</h2>
          <p className="text-slate-500 mt-1">Your support workspace at a glance.</p>
        </div>
        <Link className="btn" href="/app/inbox">
          Open inbox <ArrowUpRight className="ml-2" size={16} />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: MessageSquareText, label: "Conversations", value: String(totalConversations) },
          { icon: Clock3, label: "Active", value: String(activeConversations) },
          { icon: Users, label: "Customers", value: String(totalCustomers) },
          { icon: CheckCircle2, label: "Resolved rate", value: totalConversations ? String(resolutionRate) + "%" : "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div className="panel p-6" key={label}>
            <div className="bg-blue-50 text-brand w-fit p-3 rounded-xl">
              <Icon />
            </div>
            <p className="text-slate-500 text-sm mt-5">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        <div className="panel p-6">
          <h3 className="font-bold text-lg">Your workspaces</h3>
          <div className="mt-4 space-y-3">
            {memberships?.length ? (
              memberships.map((membership) => (
                <div
                  key={membership.workspace_id}
                  className="border border-slate-100 rounded-xl p-4 flex justify-between gap-3"
                >
                  <span>
                    {Array.isArray(membership.workspaces)
                      ? membership.workspaces[0]?.name
                      : (membership.workspaces as { name: string } | null)?.name}
                  </span>
                  <span className="text-brand text-sm">{membership.role}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">
                No workspace yet. Create one or load the demo workspace to explore the app.
              </p>
            )}
          </div>
          <Link
            href="/app/workspaces"
            className="text-brand inline-flex items-center gap-2 mt-5 font-semibold"
          >
            <Sparkles size={16} /> Manage workspaces and demo data
          </Link>
        </div>

        <div className="panel p-6">
          <h3 className="font-bold text-lg">Quick start</h3>
          <div className="space-y-3 mt-4">
            <Link href="/app/workspaces" className="block rounded-xl bg-blue-50 p-4">
              <p className="font-semibold">1. Create workspace</p><p className="text-xs text-slate-500 mt-1">Set up your support operation.</p>
            </Link>
            <Link href="/app/workspaces" className="block rounded-xl bg-slate-50 p-4">
              <p className="font-semibold">2. Load demo data</p><p className="text-xs text-slate-500 mt-1">Explore customers and conversations.</p>
            </Link>
            <Link href="/app/inbox" className="block rounded-xl bg-slate-50 p-4">
              <p className="font-semibold">3. Open inbox</p><p className="text-xs text-slate-500 mt-1">Work through conversations and notes.</p>
            </Link>
          </div>
        </div>

        <div className="panel p-6">
          <h3 className="font-bold text-lg">Explore the demo</h3>
          <p className="text-slate-500 mt-3">
            Try eSuport One with fictional UAE customer profiles, sample conversations,
            internal notes, labels, and saved replies. Demo records are kept in a separate
            workspace and do not send messages.
          </p>
          <Link href="/app/workspaces" className="text-brand inline-block mt-5 font-semibold">
            Create demo workspace →
          </Link>
          <p className="text-xs text-slate-400 mt-4">
            Connect Gmail or Outlook later from Channels when provider credentials are configured.
          </p>
        </div>
      </div>

      <div className="panel p-6 mt-5">
        <div className="flex items-center gap-3"><FolderKanban className="text-brand" /><h3 className="font-bold text-lg">v1.3 inbox productivity</h3></div>
        <p className="text-slate-500 mt-2">Dashboard totals are read directly from your Supabase workspace data. Inbox search, status filters and workspace filtering are now available for faster support triage.</p>
      </div>
    </>
  );
}
