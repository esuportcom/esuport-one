import {NextRequest,NextResponse} from 'next/server';
import {randomBytes} from 'node:crypto';
import {requireWorkspaceAdmin} from '@/lib/teams';
import {isUuid,signState} from '@/lib/channels';
import {outlookReady,outlookRedirectUri,outlookScopes} from '@/lib/outlook';
export async function GET(req:NextRequest){const workspaceId=req.nextUrl.searchParams.get('workspace')||'';
 if(!isUuid(workspaceId))return NextResponse.json({error:'Invalid workspace'},{status:400});
 try{await requireWorkspaceAdmin(workspaceId)}catch{return NextResponse.json({error:'Workspace admin required'},{status:403})}
 if(!outlookReady())return NextResponse.json({error:'Microsoft OAuth not configured'},{status:503});
 const nonce=randomBytes(24).toString('base64url');const encoded=Buffer.from(JSON.stringify({workspaceId,nonce,iat:Date.now()})).toString('base64url');
 const url=new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');url.searchParams.set('client_id',process.env.MICROSOFT_CLIENT_ID!);url.searchParams.set('response_type','code');url.searchParams.set('redirect_uri',outlookRedirectUri());url.searchParams.set('response_mode','query');url.searchParams.set('scope',outlookScopes);url.searchParams.set('state',encoded+'.'+signState(encoded));
 const res=NextResponse.redirect(url);res.cookies.set('outlook_oauth_nonce',nonce,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/channels/outlook/callback',maxAge:600});return res;
}
