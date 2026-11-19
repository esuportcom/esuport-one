"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/browser";
export default function InboxRealtime({workspaceIds}:{workspaceIds:string[]}){
 const router=useRouter();
 const ids=workspaceIds.join(",");
 useEffect(()=>{
  if(!ids)return;
  const supabase=createClient();
  // Workspace-specific subscriptions; RLS controls what rows the user can receive.
  const channels=ids.split(",").map(id=>supabase.channel(`inbox-${id}`)
   .on("postgres_changes",{event:"*",schema:"public",table:"conversations",filter:`workspace_id=eq.${id}`},()=>router.refresh())
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`workspace_id=eq.${id}`},()=>router.refresh())
   .subscribe());
  return ()=>{channels.forEach(c=>{void supabase.removeChannel(c)})};
 },[ids,router]);
 return null;
}
