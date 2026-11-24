
"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!pending || countdown <= 0) return;

    const timer = window.setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [pending, countdown]);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setPending(false);
    setCountdown(30);
    setLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        name: fullName.trim(),
        email: email.trim(),
        password,
        callbackURL: `${window.location.origin}/login?confirmed=1`,
      });

      if (error) {
        setError(error.message ?? "Unable to create your account.");
        return;
      }

      setPending(true);
      setMessage(
        "Verify your email to complete registration."
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-3xl font-bold">
          Create your <span className="text-blue-500">account</span>
        </h1>

        <p className="mt-3 text-slate-400">
          Get started with DocMind AI.
        </p>

        <form onSubmit={handleSignup} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
              required
              disabled={pending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={pending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={pending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          {pending && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="font-medium text-blue-300">
                Email verification pending
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {message}
              </p>

              {countdown > 0 ? (
                <p className="mt-3 text-sm text-blue-300">
                  Waiting for confirmation: {countdown} seconds
                </p>
              ) : (
                <p className="mt-3 text-sm text-yellow-300">
                  &quot;Still waiting? Check for your verification link.&quot;
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pending}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Creating account..."
              : pending
                ? "Verification pending"
                : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
