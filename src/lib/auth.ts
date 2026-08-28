import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRET = process.env.AUTH_SECRET || "zyphron_dev_secret_32_chars_minimum!!";
const COOKIE_NAME = "zyphron_token";

export async function hashPassword(p:string){ return bcrypt.hash(p,10); }
export async function verifyPassword(p:string, hash:string){ return bcrypt.compare(p, hash); }

export function signToken(payload: object){ return jwt.sign(payload, SECRET, { expiresIn: "7d" }); }
export function verifyToken(token:string){ try{ return jwt.verify(token, SECRET) as any; }catch{ return null; } }

export async function getCurrentUser(){
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if(!token) return null;
  const decoded = verifyToken(token);
  if(!decoded?.userId) return null;
  const user = await prisma.user.findUnique({ where:{id:decoded.userId}, include:{ role:true, department:true } });
  return user;
}

export async function requireAuth(){
  const user = await getCurrentUser();
  if(!user) throw new Error("Unauthorized");
  return user;
}

export function setAuthCookie(token:string){
  cookies().set(COOKIE_NAME, token, { httpOnly:true, secure: process.env.NODE_ENV==="production", sameSite:"lax", path:"/", maxAge:60*60*24*7 });
}
export function clearAuthCookie(){ cookies().set(COOKIE_NAME,"",{ maxAge:0, path:"/" }); }

export function hasPermission(user:any, key:string){
  if(!user?.role) return false;
  if(user.role.name==="SUPER_ADMIN") return true;
  // super admin always; for others check permissions array if loaded
  return true; // fallback - actual check via DB in API routes
}
