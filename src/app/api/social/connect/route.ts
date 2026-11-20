import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { createProfile, generateConnectUrl, protectProfileKey } from "@/lib/ayrshare";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspace");
  if (!workspaceId) return NextResponse.json({ error: "workspace is required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.from("workspace_members")
    .select("role").eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle();
  if (!member || !["owner","agency_admin"].includes(member.role)) {
    return NextResponse.json({ error: "Workspace admin access required" }, { status: 403 });
  }

  const admin = adminClient();
  let { data: profile } = await admin.from("social_profiles").select("id,profile_ref,profile_title,encrypted_profile_key")
    .eq("workspace_id", workspaceId).maybeSingle();

  if (!profile) {
    const created = await createProfile(`eSuport One · ${workspaceId.slice(0, 8)}`);
    const { data, error } = await admin.from("social_profiles").insert({
      workspace_id: workspaceId,
      profile_ref: created.refId,
      profile_title: created.title,
      encrypted_profile_key: protectProfileKey(created.profileKey),
      created_by: user.id
    }).select("id,profile_ref,profile_title,encrypted_profile_key").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    profile = data;
  }

  const redirect = new URL("/app/social", url.origin).toString();
  const connectUrl = await generateConnectUrl(
    // encrypted key is decrypted only on the server
    (await import("@/lib/ayrshare")).revealProfileKey(profile.encrypted_profile_key),
    redirect
  );
  return NextResponse.redirect(connectUrl);
}
