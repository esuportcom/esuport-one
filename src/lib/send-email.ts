import {gmailAccessToken} from "@/lib/gmail";
import {outlookAccessToken} from "@/lib/outlook";
type Conn={id:string,workspace_id:string,provider:string,encrypted_access_token:string|null,encrypted_refresh_token:string|null,token_expires_at:string|null};
function safeHeader(s:string){return s.replace(/[\r\n\x00-\x1f\x7f]/g," ").trim()}
function encodeHeader(s:string){return /[^\x20-\x7e]/.test(s)?`=?UTF-8?B?${Buffer.from(s).toString("base64")}?=`:s}
export async function sendProviderReply(conn:Conn,to:string,subject:string,body:string,externalMessageId:string,threadId:string){
 if(conn.provider==="gmail"){
  const token=await gmailAccessToken(conn);
  const subjectHeader=encodeHeader(safeHeader(subject));
  const raw=[`To: ${safeHeader(to)}`,`Subject: ${subjectHeader}`,"MIME-Version: 1.0",'Content-Type: text/plain; charset="UTF-8"',"Content-Transfer-Encoding: base64","",Buffer.from(body,"utf8").toString("base64")].join("\r\n");
  const response=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({raw:Buffer.from(raw).toString("base64url"),threadId}),cache:"no-store"});
  if(!response.ok)throw new Error(`Gmail send rejected (${response.status}); reconnect with Gmail send permission`);
  const result=await response.json() as {id?:string};return result.id||"sent";
 }
 if(conn.provider==="outlook"){
  const token=await outlookAccessToken(conn);
  // Graph reply operation uses the actual provider message ID, preserving conversation threading.
  const response=await fetch(`https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(externalMessageId)}/reply`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({comment:body}),cache:"no-store"});
  if(!response.ok)throw new Error(`Microsoft reply rejected (${response.status}); reconnect with Mail.Send permission`);
  return "sent";
 }
 throw new Error("Unsupported provider");
}
