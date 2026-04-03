"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, Rocket } from "lucide-react";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function getErrorCopy(error: Error) {
  const message = error.message || "Unknown error";

  if (
    message.includes("Could not find public function") ||
    message.includes("Did you forget to run `npx convex dev`?")
  ) {
    return {
      title: "Convex backend not deployed",
      summary:
        "This Cloudflare deployment can reach your Convex URL, but that Convex deployment does not have the Open Helpdesk functions on it yet.",
      detail:
        "The build connected to a Convex deployment, but the Open Helpdesk functions are not live on that deployment yet. Deploy the backend to the same production deployment behind your CONVEX_DEPLOY_KEY or NEXT_PUBLIC_CONVEX_URL.",
    };
  }

  return {
    title: "Application error",
    summary:
      "Open Helpdesk hit an unexpected runtime error while rendering this page.",
    detail: message,
  };
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const copy = getErrorCopy(error);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border bg-[radial-gradient(circle_at_top_left,_rgba(25,119,242,0.12),_transparent_48%),linear-gradient(180deg,#ffffff,#f8fafc)] px-8 py-7">
          <div className="flex items-center gap-3 text-primary-700">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
                Open Helpdesk
              </p>
              <h1 className="text-2xl font-semibold text-text-primary">
                {copy.title}
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-6 text-text-secondary">
            {copy.summary}
          </p>
        </div>

        <div className="space-y-6 px-8 py-7">
          <div className="rounded-2xl border border-border bg-surface-secondary px-5 py-4">
            <p className="text-sm leading-6 text-text-secondary">
              {copy.detail}
            </p>
          </div>

          {copy.title === "Convex backend not deployed" ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Fix steps
                </p>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-text-secondary">
                  <li>Clone the repository locally if you have not already.</li>
                  <li>
                    Connect the Convex CLI to the same production deployment
                    you used for <code>CONVEX_DEPLOY_KEY</code> or{" "}
                    <code>NEXT_PUBLIC_CONVEX_URL</code>.
                  </li>
                  <li>
                    Run <code>npx convex deploy --yes</code> from the repo
                    root.
                  </li>
                  <li>Reload this page after the deploy completes.</li>
                </ol>
              </div>

              <div className="rounded-2xl bg-[#0f172a] px-5 py-4 text-sm text-slate-100">
                <div className="flex items-center gap-2 text-slate-300">
                  <Rocket className="h-4 w-4" />
                  Convex backend deploy
                </div>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-[13px] leading-6 text-slate-100">{`npx convex deploy --yes`}</pre>
              </div>

              <p className="text-sm leading-6 text-text-secondary">
                After the Convex deploy finishes, reload this page. The
                Cloudflare Worker does not need to be recreated.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
            <Link
              href="/setup"
              className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
            >
              Open setup
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
