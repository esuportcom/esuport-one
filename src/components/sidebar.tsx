"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Layers3, LayoutDashboard, Inbox, Mail, History, MessagesSquare, Users, ShoppingBag, RotateCcw, Plug, Radio, Building2, UserRound, UsersRound, Tags, CreditCard, Settings, MessageCircleMore, Menu, X } from "lucide-react";

const groups = [
  ["SUPPORT", [["Overview", "/app", LayoutDashboard], ["Workspaces", "/app/workspaces", Layers3], ["Inbox", "/app/inbox", Inbox], ["Email Inbox", "/app/email", Mail], ["Conversations", "/app/conversations", MessagesSquare], ["Sync History", "/app/sync-history", History]]],
  ["ECOMMERCE", [["Customers", "/app/customers", Users], ["Orders", "/app/orders", ShoppingBag], ["Returns & Refunds", "/app/returns", RotateCcw]]],
  ["CHANNELS", [["Channels", "/app/channels", Radio], ["Integrations", "/app/integrations", Plug]]],
  ["AGENCY", [["Clients", "/app/clients", Building2], ["Agents", "/app/agents", UserRound], ["Teams", "/app/teams", UsersRound], ["Labels", "/app/labels", Tags], ["Saved Replies", "/app/replies", BookOpen]]],
  ["ACCOUNT", [["Plans & Billing", "/app/billing", CreditCard], ["Settings", "/app/settings", Settings]]],
] as const;

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="p-4">
      {groups.map(([group, items]) => (
        <section key={group} className="mb-5">
          <div className="text-[10px] font-bold tracking-widest text-slate-400 px-3 mb-2">{group}</div>
          {items.map(([label, href, Icon]) => (
            <Link className="navlink" key={href} href={href} onClick={onNavigate}>
              <Icon size={19} strokeWidth={1.8} />{label}
            </Link>
          ))}
        </section>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 lg:hidden rounded-xl bg-brand text-white p-2.5 shadow-lg"
      >
        <Menu size={21} />
      </button>

      <aside className="bg-white border-r border-slate-100 w-64 shrink-0 h-screen overflow-auto hidden lg:block">
        <Link href="/app" className="flex items-center gap-3 h-20 px-6 border-b border-slate-100">
          <span className="bg-brand text-white rounded-xl p-2"><MessageCircleMore size={24} /></span>
          <span className="text-xl font-extrabold tracking-tight">
            eSuport <span className="text-brand">One</span>
            <small className="block text-[10px] font-medium text-slate-400 tracking-normal">One Platform. Every Conversation.</small>
          </span>
        </Link>
        <Navigation />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-slate-950/40" onClick={() => setOpen(false)} />
          <aside className="relative z-10 bg-white w-[min(86vw,20rem)] h-full overflow-auto shadow-2xl">
            <div className="flex items-center justify-between h-20 px-5 border-b border-slate-100">
              <Link href="/app" onClick={() => setOpen(false)} className="flex items-center gap-3">
                <span className="bg-brand text-white rounded-xl p-2"><MessageCircleMore size={22} /></span>
                <span className="font-extrabold">eSuport <span className="text-brand">One</span></span>
              </Link>
              <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <Navigation onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
