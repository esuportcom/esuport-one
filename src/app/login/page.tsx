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
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function getEmailRedirectTo() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    return new URL("/auth/callback", siteUrl).toString();
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setCanResend(false);

    try {
      const supabase = createClient();

      if (signup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: getEmailRedirectTo() },
        });

        if (error) throw error;

        setCanResend(true);
        setMessage(
          `A confirmation link has been requested for ${email}. Check your inbox and spam folder, or resend it below.`,
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

  async function resendConfirmation() {
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: getEmailRedirectTo() },
      });

      if (error) throw error;
      setMessage(`A new confirmation email has been requested for ${email}. Check your inbox and spam folder.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not resend the confirmation email");
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
              onChange={(e) => {
                setEmail(e.target.value);
                setCanResend(false);
              }}
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

        {signup && canResend && (
          <button
            type="button"
            disabled={loading}
            className="text-brand text-sm mt-3 disabled:opacity-50"
            onClick={resendConfirmation}
          >
            Resend confirmation email
          </button>
        )}

        <button
          type="button"
          className="text-brand text-sm mt-5 block"
          onClick={() => {
            setSignup(!signup);
            setMessage("");
            setCanResend(false);
          }}
        >
          {signup ? "Already registered? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </main>
  );
}
