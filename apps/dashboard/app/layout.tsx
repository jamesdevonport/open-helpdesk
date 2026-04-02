import type { Metadata } from "next";
import { ConvexClientProvider } from "@/lib/convex";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open Helpdesk",
  description: "Open-source support desk on Convex and Cloudflare Workers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-surface-secondary text-text-primary">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
