import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {adminClient} from "@/lib/supabase/admin";
import {encryptToken,googleRedirectUri,verifyState} from "@/lib/channels";
export async function GET(req:NextRequest){
 const back=(status:string)=>NextResponse.redirect(new URL(`/app/channels?result=${encodeURIComponent(status)}`,req.url));
 const code=req.nextUrl.searchParams.get("code"),state=req.nextUrl.searchParams.get("state");
 if(!code||!state)return back("missing_authorization");
 const [payload,sig]=state.split(".");if(!payload||!sig||!verifyState(payload,sig))return back("invalid_state");
 let data:{workspaceId:string,nonce:string,iat:number};try{data=JSON.parse(Buffer.from(payload,"base64url").toString())}catch{return back("invalid_state")}
 if(Date.now()-data.iat>600000||data.iat>Date.now()+60000||req.cookies.get("channel_oauth_nonce")?.value!==data.nonce)return back("expired_state");
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return back("login_required");
 const {data:member}=await supabase.from("workspace_members").select("role").eq("workspace_id",data.workspaceId).eq("user_id",user.id).maybeSingle();
 if(!member||!["owner","agency_admin"].includes(member.role))return back("access_denied");
 try{
  const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,redirect_uri:googleRedirectUri(),grant_type:"authorization_code"}),cache:"no-store"});
  if(!response.ok)throw new Error("Google token exchange failed");
  const tokens=await response.json() as {access_token:string,refresh_token?:string,expires_in?:number};
  const profile=await fetch("https://www.googleapis.com/oauth2/v3/userinfo",{headers:{Authorization:`Bearer ${tokens.access_token}`},cache:"no-store"});
  if(!profile.ok)throw new Error("Google profile lookup failed");
  const identity=await profile.json() as {sub?:string,email?:string};if(!identity.sub)throw new Error("Missing account identity");
  const admin=adminClient();const {data:existing}=await admin.from("channel_connections").select("encrypted_refresh_token").eq("workspace_id",data.workspaceId).eq("provider","gmail").eq("external_account_id",identity.sub).maybeSingle();
  const {error}=await admin.from("channel_connections").upsert({workspace_id:data.workspaceId,provider:"gmail",external_account_id:identity.sub,account_label:identity.email||"Google account",status:"connected",encrypted_access_token:encryptToken(tokens.access_token),encrypted_refresh_token:tokens.refresh_token?encryptToken(tokens.refresh_token):existing?.encrypted_refresh_token||null,token_expires_at:tokens.expires_in?new Date(Date.now()+tokens.expires_in*1000).toISOString():null,connected_by:user.id,updated_at:new Date().toISOString()},{onConflict:"workspace_id,provider,external_account_id"});
  if(error)throw error;
  const res=back("gmail_connected");res.cookies.delete("channel_oauth_nonce");return res;
 }catch(e){console.error("Gmail connection failed",e);return back("connection_failed")}
}
