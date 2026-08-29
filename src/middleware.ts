import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest){
  const token = req.cookies.get("zyphron_token")?.value;
  const isAuth = !!token;
  const pathname = req.nextUrl.pathname;
  const isLogin = pathname.startsWith("/login");
  const isApi = pathname.startsWith("/api");
  const isHome = pathname === "/" || pathname.startsWith("/#");
  const isPublic = pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".");
  if(isPublic) return NextResponse.next();
  if(isApi) return NextResponse.next();
  // Homepage is public — no auth required (shows active/offline/whole team from real DB)
  if(isHome) return NextResponse.next();
  if(!isAuth && !isLogin){
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if(isAuth && isLogin){
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
