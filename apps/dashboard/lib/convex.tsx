"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export function ConvexClientProvider({
  children,
  convexUrl,
}: {
  children: ReactNode;
  convexUrl: string;
}) {
  const convex = useMemo(() => {
    if (!convexUrl) {
      return null;
    }

    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  if (!convex) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-secondary px-6">
        <div className="max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-text-primary">
            Missing Convex configuration
          </h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            This deployment does not have <code>NEXT_PUBLIC_CONVEX_URL</code>{" "}
            available at runtime. Set it in Cloudflare Worker variables, then
            redeploy.
          </p>
        </div>
      </main>
    );
  }

  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
