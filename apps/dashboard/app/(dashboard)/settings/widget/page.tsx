"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Palette, RotateCw, Code, Copy, Check, Loader2 } from "lucide-react";
import { useRuntimeConfig } from "@/lib/runtime-config";

const positions = ["bottom-right", "bottom-left"] as const;
const colors = [
  "#1977f2",
  "#7c3aed",
  "#059669",
  "#dc2626",
  "#ea580c",
  "#0891b2",
  "#4f46e5",
  "#be185d",
];

export default function WidgetSettingsPage() {
  const { convexUrl } = useRuntimeConfig();
  const [color, setColor] = useState("#1977f2");
  const [position, setPosition] = useState<string>("bottom-right");
  const [greeting, setGreeting] = useState("Hi! How can we help?");
  const [siteUrl, setSiteUrl] = useState("");
  const [updatesEnabled, setUpdatesEnabled] = useState(false);
  const [inactivityTimeout, setInactivityTimeout] = useState(240);
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [indicatorCopied, setIndicatorCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const me = useQuery(api.agents.me);
  const orgId = me?.organizationId;
  const org = useQuery(api.organizations.get, orgId ? { organizationId: orgId } : "skip");
  const updateOrg = useMutation(api.organizations.update);

  useEffect(() => {
    setSiteUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (org) {
      if (org.widgetColor) setColor(org.widgetColor);
      if (org.widgetPosition) setPosition(org.widgetPosition);
      if (org.widgetGreeting) setGreeting(org.widgetGreeting);
      setUpdatesEnabled(org.widgetUpdatesEnabled ?? false);
      setInactivityTimeout(org.chatInactivityTimeoutMinutes ?? 240);
    }
  }, [org]);

  const buildPreviewUrl = useCallback(() => {
    const params = new URLSearchParams({
      color,
      greeting,
      position,
      convexUrl,
      siteUrl,
      organizationId: orgId || "",
    });
    return `/widget-preview.html?${params.toString()}`;
  }, [color, greeting, position, convexUrl, orgId, siteUrl]);

  const reloadWidget = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(reloadWidget, 400);
    return () => clearTimeout(timeout);
  }, [color, position, greeting, reloadWidget]);

  const embedOrigin = siteUrl || "https://your-support-domain.example";
  const embedCode = `<script>
  window.OpenHelpdesk = {
    organizationId: "${orgId || ""}",
    convexUrl: "${convexUrl}",
    siteUrl: "${embedOrigin}",
    color: "${color}",
    greeting: ${JSON.stringify(greeting)},
    position: "${position}",
    user: {
      email: "",
      name: "",
      externalId: "",
      metadata: {
        userId: "",
        company: "",
        companyId: "",
        plan: "",
        storeUrl: ""
      }
    }
  };
</script>
<script src="${embedOrigin}/open-helpdesk.js" defer></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center border-b border-border px-6 py-3">
        <h1 className="text-[15px] font-semibold text-text-primary">
          Widget Settings
        </h1>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex gap-8 px-6 py-8">
          {/* Settings panel */}
          <div className="w-[320px] shrink-0 space-y-8">
            {/* Color */}
            <div>
              <label className="flex items-center gap-2 text-[13px] font-medium text-text-primary">
                <Palette className="h-4 w-4 text-text-tertiary" />
                Widget Color
              </label>
              <div className="mt-3 flex gap-2 flex-wrap">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? c : "transparent",
                      boxShadow:
                        color === c
                          ? `0 0 0 2px white, 0 0 0 4px ${c}`
                          : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="text-[13px] font-medium text-text-primary">
                Widget Position
              </label>
              <div className="mt-3 flex gap-3">
                {positions.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosition(pos)}
                    className={`rounded-lg border px-4 py-2 text-[12px] font-medium transition-colors ${
                      position === pos
                        ? "border-primary-300 bg-primary-50 text-primary-700"
                        : "border-border text-text-secondary hover:bg-surface-tertiary"
                    }`}
                  >
                    {pos.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Greeting */}
            <div>
              <label className="text-[13px] font-medium text-text-primary">
                Greeting Message
              </label>
              <input
                type="text"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-surface-secondary px-4 py-2.5 text-[13px] text-text-primary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
              />
            </div>

            {/* Updates Tab */}
            <div>
              <label className="text-[13px] font-medium text-text-primary">
                Product Updates Tab
              </label>
              <p className="mt-1 text-[12px] text-text-tertiary">
                Show a &quot;Updates&quot; tab in the widget for product announcements.
              </p>
              <label className="mt-2 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updatesEnabled}
                  onChange={(e) => setUpdatesEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-300"
                />
                <span className="text-[13px] text-text-primary">
                  Enable updates tab
                </span>
              </label>
            </div>

            {/* Chat Auto-Close */}
            <div>
              <label className="text-[13px] font-medium text-text-primary">
                Chat Auto-Close
              </label>
              <p className="mt-1 text-[12px] text-text-tertiary">
                Automatically resolve chat conversations after this period of
                inactivity. The next message from the visitor will start a new
                conversation.
              </p>
              <select
                value={inactivityTimeout}
                onChange={(e) => setInactivityTimeout(Number(e.target.value))}
                className="mt-2 rounded-lg border border-border bg-surface-secondary px-4 py-2.5 text-[13px] text-text-primary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={240}>4 hours (default)</option>
                <option value={480}>8 hours</option>
                <option value={1440}>24 hours</option>
              </select>
            </div>

            {/* Save button */}
            <button
              onClick={async () => {
                setSaving(true);
                try {
                  if (!orgId) return;
                  await updateOrg({
                    organizationId: orgId,
                    widgetColor: color,
                    widgetPosition: position,
                    widgetGreeting: greeting,
                    widgetUpdatesEnabled: updatesEnabled,
                    chatInactivityTimeoutMinutes: inactivityTimeout,
                  });
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
              {saved ? "Saved" : "Save Changes"}
            </button>

            {/* Embed code */}
            <div>
              <label className="flex items-center gap-2 text-[13px] font-medium text-text-primary">
                <Code className="h-4 w-4 text-text-tertiary" />
                Embed Code
              </label>
              <p className="mt-1 text-[12px] text-text-tertiary">
                Add this snippet before the closing <code className="bg-surface-tertiary px-1 rounded">&lt;/body&gt;</code> tag on your site.
              </p>
              <div className="relative mt-3">
                <pre className="rounded-lg border border-border bg-surface-tertiary p-4 text-[11px] leading-relaxed text-text-secondary overflow-x-auto">
                  {embedCode}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Updates Indicator */}
            {updatesEnabled && (
              <div>
                <label className="flex items-center gap-2 text-[13px] font-medium text-text-primary">
                  <Code className="h-4 w-4 text-text-tertiary" />
                  Updates Indicator
                </label>
                <p className="mt-1 text-[12px] text-text-tertiary">
                  Paste one of these into your app. Each renders a complete, styled &quot;What&apos;s New&quot; button with a live update count.
                </p>

                <div className="mt-3 space-y-3">
                  {[
                    {
                      name: "Pill",
                      desc: "Button with text label and inline count badge. Best for navbars and sidebars.",
                      snippet: `<div data-open-helpdesk-updates="pill"></div>`,
                      isDefault: true,
                    },
                    {
                      name: "Text",
                      desc: "Solid accent-colored button. Best as a standalone call-to-action.",
                      snippet: `<div data-open-helpdesk-updates="text"></div>`,
                    },
                    {
                      name: "Dot",
                      desc: "Compact icon button with accent dot. Best for tight spaces and toolbars.",
                      snippet: `<div data-open-helpdesk-updates="dot"></div>`,
                    },
                    {
                      name: "Badge",
                      desc: "Compact icon button with numbered count. Best when the exact count matters.",
                      snippet: `<div data-open-helpdesk-updates="badge"></div>`,
                    },
                  ].map((variant) => (
                    <div key={variant.name} className="rounded-lg border border-border bg-surface-secondary p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-text-primary">{variant.name}</span>
                          {variant.isDefault && <span className="text-[10px] text-text-tertiary">(recommended)</span>}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(variant.snippet);
                            setIndicatorCopied(true);
                            setTimeout(() => setIndicatorCopied(false), 2000);
                          }}
                          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-text-tertiary hover:text-text-secondary hover:bg-surface-tertiary transition-colors"
                        >
                          {indicatorCopied ? <Check className="h-2.5 w-2.5 text-green-600" /> : <Copy className="h-2.5 w-2.5" />}
                          Copy
                        </button>
                      </div>
                      <p className="text-[11px] text-text-tertiary mb-2">{variant.desc}</p>
                      <pre className="rounded-md bg-surface-tertiary p-2 text-[10px] leading-relaxed text-text-secondary overflow-x-auto">{variant.snippet}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live preview */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[13px] font-medium text-text-primary">
                Live Preview
              </label>
              <button
                onClick={reloadWidget}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
              >
                <RotateCw className="h-3 w-3" />
                Reload
              </button>
            </div>
            <div
              className="relative rounded-xl border border-border bg-surface-tertiary overflow-hidden"
              style={{ height: "calc(100vh - 180px)" }}
            >
              <iframe
                key={iframeKey}
                src={buildPreviewUrl()}
                className="w-full h-full border-0"
                title="Widget Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
