// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg","image/png","image/webp","application/pdf","image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req:NextRequest){
  try{
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // photo | identity
    if(!file) return NextResponse.json({ error:"No file uploaded" }, {status:400});

    if(file.size > MAX_SIZE) return NextResponse.json({ error:"File too large — max 5MB" }, {status:400});
    // allow all image/pdf for now, validate by extension as well
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const allowedExts = ["jpg","jpeg","png","webp","pdf"];
    if(!allowedExts.includes(ext)) return NextResponse.json({ error:`Invalid file type .${ext} — allowed: ${allowedExts.join(", ")}` }, {status:400});

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const subdir = type==="photo" ? "photos" : "identity";
    const uploadDir = path.join(process.cwd(), "public", "uploads", "applications", subdir);
    await mkdir(uploadDir, { recursive:true });

    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const filepath = path.join(uploadDir, safeName);
    await writeFile(filepath, buffer);

    const url = `/uploads/applications/${subdir}/${safeName}`;
    return NextResponse.json({ success:true, url, name: file.name, size: file.size });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
