"use client";

import { useEffect, useState } from "react";

const platforms = [
  ["facebook","Facebook"],["instagram","Instagram"],["linkedin","LinkedIn"],["twitter","X"],
  ["tiktok","TikTok"],["youtube","YouTube"],["pinterest","Pinterest"],["threads","Threads"],
  ["reddit","Reddit"],["bluesky","Bluesky"],["snapchat","Snapchat"],["telegram","Telegram"],["gmb","Google Business"]
] as const;

export default function SocialPublisher({ workspaceId }: { workspaceId: string }) {
  const [selected, setSelected] = useState<string[]>(["facebook","instagram","linkedin"]);
  const [post, setPost] = useState("");
  const [media, setMedia] = useState("");
  const [schedule, setSchedule] = useState("");
  const [accounts, setAccounts] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const r = await fetch(`/api/social/accounts?workspace=${encodeURIComponent(workspaceId)}`);
    const j = await r.json();
    setAccounts(j);
  }
  useEffect(() => { load(); }, [workspaceId]);

  function toggle(name: string) {
    setSelected((current) => current.includes(name) ? current.filter((p) => p !== name) : [...current, name]);
  }

  async function publish() {
    setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/social/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          post,
          platforms: selected,
          media_urls: media.split("\n").map((x) => x.trim()).filter(Boolean),
          schedule_date: schedule ? new Date(schedule).toISOString() : undefined
        })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Publishing failed");
      setMessage(j.status === "success" ? "Published successfully." : "Post submitted successfully.");
      setPost(""); setMedia(""); setSchedule("");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Publishing failed"); }
    finally { setBusy(false); }
  }

  const linked = accounts?.accounts?.profile?.socialNetworks || accounts?.accounts?.socialNetworks || accounts?.accounts?.networks || [];
  const linkedNames = Array.isArray(linked) ? linked.map((x:any) => String(x.platform || x.network || x.name || "").toLowerCase()) : [];

  return <div className="space-y-6">
    <div className="panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h3 className="text-xl font-bold">Social accounts</h3><p className="text-slate-500 text-sm mt-1">Connect your brand accounts, then publish from one composer.</p></div>
        <a className="btn" href={`/api/social/connect?workspace=${encodeURIComponent(workspaceId)}`}>Connect accounts</a>
      </div>
      {accounts?.error && <p className="text-amber-600 text-sm mt-4">{accounts.error}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-5">
        {platforms.map(([id,name]) => <div key={id} className={`rounded-xl border p-3 text-sm ${linkedNames.includes(id) ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><div className="font-semibold">{name}</div><div className="text-xs text-slate-500 mt-1">{linkedNames.includes(id) ? "Connected" : "Not connected"}</div></div>)}
      </div>
    </div>

    <div className="panel p-6">
      <h3 className="text-xl font-bold">Publish</h3>
      <p className="text-slate-500 text-sm mt-1">Create once and publish to multiple connected networks.</p>
      <textarea value={post} onChange={e=>setPost(e.target.value)} rows={6} placeholder="Write your post..." className="w-full border border-slate-200 rounded-xl p-4 mt-4 outline-none focus:ring-2 focus:ring-blue-100" />
      <input value={media} onChange={e=>setMedia(e.target.value)} placeholder="Public image/video URL(s), one per line" className="w-full border border-slate-200 rounded-xl p-3 mt-3" />
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <input type="datetime-local" value={schedule} onChange={e=>setSchedule(e.target.value)} className="border border-slate-200 rounded-xl p-3" />
        <div className="border border-slate-200 rounded-xl p-3 text-sm text-slate-500">Leave date empty to publish now.</div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {platforms.map(([id,name]) => <button type="button" key={id} onClick={()=>toggle(id)} className={`px-3 py-2 rounded-full text-sm border ${selected.includes(id) ? "bg-brand text-white border-brand" : "border-slate-200"}`}>{name}</button>)}
      </div>
      <div className="flex items-center gap-3 mt-5">
        <button type="button" disabled={busy || !post.trim() || !selected.length} onClick={publish} className="btn disabled:opacity-50">{busy ? "Publishing..." : schedule ? "Schedule post" : "Publish now"}</button>
        {message && <span className="text-sm text-slate-600" role="status">{message}</span>}
      </div>
    </div>
  </div>;
}
