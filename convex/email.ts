import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Send an email reply via Postmark — internal only, called from other Convex functions
export const sendReply = internalAction({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
    toEmail: v.string(),
    toName: v.optional(v.string()),
    fromEmail: v.string(),
    fromName: v.string(),
    replyToEmail: v.optional(v.string()),
    subject: v.string(),
    body: v.string(),
    inReplyTo: v.optional(v.string()),
    references: v.optional(v.string()),
    organizationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const postmarkServerToken = process.env.POSTMARK_SERVER_TOKEN;
    if (!postmarkServerToken) {
      throw new Error("POSTMARK_SERVER_TOKEN environment variable not set");
    }

    const siteUrl = getSiteUrl();
    const emailHost = getEmailHost(siteUrl);
    const emailMessageId = `<${args.messageId}@${emailHost}>`;

    // Reply-To routes customer replies back through Postmark inbound webhook
    const replyTo = args.replyToEmail || process.env.POSTMARK_INBOUND_ADDRESS;

    const postmarkPayload: Record<string, unknown> = {
      From: `${args.fromName} <${args.fromEmail}>`,
      To: args.toName
        ? `${args.toName} <${args.toEmail}>`
        : args.toEmail,
      ...(replyTo ? { ReplyTo: replyTo } : {}),
      Subject: args.subject,
      TextBody: args.body,
      HtmlBody: formatEmailHtml({
        body: args.body,
        agentName: args.fromName,
        organizationName: args.organizationName,
        siteUrl,
      }),
      MessageStream: "outbound",
      Headers: [
        { Name: "Message-ID", Value: emailMessageId },
        ...(args.inReplyTo
          ? [{ Name: "In-Reply-To", Value: args.inReplyTo }]
          : []),
        ...(args.references
          ? [{ Name: "References", Value: args.references }]
          : []),
      ],
    };

    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkServerToken,
      },
      body: JSON.stringify(postmarkPayload),
    });

    const result = await response.json();

    // Log the email event
    await ctx.runMutation(internal.email.logEvent, {
      conversationId: args.conversationId,
      messageId: args.messageId,
      direction: "outbound",
      emailTo: args.toEmail,
      emailFrom: args.fromEmail,
      subject: args.subject,
      postmarkMessageId: result.MessageID || emailMessageId,
      status: response.ok ? "sent" : "failed",
    });

    return { success: response.ok, emailMessageId };
  },
});

export const logEvent = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
    direction: v.string(),
    emailTo: v.string(),
    emailFrom: v.string(),
    subject: v.string(),
    postmarkMessageId: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailEvents", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

function getSiteUrl() {
  return (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.CONVEX_SITE_URL ||
    ""
  ).replace(/\/$/, "");
}

function getEmailHost(siteUrl: string) {
  if (!siteUrl) {
    return "open-helpdesk.local";
  }

  try {
    return new URL(siteUrl).host;
  } catch {
    return "open-helpdesk.local";
  }
}

function joinUrl(siteUrl: string, path: string) {
  if (!siteUrl) return "";
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatEmailHtml({
  body,
  agentName,
  organizationName,
  siteUrl,
}: {
  body: string;
  agentName: string;
  organizationName?: string;
  siteUrl: string;
}): string {
  const escapedBody = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  const initial = agentName.charAt(0).toUpperCase();
  const workspaceName = organizationName || "Support";
  const helpCenterUrl = joinUrl(siteUrl, "/help");
  const homeUrl = siteUrl;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
      <div style="background: #1977f2; padding: 20px 32px; border-radius: 12px 12px 0 0; text-align: center;">
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">
          ${workspaceName}
        </p>
      </div>

      <div style="padding: 32px; background: #ffffff; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
          <tr>
            <td style="vertical-align: middle; padding-right: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: #1977f2; color: #fff; font-size: 14px; font-weight: 600; text-align: center; line-height: 36px;">
                ${initial}
              </div>
            </td>
            <td style="vertical-align: middle;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">${agentName}</p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">${workspaceName} support</p>
            </td>
          </tr>
        </table>

        <div style="font-size: 15px; line-height: 1.7; color: #374151;">
          ${escapedBody}
        </div>

        <div style="margin-top: 28px; padding: 16px 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6;">
          <p style="margin: 0; font-size: 13px; color: #6b7280;">
            Reply directly to this email to continue the conversation.
          </p>
        </div>
      </div>

      <div style="padding: 24px 32px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        ${helpCenterUrl || homeUrl ? `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 16px;">
          <tr>
            <td>
              <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #374151;">Need help?</p>
            </td>
          </tr>
          <tr>
            <td>
              ${helpCenterUrl ? `<a href="${helpCenterUrl}" style="display: inline-block; padding: 6px 14px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 12px; font-weight: 500; color: #374151; text-decoration: none; margin-right: 8px;">Browse Help Articles</a>` : ""}
              ${homeUrl ? `<a href="${homeUrl}" style="display: inline-block; padding: 6px 14px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 12px; font-weight: 500; color: #374151; text-decoration: none;">Visit ${workspaceName}</a>` : ""}
            </td>
          </tr>
        </table>` : ""}

        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">
            Sent by ${homeUrl ? `<a href="${homeUrl}" style="color: #6b7280; text-decoration: none;">${workspaceName}</a>` : workspaceName} &middot; Customer feedback &amp; support
          </p>
        </div>
      </div>
    </div>
  `;
}
