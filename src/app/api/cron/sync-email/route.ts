import {NextRequest,NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {adminClient} from "@/lib/supabase/admin";
import {syncConnection} from "@/lib/email-sync";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const expected=process.env.CRON_SECRET||"";
 const actual=req.headers.get("authorization")?.replace(/^Bearer /,"")||"";
 if(!expected||Buffer.byteLength(expected)!==Buffer.byteLength(actual)||!timingSafeEqual(Buffer.from(expected),Buffer.from(actual)))return NextResponse.json({error:"Unauthorized"},{status:401});
 const admin=adminClient();
 // Intentionally bounded batch; schedule external invocations every 10-15 minutes.
 const {data, error}=await admin.from("channel_connections").select("id,workspace_id,provider,status,encrypted_access_token,encrypted_refresh_token,token_expires_at").eq("status","connected").in("provider",["gmail","outlook"]).order("created_at",{ascending:true}).limit(10);
 if(error)return NextResponse.json({error:"Cannot list channels"},{status:500});
 const results=[];
 for(const c of data||[]){try{results.push({id:c.id,ok:true,processed:await syncConnection(c)})}catch(e){console.error("Scheduled sync failed",c.id,e);results.push({id:c.id,ok:false})}}
 return NextResponse.json({ok:true,checked:results.length,results});
}
