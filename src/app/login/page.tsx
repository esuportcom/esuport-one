"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircleMore } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signup, setSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const emailRedirectTo = new URL("/auth/callback", siteUrl).toString();

      if (signup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo },
        });

        if (error) throw error;

        setMessage(
          `A confirmation link has been requested for ${email}. Check your inbox and spam folder, then open the link to activate your account.`,
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        router.push("/app");
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-5">
      <div className="panel p-8 w-full max-w-md">
        <div className="flex items-center gap-3 text-2xl font-bold">
          <MessageCircleMore className="text-brand" />
          eSuport One
        </div>

        <h1 className="text-2xl font-bold mt-8">
          {signup ? "Create account" : "Welcome back"}
        </h1>
        <p className="text-slate-500 mt-1 mb-6">
          Access your customer support workspace
        </p>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">
            Email
            <input
              className="field mt-2"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="block text-sm font-semibold">
            Password
            <input
              className="field mt-2"
              type="password"
              minLength={8}
              required
              autoComplete={signup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button disabled={loading} className="btn w-full">
            {loading ? "Please wait..." : signup ? "Sign up" : "Sign in"}
          </button>
        </form>

        {message && (
          <p role="status" aria-live="polite" className="text-sm text-slate-600 mt-4">
            {message}
          </p>
        )}

        <button
          type="button"
          className="text-brand text-sm mt-5"
          onClick={() => {
            setSignup(!signup);
            setMessage("");
          }}
        >
          {signup ? "Already registered? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </main>
  );
}
