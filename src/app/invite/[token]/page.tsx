import {acceptInvitation} from "@/app/app/team-actions";
import {createClient} from "@/lib/supabase/server";
import Link from "next/link";
export default async function Invite({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 return <main className="min-h-screen grid place-items-center p-5"><div className="panel max-w-md w-full p-8"><h1 className="text-2xl font-bold">Join eSuport One</h1><p className="text-slate-500 mt-3">Invitations are valid for seven days and only work with the invited email address.</p>{user?<><p className="text-sm mt-4">Signed in as {user.email}</p><form action={acceptInvitation} className="mt-5"><input type="hidden" name="token" value={token}/><button className="btn w-full">Accept invitation</button></form></>:<Link href="/login" className="btn mt-5">Sign in first</Link>}</div></main>
}
