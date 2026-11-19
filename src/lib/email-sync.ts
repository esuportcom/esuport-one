import {adminClient} from "@/lib/supabase/admin";
import {gmailAccessToken,gmailGet,textBody} from "@/lib/gmail";
import {outlookAccessToken,graphGet} from "@/lib/outlook";
type Conn={id:string,workspace_id:string,provider:string,status:string,encrypted_access_token:string|null,encrypted_refresh_token:string|null,token_expires_at:string|null};
type GMsg={id:string,threadId:string,snippet?:string,internalDate?:string,payload?:{mimeType?:string,body?:{data?:string},parts?:any[],headers?:{name:string,value:string}[]}};
type OMsg={id:string,conversationId?:string,from?:{emailAddress?:{address?:string}},toRecipients?:{emailAddress?:{address?:string}}[],subject?:string,bodyPreview?:string,body?:{content?:string},receivedDateTime?:string};
export async function syncConnection(c:Conn){
 if(c.status!=="connected"||!["gmail","outlook"].includes(c.provider))throw new Error("Unsupported or disconnected channel");
 const admin=adminClient();let processed=0;
 try{
  if(c.provider==="gmail"){
   const token=await gmailAccessToken(c);
   const list=await gmailGet<{messages?:{id:string}[]}>(token,"messages?maxResults=25&labelIds=INBOX");
   for(const item of list.messages||[]){
    const m=await gmailGet<GMsg>(token,`messages/${encodeURIComponent(item.id)}?format=full`);
    const header=(name:string)=>m.payload?.headers?.find(h=>h.name.toLowerCase()===name)?.value||"";
    const {error}=await admin.from("external_messages").upsert({workspace_id:c.workspace_id,connection_id:c.id,provider:"gmail",external_message_id:m.id,external_thread_id:m.threadId,sender:header("from"),recipient:header("to"),subject:header("subject"),snippet:m.snippet||"",body_text:m.payload?textBody(m.payload):"",received_at:m.internalDate?new Date(Number(m.internalDate)).toISOString():null},{onConflict:"connection_id,external_message_id",ignoreDuplicates:true});
    if(error)throw error;processed++;
   }
  }else{
   const token=await outlookAccessToken(c);
   const result=await graphGet<{value:OMsg[]}>(token,"me/mailFolders/inbox/messages?$top=25&$select=id,conversationId,from,toRecipients,subject,bodyPreview,body,receivedDateTime&$orderby=receivedDateTime%20desc");
   for(const m of result.value||[]){
    if(!m.id)continue;
    const {error}=await admin.from("external_messages").upsert({workspace_id:c.workspace_id,connection_id:c.id,provider:"outlook",external_message_id:m.id,external_thread_id:m.conversationId||m.id,sender:m.from?.emailAddress?.address||"",recipient:(m.toRecipients||[]).map(x=>x.emailAddress?.address).filter(Boolean).join(", "),subject:m.subject||"",snippet:m.bodyPreview||"",body_text:(m.body?.content||"").slice(0,100000),received_at:m.receivedDateTime||null},{onConflict:"connection_id,external_message_id",ignoreDuplicates:true});
    if(error)throw error;processed++;
   }
  }
  const {error}=await admin.from("channel_sync_state").upsert({connection_id:c.id,last_synced_at:new Date().toISOString(),last_error:null,imported_count:processed},{onConflict:"connection_id"});if(error)throw error;
  await admin.from("channel_sync_runs").insert({workspace_id:c.workspace_id,connection_id:c.id,provider:c.provider,status:"success",processed});
  return processed;
 }catch(e){
  const message=e instanceof Error?e.message:"Synchronization failed";
  await admin.from("channel_sync_state").upsert({connection_id:c.id,last_error:message},{onConflict:"connection_id"});
  await admin.from("channel_sync_runs").insert({workspace_id:c.workspace_id,connection_id:c.id,provider:c.provider,status:"error",processed,error_message:message.slice(0,500)});
  throw e;
 }
}
