import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const helpCenterHost = (process.env.HELP_CENTER_HOST || "").toLowerCase();

  if (helpCenterHost && host === helpCenterHost) {
    const { pathname } = request.nextUrl;

    // Root → /help
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/help", request.url));
    }

    // /updates or /updates/:slug → /help/updates...
    if (pathname === "/updates" || pathname.startsWith("/updates/")) {
      return NextResponse.rewrite(
        new URL(`/help${pathname}`, request.url)
      );
    }

    // /category/:slug → /help/category/:slug
    if (pathname.startsWith("/category/")) {
      return NextResponse.rewrite(
        new URL(`/help${pathname}`, request.url)
      );
    }

    // /:slug → /help/:slug (but skip Next.js internals and static files)
    if (
      !pathname.startsWith("/help") &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/_next") &&
      !pathname.includes(".")
    ) {
      return NextResponse.rewrite(
        new URL(`/help${pathname}`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
