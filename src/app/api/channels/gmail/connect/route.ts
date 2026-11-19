import {NextRequest,NextResponse} from "next/server";
import {randomBytes} from "node:crypto";
import {requireWorkspaceAdmin} from "@/lib/teams";
import {googleRedirectUri,isUuid,providerReady,signState} from "@/lib/channels";
export async function GET(req:NextRequest){
 const workspaceId=req.nextUrl.searchParams.get("workspace")||"";
 if(!isUuid(workspaceId))return NextResponse.json({error:"Invalid workspace"},{status:400});
 try{
  await requireWorkspaceAdmin(workspaceId);
  if(!providerReady())return NextResponse.json({error:"Gmail OAuth not configured"},{status:503});
  const nonce=randomBytes(24).toString("base64url");const payload=JSON.stringify({workspaceId,nonce,iat:Date.now()});
  const encoded=Buffer.from(payload).toString("base64url");const state=encoded+"."+signState(encoded);
  const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id",process.env.GOOGLE_CLIENT_ID!);url.searchParams.set("redirect_uri",googleRedirectUri());
  url.searchParams.set("response_type","code");url.searchParams.set("scope","openid email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send");
  url.searchParams.set("access_type","offline");url.searchParams.set("prompt","consent");url.searchParams.set("state",state);
  const res=NextResponse.redirect(url);res.cookies.set("channel_oauth_nonce",nonce,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/api/channels/gmail/callback",maxAge:600});return res;
 }catch{return NextResponse.json({error:"Workspace administrator access required"},{status:403})}
}
