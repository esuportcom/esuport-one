import { createDemoWorkspace, createWorkspace } from "../actions";
import { createClient } from "@/lib/supabase/server";

type WorkspacesProps = {
  searchParams: Promise<{ demo?: string; setup?: string }>;
};

export default async function Workspaces({ searchParams }: WorkspacesProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id,role,workspaces(name)")
    .eq("user_id", user.id);

  return (
    <div className="max-w-3xl">
      <h2 className="text-3xl font-bold">Workspaces</h2>
      <p className="text-slate-500 mt-2">
        Create a workspace for your business or agency, or load a sample workspace to explore eSuport One.
      </p>

      {params.setup === "required" && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 mt-6 text-sm text-amber-900">
          The Supabase database setup is incomplete. Apply migrations 0001–0010 in order, then retry. No demo records were added.
        </div>
      )}

      {params.demo === "created" && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 mt-6 text-sm text-green-900">
          Your demo workspace is ready. It includes sample customers, conversations, labels, internal notes, and saved replies.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5 mt-6">
        <form action={createWorkspace} className="panel p-6 space-y-4">
          <h3 className="font-bold text-lg">Create your workspace</h3>
          <label className="block font-semibold text-sm">
            Workspace name
            <input
              className="field mt-2"
              name="name"
              minLength={2}
              maxLength={100}
              required
              placeholder="eSuport Agency"
            />
          </label>
          <button className="btn w-full">Create workspace</button>
        </form>

        <form action={createDemoWorkspace} className="panel p-6 space-y-4">
          <h3 className="font-bold text-lg">Explore with demo data</h3>
          <p className="text-sm text-slate-500">
            Create a separate “eSuport One Demo Workspace” with fictional UAE customer examples. Safe to run more than once.
          </p>
          <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
            <li>3 sample customers</li>
            <li>3 conversations and internal notes</li>
            <li>Urgent, Shipping, and Returns labels</li>
            <li>3 reusable reply templates</li>
          </ul>
          <button className="btn w-full">Create demo workspace</button>
        </form>
      </div>

      <div className="panel p-6 mt-6">
        <h3 className="font-bold mb-3">My workspaces</h3>
        {members?.length ? (
          members.map((member) => (
            <div
              className="py-3 border-b border-slate-100 flex justify-between gap-4"
              key={member.workspace_id}
            >
              <span>
                {Array.isArray(member.workspaces)
                  ? member.workspaces[0]?.name
                  : (member.workspaces as { name: string } | null)?.name}
              </span>
              <span className="text-brand">{member.role}</span>
            </div>
          ))
        ) : (
          <p className="text-slate-500">No workspaces yet. Create one or load the demo workspace above.</p>
        )}
      </div>
    </div>
  );
}
