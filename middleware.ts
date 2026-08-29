import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest){
  const token = req.cookies.get("zyphron_token")?.value;
  const isAuth = !!token;
  const pathname = req.nextUrl.pathname;
  const isLogin = pathname.startsWith("/login");
  const isApply = pathname.startsWith("/apply");
  const isApi = pathname.startsWith("/api");
  const isHome = pathname === "/" || pathname.startsWith("/#");
  const isPublic = pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".");
  if(isPublic) return NextResponse.next();
  // Public APIs for apply form (file upload + application submit + questions) — no auth required
  if(isApi){
    const publicApis = ["/api/upload","/api/applications","/api/application-questions"];
    if(publicApis.some(p=> pathname.startsWith(p))) return NextResponse.next();
    return NextResponse.next();
  }
  // Homepage and Apply are public
  if(isHome || isApply) return NextResponse.next();
  if(!isAuth && !isLogin){
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if(isAuth && isLogin){
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
