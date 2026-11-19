import Sidebar from "@/components/sidebar";
import Link from "next/link";
import { Bell, Search } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="bg-white/90 border-b border-slate-100 min-h-20 flex items-center justify-between px-5 md:px-8 gap-4 pl-16 lg:pl-8">
          <div className="min-w-0">
            <h1 className="font-bold text-xl truncate">eSuport One</h1>
            <p className="text-xs text-slate-400 truncate">Modern Blue Workspace</p>
          </div>
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <Search className="text-slate-400 hidden sm:block" size={19} />
            <Bell className="text-slate-500" size={19} />
            <Link href="/app/settings" className="rounded-full bg-blue-100 text-brand font-bold px-3 py-2">ES</Link>
          </div>
        </header>
        <main className="p-4 sm:p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
