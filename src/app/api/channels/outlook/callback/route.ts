import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';import {adminClient} from '@/lib/supabase/admin';
import {encryptToken,isUuid,verifyState} from '@/lib/channels';
import {outlookRedirectUri,outlookScopes} from '@/lib/outlook';
export async function GET(req:NextRequest){const back=(result:string)=>NextResponse.redirect(new URL('/app/channels?result='+encodeURIComponent(result),req.url));
 const code=req.nextUrl.searchParams.get('code'),state=req.nextUrl.searchParams.get('state');if(!code||!state)return back('outlook_missing_code');
 const [payload,sig]=state.split('.');if(!payload||!sig||!verifyState(payload,sig))return back('outlook_invalid_state');
 let parsed:{workspaceId:string,nonce:string,iat:number};try{parsed=JSON.parse(Buffer.from(payload,'base64url').toString())}catch{return back('outlook_invalid_state')}
 if(!isUuid(parsed.workspaceId)||Date.now()-parsed.iat>600000||parsed.iat>Date.now()+60000||req.cookies.get('outlook_oauth_nonce')?.value!==parsed.nonce)return back('outlook_expired_state');
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return back('login_required');
 const {data:member}=await supabase.from('workspace_members').select('role').eq('workspace_id',parsed.workspaceId).eq('user_id',user.id).maybeSingle();if(!member||!['owner','agency_admin'].includes(member.role))return back('access_denied');
 try{const r=await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.MICROSOFT_CLIENT_ID!,client_secret:process.env.MICROSOFT_CLIENT_SECRET!,code,grant_type:'authorization_code',redirect_uri:outlookRedirectUri(),scope:outlookScopes}),cache:'no-store'});if(!r.ok)throw new Error('Token exchange failed');
 const t=await r.json() as {access_token:string,refresh_token?:string,expires_in:number};
 const p=await fetch('https://graph.microsoft.com/v1.0/me',{headers:{Authorization:`Bearer ${t.access_token}`},cache:'no-store'});if(!p.ok)throw new Error('Profile lookup failed');
 const profile=await p.json() as {id:string,mail?:string,userPrincipalName?:string,displayName?:string};if(!profile.id)throw new Error('Account ID missing');
 const admin=adminClient();const {data:existing}=await admin.from('channel_connections').select('encrypted_refresh_token').eq('workspace_id',parsed.workspaceId).eq('provider','outlook').eq('external_account_id',profile.id).maybeSingle();
 const {error}=await admin.from('channel_connections').upsert({workspace_id:parsed.workspaceId,provider:'outlook',external_account_id:profile.id,account_label:profile.mail||profile.userPrincipalName||profile.displayName||'Microsoft account',status:'connected',encrypted_access_token:encryptToken(t.access_token),encrypted_refresh_token:t.refresh_token?encryptToken(t.refresh_token):existing?.encrypted_refresh_token||null,token_expires_at:new Date(Date.now()+t.expires_in*1000).toISOString(),connected_by:user.id,updated_at:new Date().toISOString()},{onConflict:'workspace_id,provider,external_account_id'});if(error)throw error;
 const res=back('outlook_connected');res.cookies.delete('outlook_oauth_nonce');return res;
 }catch(e){console.error('Outlook OAuth error',e);return back('outlook_connection_failed')}
}
