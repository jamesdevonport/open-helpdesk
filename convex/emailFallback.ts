import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Agent manually sends a message via email when the contact is offline.
 */
export const sendMessageAsEmail = action({
  args: {
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    // Check auth and gather data
    const data: {
      shouldSend: boolean;
      toEmail?: string;
      toName?: string;
      fromEmail?: string;
      fromName?: string;
      organizationName?: string;
      subject?: string;
      body?: string;
      error?: string;
    } = await ctx.runMutation(internal.emailFallback.prepareEmail, {
      messageId: args.messageId,
      conversationId: args.conversationId,
    });

    if (!data.shouldSend) {
      return { success: false, error: data.error || "Cannot send email" };
    }

    await ctx.runAction(internal.email.sendReply, {
      conversationId: args.conversationId,
      messageId: args.messageId,
      toEmail: data.toEmail!,
      toName: data.toName,
      fromEmail: data.fromEmail!,
      fromName: data.fromName!,
      organizationName: data.organizationName,
      subject: data.subject!,
      body: data.body!,
    });

    return { success: true };
  },
});

/**
 * Gather email data and mark the message as emailed. Transactional.
 */
export const prepareEmail = internalMutation({
  args: {
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return { shouldSend: false, error: "Message not found" };

    if (message.deliveredVia === "both" || message.deliveredVia === "email") {
      return { shouldSend: false, error: "Already sent via email" };
    }

    if (message.senderType !== "agent" || !message.body) {
      return { shouldSend: false, error: "Only agent text messages can be emailed" };
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return { shouldSend: false, error: "Conversation not found" };

    const contact = await ctx.db.get(conversation.contactId);
    if (!contact?.email) {
      return { shouldSend: false, error: "Contact has no email address" };
    }

    const org = await ctx.db.get(conversation.organizationId);
    if (!org) return { shouldSend: false, error: "Organization not found" };
    const fromEmail = org.emailFromAddress || process.env.DEFAULT_FROM_EMAIL;
    if (!fromEmail) {
      return {
        shouldSend: false,
        error:
          "Configure an outgoing email address in Settings or set DEFAULT_FROM_EMAIL.",
      };
    }

    let agentName = org.emailFromName || `${org.name} Support`;
    if (message.senderId) {
      const agent = await ctx.db.get(message.senderId as any);
      if (agent) agentName = (agent as any).name || agentName;
    }

    // Mark as emailed
    await ctx.db.patch(args.messageId, { deliveredVia: "both" });

    return {
      shouldSend: true,
      toEmail: contact.email,
      toName: contact.name,
      fromEmail,
      fromName: agentName,
      organizationName: org.name,
      subject: conversation.subject || `Re: Your conversation with ${org.name}`,
      body: message.body,
    };
  },
});
