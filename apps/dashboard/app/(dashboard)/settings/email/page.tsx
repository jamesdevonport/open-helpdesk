"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import {
  Mail,
  Clock,
  Shield,
  Loader2,
  Check,
  Server,
  Webhook,
  ArrowRight,
} from "lucide-react";

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_URL
  ? process.env.NEXT_PUBLIC_CONVEX_URL.replace(".cloud", ".site")
  : "";

export default function EmailSettingsPage() {
  const [fromName, setFromName] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [fallbackDelay, setFallbackDelay] = useState(5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const me = useQuery(api.agents.me);
  const orgId = me?.organizationId;
  const org = useQuery(api.organizations.get, orgId ? { organizationId: orgId } : "skip");
  const updateOrg = useMutation(api.organizations.update);

  useEffect(() => {
    if (!org) return;
    setFromName(org.emailFromName || `${org.name} Support`);
    setFromAddress(org.emailFromAddress || "");
    setFallbackDelay(org.emailFallbackDelayMinutes ?? 5);
  }, [org]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      await updateOrg({
        organizationId: orgId,
        emailFromName: fromName.trim() || undefined,
        emailFromAddress: fromAddress.trim() || undefined,
        emailFallbackDelayMinutes: fallbackDelay,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center border-b border-border px-6 py-3">
        <h1 className="text-[15px] font-semibold text-text-primary">
          Email Settings
        </h1>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <Server className="h-4 w-4 text-text-tertiary" />
              <h3 className="text-[13px] font-semibold text-text-primary">
                Required Postmark Environment Variables
              </h3>
            </div>
            <p className="mb-4 text-[12px] text-text-secondary">
              Dashboard login no longer depends on Postmark, but customer email delivery still does.
              Set these in your Convex deployment when you want email replies enabled.
            </p>
            <div className="space-y-3 text-[12px]">
              {[
                "POSTMARK_SERVER_TOKEN",
                "POSTMARK_INBOUND_ADDRESS",
                "POSTMARK_WEBHOOK_SECRET",
                "DEFAULT_FROM_EMAIL",
              ].map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2"
                >
                  <span className="text-text-tertiary">Environment variable</span>
                  <span className="font-mono text-text-secondary">{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <Webhook className="h-4 w-4 text-text-tertiary" />
              <h3 className="text-[13px] font-semibold text-text-primary">
                Inbound Email Webhook
              </h3>
            </div>
            <p className="mb-4 text-[12px] text-text-secondary">
              Configure your Postmark inbound webhook to route customer replies back into the inbox.
            </p>
            <div className="rounded-lg bg-surface-tertiary px-3 py-2.5">
              <code className="break-all text-[11px] text-text-primary">
                {CONVEX_SITE_URL ? `${CONVEX_SITE_URL}/api/email/inbound` : "Set NEXT_PUBLIC_CONVEX_URL to generate the webhook URL"}
              </code>
            </div>
            <div className="mt-3 text-[11px] text-text-tertiary">
              <p className="mb-1">Suggested setup:</p>
              <ol className="ml-4 list-decimal space-y-1">
                <li>Open your Postmark server settings.</li>
                <li>
                  Go to Inbound <ArrowRight className="inline h-2.5 w-2.5" /> Webhook.
                </li>
                <li>Paste the URL above.</li>
                <li>Choose an inbound domain you control, such as <code className="rounded bg-surface-secondary px-1">reply.yourdomain.com</code>.</li>
                <li>Optionally set <code className="rounded bg-surface-secondary px-1">INBOUND_ORG_ID</code> if you later run more than one workspace on the same backend.</li>
              </ol>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-text-tertiary" />
              <h2 className="text-[14px] font-semibold text-text-primary">
                Outgoing Email
              </h2>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[12px] font-medium text-text-secondary">
                  From Name
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(event) => setFromName(event.target.value)}
                  placeholder="Acme Support"
                  className="mt-1 w-full rounded-lg border border-border bg-surface-secondary px-4 py-2 text-[13px] text-text-primary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-text-secondary">
                  From Address
                </label>
                <input
                  type="email"
                  value={fromAddress}
                  onChange={(event) => setFromAddress(event.target.value)}
                  placeholder="support@yourdomain.com"
                  className="mt-1 w-full rounded-lg border border-border bg-surface-secondary px-4 py-2 text-[13px] text-text-primary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
                />
                <p className="mt-1 text-[11px] text-text-tertiary">
                  If left blank, Open Helpdesk falls back to <code className="rounded bg-surface-secondary px-1">DEFAULT_FROM_EMAIL</code>.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-text-tertiary" />
              <h3 className="text-[13px] font-semibold text-text-primary">
                Domain Verification
              </h3>
            </div>
            <p className="mt-2 text-[12px] text-text-secondary">
              Verify your sending domain inside Postmark to improve deliverability. Add the DKIM and Return-Path DNS records Postmark provides for your own domain.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-text-tertiary" />
              <h2 className="text-[14px] font-semibold text-text-primary">
                Email Behavior
              </h2>
            </div>
            <p className="mt-1 text-[12px] text-text-secondary">
              Agents can manually send an email reply from the conversation thread when a contact is offline or not in chat.
            </p>
            <div className="mt-4">
              <label className="text-[12px] font-medium text-text-secondary">
                Follow-up delay (minutes)
              </label>
              <input
                type="number"
                min={1}
                value={fallbackDelay}
                onChange={(event) => setFallbackDelay(Number(event.target.value) || 5)}
                className="mt-1 w-32 rounded-lg border border-border bg-surface-secondary px-4 py-2 text-[13px] text-text-primary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <Check className="h-3.5 w-3.5" />
            ) : null}
            {saved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
