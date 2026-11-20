// Checks names and formats only; never prints secrets.
const required = ["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SERVICE_ROLE_KEY","NEXT_PUBLIC_SITE_URL"];
const missing = required.filter(k => !process.env[k]?.trim());
if (missing.length) { console.error("Missing required environment variables: " + missing.join(", ")); process.exitCode = 1; }
for (const key of ["NEXT_PUBLIC_SITE_URL","NEXT_PUBLIC_SUPABASE_URL"]) {
  const value = process.env[key]; if (!value) continue;
  try { const u = new URL(value); if (!["https:","http:"].includes(u.protocol)) throw Error("protocol"); if (process.env.NODE_ENV === "production" && u.protocol !== "https:") throw Error("HTTPS required in production"); }
  catch { console.error("Invalid URL in " + key); process.exitCode = 1; }
}
if (!process.exitCode) console.log("Required environment variables present; external connectivity not tested.");
