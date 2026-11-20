import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const dynamic="force-dynamic";
// Do not expose provider keys, database details, or internal errors to unauthenticated callers.
export async function GET(request:Request){
 const expected=process.env.HEALTH_CHECK_SECRET;
 const actual=request.headers.get("authorization")?.replace(/^Bearer /,"");
 if(!expected||actual!==expected)return NextResponse.json({error:"Unauthorized"},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({status:"unavailable"},{status:503});
 try{
  const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await supabase.from("workspaces").select("id",{head:true,count:"exact"}).limit(1);
  if(error)throw error;
  return NextResponse.json({status:"ready",supabase:"reachable"},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({status:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
