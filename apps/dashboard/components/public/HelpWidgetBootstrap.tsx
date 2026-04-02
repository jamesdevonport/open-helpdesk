"use client";

import Script from "next/script";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export function HelpWidgetBootstrap() {
  const publicContext = useQuery(api.organizations.getPublicContext);

  if (!CONVEX_URL || !publicContext) {
    return null;
  }

  return (
    <>
      <Script id="open-helpdesk-widget-config" strategy="afterInteractive">{`
        window.OpenHelpdesk = Object.assign({}, window.OpenHelpdesk, {
          organizationId: "${publicContext.organizationId}",
          convexUrl: "${CONVEX_URL}",
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
