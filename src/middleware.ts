import { NextResponse, type NextRequest } from "next/server";

// First gate only: cheap cookie check. Real role checks happen in owner layouts and APIs.
export function middleware(req: NextRequest) {
  const isOwnerRoute = req.nextUrl.pathname.startsWith("/owner");
  if (isOwnerRoute && req.nextUrl.pathname === "/owner/login") return NextResponse.next();
  if (!req.cookies.get("session")) {
    const url = req.nextUrl.clone();
    url.pathname = isOwnerRoute ? "/owner/login" : "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/owner/:path*"] };
