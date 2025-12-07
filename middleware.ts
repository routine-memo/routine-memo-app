import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // 로그인 페이지와 인증 API는 항상 접근 허용
  const isLoginPage = nextUrl.pathname === "/login";
  const isAuthApi = nextUrl.pathname.startsWith("/api/auth");
  const isPublicAsset = nextUrl.pathname.startsWith("/_next") ||
                        nextUrl.pathname.startsWith("/favicon") ||
                        nextUrl.pathname.includes(".");

  // 공개 경로는 항상 허용
  if (isAuthApi || isPublicAsset) {
    return NextResponse.next();
  }

  // 로그인 안 된 사용자가 보호된 페이지 접근 시 로그인 페이지로 리다이렉트
  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 로그인 된 사용자가 로그인 페이지 접근 시 메인으로 리다이렉트
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
