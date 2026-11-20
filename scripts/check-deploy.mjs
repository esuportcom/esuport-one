import {existsSync} from "node:fs";
const required=["NEXT_PUBLIC_SITE_URL","NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SERVICE_ROLE_KEY","STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","CHANNEL_TOKEN_ENCRYPTION_KEY","CRON_SECRET","HEALTH_CHECK_SECRET"];
const errors=[];const warnings=[];
for(const key of required){if(!process.env[key]?.trim())errors.push(`${key}: missing`)}
for(const key of ["NEXT_PUBLIC_SITE_URL","NEXT_PUBLIC_SUPABASE_URL"]){const value=process.env[key];if(!value)continue;try{const url=new URL(value);if(url.protocol!=="https:")errors.push(`${key}: HTTPS required`);if(url.username||url.password||url.search||url.hash)errors.push(`${key}: unexpected URL components`)}catch{errors.push(`${key}: invalid URL`)}}
const encryptionKey=process.env.CHANNEL_TOKEN_ENCRYPTION_KEY||"";if(encryptionKey&&!/^[0-9a-f]{64}$/i.test(encryptionKey))errors.push("CHANNEL_TOKEN_ENCRYPTION_KEY: must be 64 hex characters");
for(const key of ["CRON_SECRET","HEALTH_CHECK_SECRET"])if(process.env[key]&&process.env[key].length<32)errors.push(`${key}: use at least 32 random characters`);
if(process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"))warnings.push("Stripe test mode configured");
if(process.env.NEXT_PUBLIC_SITE_URL?.includes("onrender.com"))warnings.push("Render subdomain configured; update URLs if using a custom domain");
if(!existsSync("render.yaml"))errors.push("render.yaml missing");
for(const w of warnings)console.warn("WARNING:",w);for(const e of errors)console.error("ERROR:",e);
console.log(`Deployment configuration: ${errors.length} error(s), ${warnings.length} warning(s). No remote service connections were tested.`);
if(errors.length)process.exitCode=1;
