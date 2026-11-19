"use client";
import {useState} from "react";
export default function EmailReply({messageId}:{messageId:string}){
 const [body,setBody]=useState(""),[busy,setBusy]=useState(false),[status,setStatus]=useState("");
 async function send(e:React.FormEvent){e.preventDefault();if(!window.confirm("Send this reply through your connected email account?"))return;
 setBusy(true);setStatus("");try{const res=await fetch("/api/email/reply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messageId,body})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Unable to send");setStatus("Reply sent.");setBody("")}catch(e){setStatus(e instanceof Error?e.message:"Unable to send")}finally{setBusy(false)}}
 return <form onSubmit={send} className="panel p-5 mt-5"><h3 className="font-bold mb-3">Reply by email</h3><textarea className="field min-h-32" value={body} maxLength={10000} required onChange={e=>setBody(e.target.value)} placeholder="Write your reply..."/><div className="flex justify-between items-center mt-3 gap-4"><p role="status" className="text-sm text-slate-500">{status}</p><button disabled={busy||!body.trim()} className="btn">{busy?"Sending...":"Send reply"}</button></div><p className="text-xs text-slate-500 mt-3">Requires reconnection with Gmail Send or Microsoft Mail.Send permission.</p></form>
}
