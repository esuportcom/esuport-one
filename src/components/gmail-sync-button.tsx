"use client";
import {useRouter} from "next/navigation";import {useState} from "react";
export default function GmailSyncButton({connectionId}:{connectionId:string}){
 const [loading,setLoading]=useState(false),[status,setStatus]=useState("");const router=useRouter();
 async function sync(){setLoading(true);setStatus("");try{const response=await fetch("/api/channels/gmail/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({connection_id:connectionId})});const result=await response.json();if(!response.ok)throw new Error(result.error||"Sync failed");setStatus(`Processed ${result.processed} messages`);router.refresh()}catch(e){setStatus(e instanceof Error?e.message:"Sync failed")}finally{setLoading(false)}}
 return <div className="flex items-center gap-2"><button type="button" disabled={loading} onClick={sync} className="btn">{loading?"Syncing...":"Sync Gmail"}</button>{status&&<span role="status" className="text-xs text-slate-500">{status}</span>}</div>
}
