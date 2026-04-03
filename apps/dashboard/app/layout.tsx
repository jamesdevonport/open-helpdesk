import type { Metadata } from "next";
import { ConvexClientProvider } from "@/lib/convex";
import { RuntimeConfigProvider } from "@/lib/runtime-config";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open Helpdesk",
  description: "Open-source support desk on Convex and Cloudflare Workers",
};

function readRuntimeEnv(name: string) {
  return globalThis.process?.env?.[name] || "";
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const convexUrl =
    readRuntimeEnv("NEXT_PUBLIC_CONVEX_URL") ||
    process.env.NEXT_PUBLIC_CONVEX_URL ||
    "";
  const convexSiteUrl =
    readRuntimeEnv("CONVEX_SITE_URL") ||
    process.env.CONVEX_SITE_URL ||
    convexUrl.replace(".cloud", ".site");
  const runtimeConfig = {
    convexUrl,
    convexSiteUrl,
    siteUrl: readRuntimeEnv("SITE_URL") || process.env.SITE_URL || "",
  };

  return (
    <html lang="en">
      <body className="bg-surface-secondary text-text-primary">
        <RuntimeConfigProvider value={runtimeConfig}>
          <ConvexClientProvider convexUrl={runtimeConfig.convexUrl}>
            {children}
          </ConvexClientProvider>
        </RuntimeConfigProvider>
      </body>
    </html>
  );
}
