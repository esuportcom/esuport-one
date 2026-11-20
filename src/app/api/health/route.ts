import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export function GET(){return NextResponse.json({status:"ok",service:"esuport-one",version:"1.5.0"},{headers:{"Cache-Control":"no-store"}})}
