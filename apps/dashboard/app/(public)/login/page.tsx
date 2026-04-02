"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Mail, ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const bootstrap = useQuery(api.setup.getBootstrapState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      await signIn("password", {
        flow: "signIn",
        email: email.trim().toLowerCase(),
        password,
      });
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <Mail className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-xl font-semibold text-text-primary">Open Helpdesk</h1>
            <p className="mt-1 text-[13px] text-text-secondary">
              Sign in to your support workspace
            </p>
          </div>

          <form onSubmit={handleSignIn}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              className="w-full rounded-lg border border-border bg-surface-secondary px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
            />
            <div className="relative mt-3">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full rounded-lg border border-border bg-surface-secondary py-2.5 pl-10 pr-4 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
              />
            </div>
            {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-[12px] text-text-tertiary">
            {bootstrap?.hasUsers === false ? (
              <>
                No workspace yet.{" "}
                <Link href="/setup" className="text-primary-600 hover:underline">
                  Create the first owner
                </Link>
                .
              </>
            ) : (
              <>
                First time here?{" "}
                <Link href="/setup" className="text-primary-600 hover:underline">
                  Finish workspace setup
                </Link>
                .
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
