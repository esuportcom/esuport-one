import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
// Reports configuration presence only; it does not test provider connectivity.
export function GET(){
 const keys=["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SERVICE_ROLE_KEY","NEXT_PUBLIC_SITE_URL"];
 const missing=keys.filter(k=>!process.env[k]);
 return NextResponse.json({status:missing.length?"not_ready":"configured",missing},{status:missing.length?503:200,headers:{"Cache-Control":"no-store"}});
}
