import {createCipheriv,createDecipheriv,randomBytes,createHash,createHmac,timingSafeEqual} from "node:crypto";
export const supportedProviders=["gmail"] as const;
const key=()=>{const raw=process.env.CHANNEL_TOKEN_ENCRYPTION_KEY;if(!raw||!/^[a-f0-9]{64}$/i.test(raw))throw new Error("CHANNEL_TOKEN_ENCRYPTION_KEY must be 32 bytes hex");return Buffer.from(raw,"hex")};
export function encryptToken(token:string){const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",key(),iv);const data=Buffer.concat([cipher.update(token,"utf8"),cipher.final()]);return [iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),data.toString("base64url")].join(".")}
export function decryptToken(value:string){const [iv,tag,data]=value.split(".");const decipher=createDecipheriv("aes-256-gcm",key(),Buffer.from(iv,"base64url"));decipher.setAuthTag(Buffer.from(tag,"base64url"));return Buffer.concat([decipher.update(Buffer.from(data,"base64url")),decipher.final()]).toString("utf8")}
export function signState(payload:string){const secret=key();return createHmac("sha256",secret).update(payload).digest("base64url")}
export function verifyState(payload:string,signature:string){const expected=signState(payload);const a=Buffer.from(expected),b=Buffer.from(signature);return a.length===b.length&&timingSafeEqual(a,b)}
export function isUuid(s:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)}
export function googleRedirectUri(){const origin=process.env.NEXT_PUBLIC_SITE_URL;if(!origin)throw new Error("NEXT_PUBLIC_SITE_URL missing");return new URL("/api/channels/gmail/callback",origin).toString()}
export function providerReady(){return Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.CHANNEL_TOKEN_ENCRYPTION_KEY)}
