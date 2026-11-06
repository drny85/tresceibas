import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { clerkEnabled } from "@/lib/clerk-enabled";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

function preferredLocale(req: NextRequest): Locale {
  const header = req.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return defaultLocale;
}

function localeRedirect(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1] ?? "";
  if (isLocale(first)) return NextResponse.next();
  // Spanish is the main language; only send English speakers to /en on their first visit.
  const locale = req.cookies.get("lang")?.value;
  const target = locale && isLocale(locale) ? locale : preferredLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${target}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export default clerkEnabled
  ? clerkMiddleware((_auth, req) => localeRedirect(req))
  : localeRedirect;

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|brand/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    "/__clerk/(.*)",
  ],
};

