import { redisGet, redisSet } from "./redis";

type Limit = { count:number, reset:number };

const memoryLimits = new Map<string, Limit>();

export async function rateLimit(key:string, limit:number, windowSec:number): Promise<{ allowed:boolean, remaining:number, reset:number }>{
  const now = Date.now();
  const windowMs = windowSec*1000;
  // Try redis first
  try{
    const rKey = `ratelimit:${key}`;
    const val = await redisGet(rKey);
    if(val){
      const data: Limit = JSON.parse(val as string);
      if(now < data.reset){
        if(data.count >= limit) return { allowed:false, remaining:0, reset: data.reset };
        data.count++;
        await redisSet(rKey, JSON.stringify(data), Math.ceil((data.reset-now)/1000));
        return { allowed:true, remaining: limit-data.count, reset: data.reset };
      }
    }
    const reset = now + windowMs;
    await redisSet(rKey, JSON.stringify({ count:1, reset }), windowSec);
    return { allowed:true, remaining: limit-1, reset };
  }catch{}

  // Memory fallback
  const data = memoryLimits.get(key);
  if(data && now < data.reset){
    if(data.count >= limit) return { allowed:false, remaining:0, reset: data.reset };
    data.count++;
    return { allowed:true, remaining: limit-data.count, reset: data.reset };
  }
  const reset = now + windowMs;
  memoryLimits.set(key, { count:1, reset });
  return { allowed:true, remaining: limit-1, reset };
}
