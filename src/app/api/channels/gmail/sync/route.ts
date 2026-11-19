import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {adminClient} from "@/lib/supabase/admin";
import {isUuid} from "@/lib/channels";
import {syncConnection} from "@/lib/email-sync";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 let id="";try{id=String((await req.json()).connection_id||"")}catch{return NextResponse.json({error:"Invalid request"},{status:400})}
 if(!isUuid(id))return NextResponse.json({error:"Invalid connection"},{status:400});
 const {data:c}=await adminClient().from("channel_connections").select("id,workspace_id,provider,status,encrypted_access_token,encrypted_refresh_token,token_expires_at").eq("id",id).eq("provider","gmail").eq("status","connected").maybeSingle();
 if(!c)return NextResponse.json({error:"Connection not found"},{status:404});
 const {data:m}=await supabase.from("workspace_members").select("role").eq("workspace_id",c.workspace_id).eq("user_id",user.id).maybeSingle();
 if(!m||!["owner","agency_admin"].includes(m.role))return NextResponse.json({error:"Workspace administrator required"},{status:403});
 try{const processed=await syncConnection(c);return NextResponse.json({ok:true,processed})}catch(e){console.error("Sync failed",e);return NextResponse.json({error:"Sync failed; check connection and server logs"},{status:502})}
}
