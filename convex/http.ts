import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Postmark inbound email webhook
http.route({
  path: "/api/email/inbound",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify webhook secret if configured
    const webhookSecret = process.env.POSTMARK_WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = request.headers.get("X-Webhook-Secret");
      if (providedSecret !== webhookSecret) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const body = await request.json();

    const fromEmail = body.FromFull?.Email || body.From;
    const fromName = body.FromFull?.Name || "";
    const subject = body.Subject || "(no subject)";
    const textBody = body.TextBody || body.HtmlBody || "";
    const inReplyTo = body.Headers?.find(
      (h: { Name: string }) => h.Name === "In-Reply-To"
    )?.Value;

    if (!fromEmail) {
      return new Response("Missing from address", { status: 400 });
    }

    // Check if this is a reply to an existing thread
    if (inReplyTo) {
      const existingEvent = await ctx.runQuery(
        api.emailEvents.findByMessageId,
        { messageId: inReplyTo }
      );

      if (existingEvent?.conversationId) {
        await ctx.runMutation(api.messages.send, {
          conversationId: existingEvent.conversationId,
          senderType: "contact",
          body: textBody,
        });

        return new Response("OK", { status: 200 });
      }
    }

    const defaultOrganizationId =
      process.env.INBOUND_ORG_ID ||
      (await ctx.runQuery(api.organizations.getPublicContext, {}))
        ?.organizationId;

    if (!defaultOrganizationId) {
      return new Response("No organization configured", { status: 503 });
    }

    // New conversation from email
    // 1. Get or create contact
    const contactId = await ctx.runMutation(api.contacts.getOrCreate, {
      organizationId: defaultOrganizationId as any,
      email: fromEmail,
      name: fromName || undefined,
    });

    // 2. Create conversation
    const conversationId = await ctx.runMutation(api.conversations.create, {
      organizationId: defaultOrganizationId as any,
      contactId: contactId as any,
      channel: "email",
      subject,
    });

    // 3. Add the message
    await ctx.runMutation(api.messages.send, {
      conversationId: conversationId as any,
      senderType: "contact",
      senderId: contactId as any,
      body: textBody,
    });

    return new Response("OK", { status: 200 });
  }),
});

// Slack Events API webhook
http.route({
  path: "/api/slack/events",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();

    // Handle Slack URL verification challenge
    const body = JSON.parse(rawBody);
    if (body.type === "url_verification") {
      return new Response(
        JSON.stringify({ challenge: body.challenge }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify Slack request signature if configured
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (signingSecret) {
      const timestamp = request.headers.get("X-Slack-Request-Timestamp");
      const slackSignature = request.headers.get("X-Slack-Signature");

      if (!timestamp || !slackSignature) {
        return new Response("Missing signature", { status: 401 });
      }

      // Reject requests older than 5 minutes
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - parseInt(timestamp)) > 300) {
        return new Response("Request too old", { status: 401 });
      }

      const sigBaseString = `v0:${timestamp}:${rawBody}`;
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(signingSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(sigBaseString)
      );
      const computed =
        "v0=" +
        Array.from(new Uint8Array(sig))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      if (computed !== slackSignature) {
        return new Response("Invalid signature", { status: 401 });
      }
    }

    // Process message events
    if (body.event?.type === "message") {
      // Ignore bot messages
      if (body.event.bot_id) {
        return new Response("OK", { status: 200 });
      }
      // Ignore message subtypes (edits, deletes, etc.) but allow file_share
      if (body.event.subtype && body.event.subtype !== "file_share") {
        return new Response("OK", { status: 200 });
      }

      // Only handle threaded replies (thread_ts present and different from ts)
      if (body.event.thread_ts && body.event.thread_ts !== body.event.ts) {
        // Check for image file attachments
        const files = body.event.files;
        const imageFiles =
          files?.filter((f: any) => f.mimetype?.startsWith("image/")) ?? [];

        if (imageFiles.length > 0) {
          // Route to action that can download files from Slack
          await ctx.runAction(internal.slack.handleInboundMessageWithFiles, {
            slackThreadTs: body.event.thread_ts,
            slackChannelId: body.event.channel,
            slackUserId: body.event.user,
            text: body.event.text || "",
            slackMessageTs: body.event.ts,
            files: imageFiles.map((f: any) => ({
              url: f.url_private_download || f.url_private,
              name: f.name || "image",
              mimetype: f.mimetype,
              size: f.size || 0,
            })),
          });
        } else {
          await ctx.runMutation(internal.slack.handleInboundMessage, {
            slackThreadTs: body.event.thread_ts,
            slackChannelId: body.event.channel,
            slackUserId: body.event.user,
            text: body.event.text || "",
            slackMessageTs: body.event.ts,
          });
        }
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

// Health check
http.route({
  path: "/api/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
