import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { publishPost, revealProfileKey } from "@/lib/ayrshare";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const workspaceId = String(body?.workspace_id || "");
  const post = String(body?.post || "").trim();
  const platforms = Array.isArray(body?.platforms) ? body.platforms.map(String).filter(Boolean) : [];
  const mediaUrls = Array.isArray(body?.media_urls) ? body.media_urls.map(String).filter(Boolean) : [];
  const scheduleDate = body?.schedule_date ? String(body.schedule_date) : undefined;

  if (!workspaceId || !post || !platforms.length) {
    return NextResponse.json({ error: "workspace_id, post and at least one platform are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: member } = await supabase.from("workspace_members").select("role")
    .eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle();
  if (!member || !["owner","agency_admin"].includes(member.role)) return NextResponse.json({ error: "Workspace admin access required" }, { status: 403 });

  const { data: profile } = await adminClient().from("social_profiles")
    .select("id,encrypted_profile_key").eq("workspace_id", workspaceId).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Connect social accounts first" }, { status: 409 });

  const payload = { post, platforms, ...(mediaUrls.length ? { mediaUrls } : {}), ...(scheduleDate ? { scheduleDate } : {}) };
  try {
    const result = await publishPost(revealProfileKey(profile.encrypted_profile_key), payload);
    const status = result.status === "success" ? "success" : scheduleDate ? "scheduled" : "pending";
    await adminClient().from("social_posts").insert({
      workspace_id: workspaceId,
      social_profile_id: profile.id,
      provider_post_id: result.id ? String(result.id) : null,
      post_text: post,
      platforms,
      media_urls: mediaUrls,
      schedule_date: scheduleDate || null,
      status,
      response: result,
      created_by: user.id
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publishing failed";
    await adminClient().from("social_posts").insert({
      workspace_id: workspaceId,
      social_profile_id: profile.id,
      post_text: post,
      platforms,
      media_urls: mediaUrls,
      schedule_date: scheduleDate || null,
      status: "error",
      response: { error: message },
      created_by: user.id
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
