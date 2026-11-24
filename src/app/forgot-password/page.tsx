
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setMessage("");
        setLoading(true);

        try {
            const { error } = await authClient.requestPasswordReset({
                email: email.trim(),
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                setError(error.message ?? "Unable to process your request.");
                return;
            }

            setMessage(
                "If an account exists with this email, password-reset instructions will be sent to your inbox. Please also check your spam folder."
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
                    Forgot your <span className="text-blue-500">password?</span>
                </h1>

                <p className="mt-3 text-slate-400">
                    Enter your email address and we&apos;ll help you reset your password.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Email address
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                            disabled={loading || !!message}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-60"
                        />
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-red-400">
                            {error}
                        </p>
                    )}

                    {message && (
                        <div
                            role="status"
                            className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400"
                        >
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !!message}
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Remember your password?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-blue-400 hover:underline"
                    >
                        Back to Sign In
                    </Link>
                </p>
            </div>
        </main>
    );
}
