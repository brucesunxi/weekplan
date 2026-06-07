import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes
  const publicPaths = ["/login", "/register"];
  if (publicPaths.includes(pathname)) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  // Root is public (landing/dashboard depending on auth)
  if (pathname === "/") return NextResponse.next();

  // All other routes require auth
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
