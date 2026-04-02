"use client";

import Script from "next/script";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRuntimeConfig } from "@/lib/runtime-config";

export function HelpWidgetBootstrap() {
  const { convexUrl } = useRuntimeConfig();
  const publicContext = useQuery(api.organizations.getPublicContext);

  if (!convexUrl || !publicContext) {
    return null;
  }

  return (
    <>
      <Script id="open-helpdesk-widget-config" strategy="afterInteractive">{`
        window.OpenHelpdesk = Object.assign({}, window.OpenHelpdesk, {
          organizationId: "${publicContext.organizationId}",
          convexUrl: "${convexUrl}",
          siteUrl: window.location.origin,
          color: ${JSON.stringify(publicContext.widgetColor)},
          greeting: ${JSON.stringify(publicContext.widgetGreeting)},
          position: ${JSON.stringify(publicContext.widgetPosition)}
        });
      `}</Script>
      <Script id="open-helpdesk-widget-script" src="/open-helpdesk.js" strategy="afterInteractive" />
    </>
  );
}
