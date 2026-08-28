import { prisma } from "./prisma";
export async function auditLog(opts:{userId?:string, action:string, entity:string, entityId?:string, oldValue?:any, newValue?:any, ip?:string, userAgent?:string}){
  try{ await prisma.auditLog.create({ data: opts }); }catch(e){ console.error("auditLog failed", e); }
}
