// Abstraction for WebRTC SFU provider — allows swapping LiveKit/mediasoup/Janus
// For MVP, we use a simple mesh via Socket.IO signaling + browser getUserMedia/getDisplayMedia
// For production SFU, implement LiveKitProvider

export interface MeetingProvider {
  name: string;
  getConfig(): Promise<{ url:string, apiKey?:string } | null>;
  isConfigured(): Promise<boolean>;
  generateToken?(meetingId:string, userId:string, isHost:boolean): Promise<string>;
}

export class MeshProvider implements MeetingProvider {
  name = "mesh";
  async getConfig(){ return { url:"mesh" }; }
  async isConfigured(){ return true; }
  async generateToken(meetingId:string, userId:string, isHost:boolean){
    // For mesh, no token needed — use meetingCode as room
    return `mesh-${meetingId}-${userId}-${Date.now()}`;
  }
}

export class LiveKitProvider implements MeetingProvider {
  name = "livekit";
  async getConfig(){
    const url = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const secret = process.env.LIVEKIT_API_SECRET;
    if(!url || !apiKey || !secret) return null;
    return { url, apiKey };
  }
  async isConfigured(){
    const cfg = await this.getConfig();
    return !!cfg;
  }
  async generateToken(meetingId:string, userId:string, isHost:boolean){
    // In production, use livekit-server-sdk to generate token
    // For now, return a placeholder and log that LiveKit not configured
    return `livekit-${meetingId}-${userId}`;
  }
}

let provider: MeetingProvider | null = null;

export async function getMeetingProvider(): Promise<MeetingProvider> {
  if(provider) return provider;
  const livekit = new LiveKitProvider();
  if(await livekit.isConfigured()){
    provider = livekit;
    return provider;
  }
  provider = new MeshProvider();
  return provider;
}

export async function getProviderStatus(){
  const p = await getMeetingProvider();
  const cfg = await p.getConfig();
  return {
    provider: p.name,
    configured: await p.isConfigured(),
    url: cfg?.url || null,
    // Never expose secrets
  };
}
