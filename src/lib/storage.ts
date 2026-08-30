import { writeFile, mkdir, unlink, readFile, stat } from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StorageProvider {
  name: string;
  put(key: string, buffer: Buffer, mimeType: string): Promise<{ key:string, url:string }>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresSec?: number): Promise<string>;
  exists(key: string): Promise<boolean>;
}

class LocalStorageProvider implements StorageProvider {
  name = "local";
  baseDir = path.join(process.cwd(), "storage", "private");
  baseUrl = "/api/files/download?key="; // signed URL via API

  private fullPath(key:string){
    // Prevent path traversal — key is always organizations/.../uuid, never user input
    const safe = path.normalize(key).replace(/^(\.\.[\/\\])+/, "");
    return path.join(this.baseDir, safe);
  }

  async put(key:string, buffer:Buffer){
    const full = this.fullPath(key);
    await mkdir(path.dirname(full), { recursive:true });
    await writeFile(full, buffer);
    return { key, url: `${this.baseUrl}${encodeURIComponent(key)}` };
  }
  async get(key:string){
    const full=this.fullPath(key);
    return readFile(full);
  }
  async delete(key:string){
    try{ await unlink(this.fullPath(key)); }catch{}
  }
  async getSignedUrl(key:string, expiresSec=3600){
    // For local, return API endpoint with short-lived token (signed via JWT)
    const { signToken } = await import("./auth");
    const token = signToken({ key, exp: Date.now()+expiresSec*1000 });
    return `${this.baseUrl}${encodeURIComponent(key)}&token=${token}`;
  }
  async exists(key:string){
    try{ await stat(this.fullPath(key)); return true; }catch{ return false; }
  }
}

class S3StorageProvider implements StorageProvider {
  name = "s3";
  async put(key:string, buffer:Buffer, mimeType:string){
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = this.client();
    await client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));
    return { key, url: `s3://${process.env.S3_BUCKET}/${key}` };
  }
  async get(key:string){
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = this.client();
    const res = await client.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
    const chunks:Buffer[]=[];
    for await(const chunk of res.Body as any) chunks.push(chunk);
    return Buffer.concat(chunks);
  }
  async delete(key:string){
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = this.client();
    await client.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
  }
  async getSignedUrl(key:string, expiresSec=3600){
    // In production, install @aws-sdk/s3-presigner and generate signed URL
    // For now, return S3 key — download via /api/files/:id/download which verifies auth
    return `s3://${process.env.S3_BUCKET}/${key}?expires=${expiresSec}`;
  }
  async exists(key:string){
    const { S3Client, HeadObjectCommand } = await import("@aws-sdk/client-s3");
    const client = this.client();
    try{
      await client.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
      return true;
    }catch{ return false; }
  }
  private client(){
    const { S3Client } = require("@aws-sdk/client-s3");
    return new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }
}

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if(provider) return provider;
  const type = (process.env.STORAGE_PROVIDER || "local").toLowerCase();
  if(type==="s3" && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID){
    provider = new S3StorageProvider();
  } else {
    provider = new LocalStorageProvider();
  }
  return provider;
}

export function generateStorageKey(originalName:string, orgId="org_zyphron"){
  const ext = path.extname(originalName).toLowerCase();
  const uuid = crypto.randomUUID();
  // storageKey is independent of original name — prevents path traversal
  return `${orgId}/files/${uuid}${ext}`;
}

export function sanitizeFilename(name:string){
  return name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,100) || "file";
}
