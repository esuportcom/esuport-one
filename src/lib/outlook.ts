import {decryptToken,encryptToken} from '@/lib/channels';
import {adminClient} from '@/lib/supabase/admin';
export const outlookScopes='openid profile email offline_access User.Read Mail.Read Mail.Send';
export function outlookRedirectUri(){return new URL('/api/channels/outlook/callback',process.env.NEXT_PUBLIC_SITE_URL!).toString()}
export function outlookReady(){return Boolean(process.env.MICROSOFT_CLIENT_ID&&process.env.MICROSOFT_CLIENT_SECRET&&process.env.CHANNEL_TOKEN_ENCRYPTION_KEY&&process.env.NEXT_PUBLIC_SITE_URL)}
type Connection={id:string,workspace_id:string,encrypted_access_token:string|null,encrypted_refresh_token:string|null,token_expires_at:string|null};
export async function outlookAccessToken(connection:Connection){
 if(connection.encrypted_access_token&&connection.token_expires_at&&Date.parse(connection.token_expires_at)>Date.now()+60000)return decryptToken(connection.encrypted_access_token);
 if(!connection.encrypted_refresh_token)throw new Error('Outlook refresh token missing');
 const response=await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.MICROSOFT_CLIENT_ID||'',client_secret:process.env.MICROSOFT_CLIENT_SECRET||'',grant_type:'refresh_token',refresh_token:decryptToken(connection.encrypted_refresh_token),scope:outlookScopes}),cache:'no-store'});
 if(!response.ok)throw new Error('Microsoft token refresh failed');
 const t=await response.json() as {access_token:string,refresh_token?:string,expires_in:number};
 const update:Record<string,unknown>={encrypted_access_token:encryptToken(t.access_token),token_expires_at:new Date(Date.now()+t.expires_in*1000).toISOString()};
 if(t.refresh_token)update.encrypted_refresh_token=encryptToken(t.refresh_token);
 const {error}=await adminClient().from('channel_connections').update(update).eq('id',connection.id).eq('workspace_id',connection.workspace_id);
 if(error)throw error;return t.access_token;
}
export async function graphGet<T>(token:string,path:string):Promise<T>{const r=await fetch('https://graph.microsoft.com/v1.0/'+path,{headers:{Authorization:`Bearer ${token}`,Prefer:'outlook.body-content-type="text"'},cache:'no-store'});if(!r.ok)throw new Error(`Microsoft Graph request failed (${r.status})`);return r.json() as Promise<T>}
