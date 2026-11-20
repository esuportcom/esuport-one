import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getProfile, revealProfileKey } from "@/lib/ayrshare";

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspace");
  if (!workspaceId) return NextResponse.json({ error: "workspace is required" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: member } = await supabase.from("workspace_members").select("role")
    .eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle();
  if (!member || !["owner","agency_admin"].includes(member.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: profile } = await adminClient().from("social_profiles")
    .select("profile_title,encrypted_profile_key,status").eq("workspace_id", workspaceId).maybeSingle();
  if (!profile) return NextResponse.json({ configured: false, accounts: [] });

  try {
    const data = await getProfile(revealProfileKey(profile.encrypted_profile_key));
    return NextResponse.json({ configured: true, status: profile.status, profile_title: profile.profile_title, accounts: data });
  } catch (error) {
    return NextResponse.json({ configured: true, status: "error", accounts: [], error: error instanceof Error ? error.message : "Unable to load accounts" }, { status: 502 });
  }
}
