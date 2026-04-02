"use client";

import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, LockKeyhole, Mail, Sparkles } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const bootstrap = useQuery(api.setup.getBootstrapState);
  const completeBootstrap = useMutation(api.setup.completeBootstrap);
  const [organizationName, setOrganizationName] = useState("Acme Support");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bootstrap?.currentUser?.name) {
      setAdminName(bootstrap.currentUser.name);
    }
    if (bootstrap?.currentUser?.email) {
      setEmail(bootstrap.currentUser.email);
    }
  }, [bootstrap]);

  useEffect(() => {
    if (!authLoading && bootstrap?.currentUserIsAgent) {
      router.replace("/");
    }
  }, [authLoading, bootstrap?.currentUserIsAgent, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!organizationName.trim() || !adminName.trim()) {
      setError("Organization name and admin name are required.");
      return;
    }

    if (!isAuthenticated && (!email.trim() || password.length < 12)) {
      setError("Use a valid email and a password with at least 12 characters.");
      return;
    }

    setSaving(true);
    try {
      if (!isAuthenticated) {
        await signIn("password", {
          flow: "signUp",
          email: email.trim().toLowerCase(),
          password,
          name: adminName.trim(),
        });
      }

      await completeBootstrap({
        organizationName: organizationName.trim(),
        adminName: adminName.trim(),
      });

      setSuccess("Workspace created. Redirecting to the dashboard...");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || bootstrap === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
      </div>
    );
  }

  const setupLocked = bootstrap.hasOrganization && !bootstrap.currentUserIsAgent;
  const showBootstrapForm = !bootstrap.hasUsers || (isAuthenticated && !bootstrap.hasOrganization);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4 py-10">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border bg-[radial-gradient(circle_at_top_left,_rgba(25,119,242,0.14),_transparent_45%),linear-gradient(180deg,#ffffff,#f8fafc)] px-8 py-7">
          <div className="flex items-center gap-3 text-primary-700">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
                Open Helpdesk
              </p>
              <h1 className="text-2xl font-semibold text-text-primary">
                Create the first owner
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-lg text-sm text-text-secondary">
            Bootstrap a fresh support workspace with one admin account. After this
            step, additional users should sign in with existing credentials and be
            added to the team from the dashboard.
          </p>
        </div>

        <div className="px-8 py-7">
          {showBootstrapForm ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-[12px] font-medium text-text-secondary">
                    Organization name
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-[14px] text-text-primary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[12px] font-medium text-text-secondary">
                    Admin name
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-[14px] text-text-primary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
                  />
                </div>

                {!isAuthenticated && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="text-[12px] font-medium text-text-secondary">
                        Email
                      </label>
                      <div className="relative mt-1.5">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-border bg-surface-secondary py-3 pl-10 pr-4 text-[14px] text-text-primary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[12px] font-medium text-text-secondary">
                        Password
                      </label>
                      <div className="relative mt-1.5">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 12 characters"
                          className="w-full rounded-xl border border-border bg-surface-secondary py-3 pl-10 pr-4 text-[14px] text-text-primary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {success ? (
                <p className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {success}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-[14px] font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create workspace"
                )}
              </button>
            </form>
          ) : setupLocked ? (
            <div className="space-y-3 text-sm text-text-secondary">
              <p className="font-medium text-text-primary">
                This workspace has already been set up.
              </p>
              <p>
                Sign in with an existing admin account to access the dashboard.
                If you need access, ask the workspace owner to add you as an
                agent.
              </p>
              <Link href="/login" className="inline-flex text-primary-600 hover:underline">
                Go to sign in
              </Link>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-text-secondary">
              <p className="font-medium text-text-primary">
                Setup is waiting for an authenticated user.
              </p>
              <p>
                Sign in with the credentials you created for this workspace, then
                return here to finish bootstrap.
              </p>
              <Link href="/login" className="inline-flex text-primary-600 hover:underline">
                Go to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
