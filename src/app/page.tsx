
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await authClient.signOut();
    setProfileOpen(false);
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-2xl font-bold">
          DocMind <span className="text-blue-500">AI</span>
        </Link>

        <div className="flex items-center gap-4">
          {isPending ? (
            <span className="text-sm text-slate-400">Loading...</span>
          ) : session?.user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
                aria-label="Open profile menu"
              >
                {(session.user.name || session.user.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
                  <p className="truncate text-sm font-semibold text-white">
                    {session.user.name || "User"}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-400">
                    {session.user.email}
                  </p>

                  <div className="my-3 border-t border-slate-700" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 transition hover:bg-slate-800"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-300 transition hover:text-white"
              >
                Login
              </Link>

              <Link
                href={session?.user ? "/chat" : "/signup"}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-700"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center md:pt-32">
        <div className="mb-6 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
          Your thinking partner, powered by AI
        </div>

        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Understand more.
          <span className="block text-blue-500">
            Do more with your knowledge.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-400 md:text-lg">
          Ask questions, explore ideas, and understand your documents.
          Everything you need to make sense of information, in one place.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/chat"
            className="rounded-xl bg-blue-600 px-8 py-3.5 font-semibold transition hover:bg-blue-700"
          >
            Start a Conversation
          </Link>

          <Link
            href={session?.user ? "/chat" : "/login"}
            className="rounded-xl border border-slate-700 px-8 py-3.5 font-semibold transition hover:border-slate-500 hover:bg-slate-900"
          >
            Explore Document Chat
          </Link>
        </div>
      </section>

      {/* Two ways to use DocMind */}
      <section className="mx-auto grid max-w-5xl gap-5 px-6 pb-24 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
            💬
          </div>

          <h2 className="text-xl font-semibold">Ask anything</h2>

          <p className="mt-3 min-h-16 leading-7 text-slate-400">
            Have a question or an idea? Start a conversation and get
            helpful answers without creating an account.
          </p>

          <Link
            href="/chat"
            className="mt-6 inline-block font-semibold text-blue-400 transition hover:text-blue-300"
          >
            Try Guest Chat →
          </Link>

          <p className="mt-3 text-xs text-slate-500">
            No registration required
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
            📄
          </div>

          <h2 className="text-xl font-semibold">Chat with your documents</h2>

          <p className="mt-3 min-h-16 leading-7 text-slate-400">
            Upload your documents, ask questions, and find the information
            you need without reading every page.
          </p>

          <Link
            href="/signup"
            className="mt-6 inline-block font-semibold text-blue-400 transition hover:text-blue-300"
          >
            Get Started →
          </Link>

          <p className="mt-3 text-xs text-slate-500">
            Free account required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-7 text-center">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} DocMind AI. Built to make knowledge
          easier.
        </p>
      </footer>
    </main>
  );
}
