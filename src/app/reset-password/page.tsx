
"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
    const searchParams = useSearchParams();

    const token = searchParams.get("token");
    const invalidLink = searchParams.get("error") === "INVALID_TOKEN";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setMessage("");

        if (!token) {
            setError("This password-reset link is invalid or has expired.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Your passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await authClient.resetPassword({
                newPassword: password,
                token,
            });

            if (error) {
                setError(
                    error.message ?? "Unable to reset your password. Please try again."
                );
                return;
            }

            setMessage(
                "Your password has been reset successfully. You can now sign in using your new password."
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
                    Reset your <span className="text-blue-500">password</span>
                </h1>

                <p className="mt-3 text-slate-400">
                    Choose a new password for your DocMind AI account.
                </p>

                {(invalidLink || !token) && !message ? (
                    <div className="mt-8 space-y-4">
                        <p role="alert" className="text-sm text-red-400">
                            This password-reset link is invalid or has expired. Please
                            request a new one.
                        </p>

                        <Link
                            href="/forgot-password"
                            className="block text-center font-medium text-blue-400 hover:underline"
                        >
                            Request a new reset link
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                New password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Enter your new password"
                                autoComplete="new-password"
                                minLength={8}
                                required
                                disabled={loading || !!message}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Confirm new password
                            </label>

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Enter your new password again"
                                autoComplete="new-password"
                                minLength={8}
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
                            {loading
                                ? "Updating password..."
                                : message
                                    ? "Password updated"
                                    : "Reset Password"}
                        </button>

                        {message && (
                            <Link
                                href="/login"
                                className="block text-center font-medium text-blue-400 hover:underline"
                            >
                                Go to Sign In
                            </Link>
                        )}
                    </form>
                )}

                {!message && (
                    <p className="mt-6 text-center text-sm text-slate-400">
                        Remember your password?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-blue-400 hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                )}
            </div>
        </main>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                    Loading...
                </main>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}
