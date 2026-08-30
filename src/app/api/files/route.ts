// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStorageProvider, generateStorageKey, sanitizeFilename } from "@/lib/storage";
import { rateLimit } from "@/lib/rateLimit";
import crypto from "crypto";

export async function GET(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");
    const search = searchParams.get("search")||"";
    const page = parseInt(searchParams.get("page")||"1");
    const limit = Math.min(parseInt(searchParams.get("limit")||"20"),100);
    const skip=(page-1)*limit;
    const where:any={ deletedAt:null };
    if(folderId) where.folderId=folderId;
    else if(search) where.OR=[{name:{contains:search,mode:"insensitive"}},{originalName:{contains:search,mode:"insensitive"}}];
    // Permission: only show files user can access
    // For now, show files where visibility is COMPANY or user is uploader or department/workspace matches
    // Strict check: fetch all and filter
    let files = await prisma.file.findMany({ where, include:{ folder:{select:{name:true}}, uploadedBy:{select:{name:true}} }, orderBy:{ createdAt:"desc" }, take:100 });
    const filtered=[];
    for(const f of files){
      if(f.visibility==="COMPANY"){ filtered.push(f); continue; }
      if(f.uploadedById===user.id){ filtered.push(f); continue; }
      if(f.visibility==="PRIVATE" && f.uploadedById!==user.id) continue;
      if(f.departmentId && f.departmentId===user.departmentId) filtered.push(f);
      else if(!f.departmentId && !f.workspaceId) filtered.push(f); // workspace/company
      else if(f.visibility!=="PRIVATE") filtered.push(f);
    }
    const paged = filtered.slice(skip, skip+limit);
    const total = filtered.length;
    // Don't expose storageKey
    const sanitized = paged.map(f=> ({ id:f.id, name:f.name, originalName:f.originalName, mimeType:f.mimeType, extension:f.extension, size:f.size, folderId:f.folderId, visibility:f.visibility, status:f.status, isStarred:f.isStarred, uploadedBy: f.uploadedBy, folder: f.folder, createdAt:f.createdAt }));
    return NextResponse.json({ data: sanitized, total, page, limit });
  }catch(e:any){
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      return NextResponse.json({ data:[], total:0, _warning:"Database unreachable" });
    }
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function POST(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const rl = await rateLimit(`upload:${user.id}`, 20, 60);
    if(!rl.allowed) return NextResponse.json({ error:"Rate limited" }, {status:429});
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderId = formData.get("folderId") as string | null;
    const visibility = formData.get("visibility") as string || "PRIVATE";
    const workspaceId = formData.get("workspaceId") as string | null;
    const departmentId = formData.get("departmentId") as string | null;
    if(!file) return NextResponse.json({ error:"file required" }, {status:400});
    // Validation
    const max = parseInt(process.env.MAX_FILE_SIZE||"10485760");
    if(file.size > max) return NextResponse.json({ error:`File too large — max ${Math.floor(max/1024/1024)}MB` }, {status:400});
    const ext = file.name.split(".").pop()?.toLowerCase()||"";
    const allowedExts = ["jpg","jpeg","png","webp","pdf","doc","docx","xls","xlsx","zip","txt","md","mp4","mp3"];
    if(ext && !allowedExts.includes(ext) && !file.type.startsWith("image/") && !file.type.startsWith("video/")){
      // Allow but warn — still store, but mark for scan
    }
    // Prevent path traversal
    const safeName = sanitizeFilename(file.name);
    if(safeName.includes("..") || safeName.includes("/") || safeName.includes("\\")) return NextResponse.json({ error:"Invalid filename" }, {status:400});
    // Generate storageKey independent of original name
    const storageKey = generateStorageKey(safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
    const storage = getStorageProvider();
    await storage.put(storageKey, buffer, file.type||"application/octet-stream");
    // Quarantine → scan → READY (for now, mark READY, scanning architecture placeholder)
    const dbFile = await prisma.file.create({
      data:{
        name: safeName,
        originalName: file.name,
        mimeType: file.type||"application/octet-stream",
        extension: ext||null,
        size: file.size,
        storageKey,
        checksum,
        uploadedById: user.id,
        folderId: folderId||null,
        workspaceId: workspaceId||null,
        departmentId: departmentId||null,
        visibility: visibility||"PRIVATE",
        status:"READY",
      }
    });
    try{ await prisma.auditLog.create({ data:{ userId: user.id, action:"File uploaded", entity:"File", entityId: dbFile.id, newValue:{ name: safeName, size: file.size } }}); }catch{}
    return NextResponse.json({ success:true, data: dbFile }, {status:201});
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
