import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest){
  const token = req.cookies.get("zyphron_token")?.value;
  const isAuth = !!token;
  const pathname = req.nextUrl.pathname;
  const isLogin = pathname.startsWith("/login");
  const isApi = pathname.startsWith("/api");
  const isPublic = pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".");
  if(isPublic) return NextResponse.next();
  // Allow all /api/* to be accessed without redirect (return JSON 401 if needed) — enables demo preview without DB
  if(isApi) return NextResponse.next();
  if(!isAuth && !isLogin){
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if(isAuth && isLogin){
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
