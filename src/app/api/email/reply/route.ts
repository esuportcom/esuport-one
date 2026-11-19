import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {adminClient} from "@/lib/supabase/admin";
import {isUuid} from "@/lib/channels";
import {sendProviderReply} from "@/lib/send-email";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 let input:{messageId?:string,body?:string};try{input=await req.json()}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
 const id=input.messageId||"",body=(input.body||"").trim();
 if(!isUuid(id)||!body||body.length>10000)return NextResponse.json({error:"Invalid reply"},{status:400});
 const {data:message}=await supabase.from("external_messages").select("id,workspace_id,connection_id,provider,external_message_id,external_thread_id,sender,subject").eq("id",id).maybeSingle();
 if(!message)return NextResponse.json({error:"Message not found"},{status:404});
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",message.workspace_id).eq("user_id",user.id).maybeSingle();
 if(!member||!["owner","agency_admin","agency_agent","client_admin"].includes(member.role))return NextResponse.json({error:"Forbidden"},{status:403});
 // Only reply to a sender address taken from the previously imported email; no arbitrary recipient.
 const address=message.sender?.match(/<([^<>@\s]+@[^<>@\s]+)>/)?.[1]||message.sender?.trim()||"";
 if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address)||/[\r\n]/.test(address))return NextResponse.json({error:"Sender email is invalid"},{status:400});
 const admin=adminClient();
 const {data:conn}=await admin.from("channel_connections").select("id,workspace_id,provider,status,encrypted_access_token,encrypted_refresh_token,token_expires_at").eq("id",message.connection_id).eq("workspace_id",message.workspace_id).eq("status","connected").maybeSingle();
 if(!conn||conn.provider!==message.provider)return NextResponse.json({error:"Connection unavailable"},{status:409});
 const subject=/^re:/i.test(message.subject||"")?message.subject:`Re: ${message.subject||"(No subject)"}`;
 const {data:log,error}=await admin.from("outbound_email_log").insert({workspace_id:message.workspace_id,connection_id:conn.id,in_reply_to:message.id,author_id:user.id,recipient:address,subject,provider:conn.provider,status:"sending"}).select("id").single();
 if(error||!log)return NextResponse.json({error:"Could not record send attempt"},{status:500});
 try{
  const providerId=await sendProviderReply(conn,address,subject,body,message.external_message_id,message.external_thread_id);
  await admin.from("outbound_email_log").update({status:"sent",provider_message_id:providerId,updated_at:new Date().toISOString()}).eq("id",log.id);
  return NextResponse.json({ok:true});
 }catch(e){
  // Unknown: network failures may happen after provider acceptance. Do not automatically retry.
  await admin.from("outbound_email_log").update({status:"unknown",error_message:(e instanceof Error?e.message:"Send failed").slice(0,500),updated_at:new Date().toISOString()}).eq("id",log.id);
  return NextResponse.json({error:"Could not confirm delivery. Check Sent Mail before retrying."},{status:502});
 }
}
