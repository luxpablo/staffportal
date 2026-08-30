import Redis from "ioredis";

let redis: Redis | null = null;
const memoryStore = new Map<string, { value:any, exp?:number }>();

export function getRedis(): Redis | null {
  if(redis) return redis;
  const url = process.env.REDIS_URL;
  if(!url){
    // console.log("[redis] no REDIS_URL, using memory fallback");
    return null;
  }
  try{
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    redis.on("error", (err)=> console.error("[redis] error", err.message));
    redis.connect().catch(()=>{});
    return redis;
  }catch(e){
    console.error("[redis] init failed", e);
    return null;
  }
}

// Memory fallback helpers
export async function redisGet(key:string){
  const r = getRedis();
  if(r){
    try{ return await r.get(key); }catch{ return null; }
  }
  const v = memoryStore.get(key);
  if(!v) return null;
  if(v.exp && Date.now() > v.exp){ memoryStore.delete(key); return null; }
  return v.value;
}

export async function redisSet(key:string, value:string, ttlSec?:number){
  const r = getRedis();
  if(r){
    try{
      if(ttlSec) return await r.set(key, value, "EX", ttlSec);
      return await r.set(key, value);
    }catch{ return null; }
  }
  memoryStore.set(key, { value, exp: ttlSec? Date.now()+ttlSec*1000 : undefined });
}

export async function redisDel(key:string){
  const r = getRedis();
  if(r) try{ await r.del(key); }catch{}
  memoryStore.delete(key);
}

export async function redisHSet(key:string, field:string, value:string){
  const r = getRedis();
  if(r){
    try{ return await r.hset(key, field, value); }catch{ return null; }
  }
  // memory: store as hash
  const h = memoryStore.get(key)?.value || {};
  h[field]=value;
  memoryStore.set(key, { value: h });
}

export async function redisHGetAll(key:string){
  const r = getRedis();
  if(r){
    try{ return await r.hgetall(key); }catch{ return {}; }
  }
  const h = memoryStore.get(key)?.value;
  return h || {};
}

export async function redisExpire(key:string, ttlSec:number){
  const r = getRedis();
  if(r) try{ await r.expire(key, ttlSec); }catch{}
  const v = memoryStore.get(key);
  if(v) v.exp = Date.now()+ttlSec*1000;
}
