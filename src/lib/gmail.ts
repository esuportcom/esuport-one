import {decryptToken,encryptToken} from "@/lib/channels";
import {adminClient} from "@/lib/supabase/admin";
type Connection={id:string,workspace_id:string,encrypted_access_token:string|null,encrypted_refresh_token:string|null,token_expires_at:string|null};
export async function gmailAccessToken(connection:Connection){
 if(connection.encrypted_access_token&&connection.token_expires_at&&Date.parse(connection.token_expires_at)>Date.now()+60000)return decryptToken(connection.encrypted_access_token);
 if(!connection.encrypted_refresh_token)throw new Error("Google refresh token missing. Reconnect Gmail.");
 const res=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID||"",client_secret:process.env.GOOGLE_CLIENT_SECRET||"",refresh_token:decryptToken(connection.encrypted_refresh_token),grant_type:"refresh_token"}),cache:"no-store"});
 if(!res.ok)throw new Error("Google token refresh failed. Reconnect Gmail.");
 const data=await res.json() as {access_token:string,expires_in:number};
 const {error}=await adminClient().from("channel_connections").update({encrypted_access_token:encryptToken(data.access_token),token_expires_at:new Date(Date.now()+data.expires_in*1000).toISOString()}).eq("id",connection.id).eq("workspace_id",connection.workspace_id);
 if(error)throw new Error("Unable to store refreshed Gmail token");return data.access_token;
}
export async function gmailGet<T>(token:string,path:string):Promise<T>{
 const res=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
 if(!res.ok)throw new Error(`Gmail API request failed (${res.status})`);return res.json() as Promise<T>;
}
function decodeBase64Url(raw:string){return Buffer.from(raw.replace(/-/g,"+").replace(/_/g,"/"),"base64").toString("utf8")}
type Part={mimeType?:string,body?:{data?:string},parts?:Part[]};
export function textBody(payload:Part):string{
 if(payload.mimeType==="text/plain"&&payload.body?.data)return decodeBase64Url(payload.body.data).slice(0,100000);
 for(const part of payload.parts||[]){const body=textBody(part);if(body)return body}
 return "";
}
