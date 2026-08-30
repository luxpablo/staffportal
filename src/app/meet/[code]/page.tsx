"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare, Hand, MessageCircle, Users, Settings, PhoneOff, Grid, User, Crown } from "lucide-react";

export default function MeetRoom(){
  const { code } = useParams();
  const router = useRouter();
  const [meeting,setMeeting]=useState<any>(null);
  const [joined,setJoined]=useState(false);
  const [waiting,setWaiting]=useState(false);
  const [micOn,setMicOn]=useState(true);
  const [camOn,setCamOn]=useState(true);
  const [screenOn,setScreenOn]=useState(false);
  const [handRaised,setHandRaised]=useState(false);
  const [participants,setParticipants]=useState<any[]>([]);
  const [chat,setChat]=useState<any[]>([]);
  const [chatInput,setChatInput]=useState("");
  const [error,setError]=useState("");
  const [isHost,setIsHost]=useState(false);
  const localVideoRef=useRef<HTMLVideoElement>(null);
  const [stream,setStream]=useState<MediaStream| null>(null);
  const [screenStream,setScreenStream]=useState<MediaStream| null>(null);
  const [view,setView]=useState<"grid"|"speaker">("grid");
  const [password,setPassword]=useState("");

  const loadMeeting=async()=>{
    const res=await fetch(`/api/meetings/${code}`.replace("/meet/","/api/meetings/"));
    // Actually we have meetingCode, need to fetch via code — for now fetch all and find
    const all=await fetch("/api/meetings").then(r=>r.json());
    const found=all.data?.find((m:any)=> m.meetingCode===code);
    if(found){
      setMeeting(found);
      setIsHost(found.hostId===found.hostId); // placeholder
    } else {
      // Try direct id
      const res2=await fetch(`/api/meetings/${code}`);
      if(res2.ok){
        const j=await res2.json();
        setMeeting(j.data);
      } else {
        setError("Meeting not found or not authorized");
      }
    }
  };
  useEffect(()=>{ loadMeeting(); },[code]);

  const initMedia=async()=>{
    try{
      const s=await navigator.mediaDevices.getUserMedia({ video: camOn, audio: micOn });
      setStream(s);
      if(localVideoRef.current) localVideoRef.current.srcObject=s;
    }catch(e:any){
      setError("Camera/mic permission denied: "+e.message);
    }
  };
  useEffect(()=>{ initMedia(); return ()=>{ stream?.getTracks().forEach(t=> t.stop()); screenStream?.getTracks().forEach(t=> t.stop()); }; },[]);

  useEffect(()=>{
    if(stream && localVideoRef.current) localVideoRef.current.srcObject=stream;
  },[stream]);

  const toggleMic=()=>{
    stream?.getAudioTracks().forEach(t=> t.enabled = !micOn);
    setMicOn(!micOn);
    // Signal via socket
  };
  const toggleCam=()=>{
    stream?.getVideoTracks().forEach(t=> t.enabled = !camOn);
    setCamOn(!camOn);
  };
  const toggleScreen=async()=>{
    if(screenOn){
      screenStream?.getTracks().forEach(t=> t.stop());
      setScreenOn(false);
      setScreenStream(null);
    }else{
      try{
        const s=await navigator.mediaDevices.getDisplayMedia({ video:true });
        setScreenStream(s);
        setScreenOn(true);
        s.getVideoTracks()[0].onended=()=>{ setScreenOn(false); setScreenStream(null); };
      }catch(e:any){ setError("Screen share failed: "+e.message); }
    }
  };

  const join=async()=>{
    setError("");
    try{
      // Find meeting id — for now use code as id fallback
      const id = meeting?.id || code as string;
      const res=await fetch(`/api/meetings/${id}/join`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ password: password||undefined })});
      const j=await res.json();
      if(!res.ok) throw new Error(j.error);
      if(j.waiting){
        setWaiting(true);
        setError("Please wait for the host to admit you.");
      } else {
        setJoined(true);
        setWaiting(false);
        // Load participants
        const p=await fetch(`/api/meetings/${id}`).then(r=>r.json());
        setParticipants(p.data?.participants||[]);
      }
    }catch(e:any){ setError(e.message); }
  };

  if(!meeting && !error) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"/></div>;

  if(!joined){
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <div className="max-w-5xl mx-auto w-full p-6 flex-1 flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{meeting?.title||"Meeting"}</h1>
            <p className="text-sm text-slate-400">{meeting?.description||""} • Host: {meeting?.host?.name||""} • {meeting?.scheduledStart? new Date(meeting.scheduledStart).toLocaleString("en-IN"):""}</p>
            {meeting?.isLocked && <Badge variant="destructive" className="mt-2">Locked</Badge>}
            {meeting?.waitingRoomEnabled && <Badge variant="warning" className="mt-2">Waiting room enabled</Badge>}
            <div className="mt-6 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 aspect-video flex items-center justify-center">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {!stream && <div className="absolute text-sm text-slate-400">Camera preview</div>}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant={micOn?"secondary":"destructive"} size="icon" onClick={toggleMic}>{micOn?<Mic className="h-4 w-4"/>:<MicOff className="h-4 w-4"/>}</Button>
              <Button variant={camOn?"secondary":"destructive"} size="icon" onClick={toggleCam}>{camOn?<VideoIcon className="h-4 w-4"/>:<VideoOff className="h-4 w-4"/>}</Button>
              <select className="h-9 rounded-xl border bg-slate-900 px-3 text-sm flex-1">
                <option>Default Microphone</option>
              </select>
              <select className="h-9 rounded-xl border bg-slate-900 px-3 text-sm flex-1">
                <option>Default Camera</option>
              </select>
            </div>
            {error && <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">{error}</div>}
            {waiting && <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">Please wait for the host to admit you.</div>}
          </div>
          <Card className="w-full lg:w-[360px] h-fit">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2"><Crown className="h-5 w-5 text-amber-500"/> <span className="font-semibold">Ready to join?</span></div>
              <div className="text-sm text-muted-foreground">Camera: {camOn?"On":"Off"} • Mic: {micOn?"On":"Off"}</div>
              {meeting?.passwordHash && <div className="space-y-1"><label className="text-sm font-medium">Password</label><Input type="password" value={password} onChange={e=> setPassword(e.target.value)} placeholder="Meeting password"/></div>}
              <Button onClick={join} className="w-full gap-2"><VideoIcon className="h-4 w-4"/> Join Now</Button>
              <Button variant="outline" className="w-full" onClick={()=> router.push("/meetings")}>Cancel</Button>
              <div className="text-xs text-muted-foreground">Secure join link: <code className="bg-muted px-1 rounded">/meet/{String(code)}</code> (meetingCode, revocable)</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="h-12 border-b border-white/10 flex items-center gap-3 px-4">
        <div className="font-semibold text-sm truncate">{meeting?.title}</div>
        <Badge variant="destructive" className="animate-pulse text-xs">LIVE</Badge>
        <span className="text-xs text-slate-400">• {participants.length} participants • {Math.floor((Date.now() - new Date(meeting?.startedAt||Date.now()).getTime())/60000)}m</span>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant={view==="grid"?"secondary":"ghost"} className="h-7" onClick={()=> setView("grid")}><Grid className="h-4 w-4"/></Button>
          <Button size="sm" variant={view==="speaker"?"secondary":"ghost"} className="h-7" onClick={()=> setView("speaker")}><User className="h-4 w-4"/></Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-3 grid gap-3 content-start overflow-y-auto" style={{gridTemplateColumns: view==="grid"?"repeat(auto-fill,minmax(240px,1fr))":"1fr"}}>
          {/* Local video */}
          <div className="rounded-2xl overflow-hidden bg-slate-900 border border-white/10 aspect-video relative">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 text-xs font-medium bg-black/50 px-2 py-1 rounded-full flex items-center gap-1">You {micOn?<Mic className="h-3 w-3"/>:<MicOff className="h-3 w-3 text-red-400"/>} {handRaised && "✋"}</div>
            {screenOn && <div className="absolute top-2 right-2 text-xs bg-blue-600 px-2 py-1 rounded-full">Sharing</div>}
          </div>
          {/* Remote participants (mock for now, would be WebRTC streams) */}
          {participants.filter((p:any)=> p.userId!==meeting?.hostId).slice(0,6).map((p:any)=>(
            <div key={p.id} className="rounded-2xl overflow-hidden bg-slate-800 border border-white/10 aspect-video flex items-center justify-center">
              <div className="text-center"><div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto font-bold">{p.user?.name?.[0]||"?"}</div><div className="text-xs mt-2">{p.user?.name}</div><div className="text-[10px] opacity-70">{p.microphoneEnabled?"🎤":"🔇"} {p.cameraEnabled?"📹":""}</div></div>
            </div>
          ))}
          {screenStream && (
            <div className="rounded-2xl overflow-hidden bg-black border-2 border-blue-500 aspect-video col-span-full">
              <video autoPlay playsInline ref={el=> { if(el && screenStream) el.srcObject=screenStream; }} className="w-full h-full object-contain" />
              <div className="absolute bottom-2 left-2 text-xs bg-blue-600 px-2 py-1 rounded-full">Screen Share</div>
            </div>
          )}
        </div>

        <div className="hidden lg:flex w-[320px] border-l border-white/10 bg-slate-900 flex-col">
          <div className="p-3 border-b flex gap-1">
            <Button size="sm" variant="secondary" className="flex-1 gap-2"><Users className="h-4 w-4"/> {participants.length}</Button>
            <Button size="sm" variant="ghost" className="flex-1 gap-2"><MessageCircle className="h-4 w-4"/> Chat</Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider opacity-50">Participants</div>
            {participants.map((p:any)=>(
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5">
                <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">{p.user?.name?.[0]}</div>
                <div className="flex-1 min-w-0"><div className="text-xs font-medium truncate">{p.user?.name} {p.role==="HOST"&&<Crown className="h-3 w-3 inline text-amber-400"/>}</div><div className="text-[11px] opacity-50">{p.status}</div></div>
                <div className="flex gap-1">{p.handRaised && <Hand className="h-3 w-3 text-amber-400"/>}{p.microphoneEnabled?<Mic className="h-3 w-3"/>:<MicOff className="h-3 w-3 text-red-400"/>}</div>
              </div>
            ))}
            <div className="text-xs font-semibold uppercase tracking-wider opacity-50 mt-4">Chat</div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {chat.map((c:any,i:number)=> <div key={i} className="text-xs p-2 rounded-lg bg-white/5"><span className="font-medium">{c.author}:</span> {c.text}</div>)}
              {chat.length===0 && <div className="text-xs opacity-50 py-4 text-center">No messages yet</div>}
            </div>
          </div>
          <div className="p-3 border-t flex gap-2">
            <input value={chatInput} onChange={e=> setChatInput(e.target.value)} placeholder="Send a message..." className="flex-1 bg-white/10 rounded-full px-3 py-2 text-xs outline-none" onKeyDown={e=> e.key==="Enter" && (setChat([...chat,{author:"You",text:chatInput}] ), setChatInput(""))} />
            <Button size="icon" className="h-8 w-8 rounded-full" onClick={()=> { if(chatInput.trim()){ setChat([...chat,{author:"You",text:chatInput}]); setChatInput(""); } }}><MessageCircle className="h-4 w-4"/></Button>
          </div>
        </div>
      </div>

      <div className="h-[64px] border-t border-white/10 bg-slate-900 flex items-center justify-center gap-2 px-4">
        <Button size="icon" variant={micOn?"secondary":"destructive"} className="rounded-full h-10 w-10" onClick={toggleMic}>{micOn?<Mic className="h-5 w-5"/>:<MicOff className="h-5 w-5"/>}</Button>
        <Button size="icon" variant={camOn?"secondary":"destructive"} className="rounded-full h-10 w-10" onClick={toggleCam}>{camOn?<VideoIcon className="h-5 w-5"/>:<VideoOff className="h-5 w-5"/>}</Button>
        <Button size="icon" variant={screenOn?"default":"secondary"} className="rounded-full h-10 w-10" onClick={toggleScreen}><ScreenShare className="h-5 w-5"/></Button>
        <Button size="icon" variant={handRaised?"default":"secondary"} className="rounded-full h-10 w-10" onClick={()=> setHandRaised(!handRaised)}><Hand className={`h-5 w-5 ${handRaised?"fill-amber-400":""}`}/></Button>
        <div className="h-6 w-px bg-white/10 mx-2"/>
        <Button size="icon" variant="secondary" className="rounded-full h-10 w-10"><MessageCircle className="h-5 w-5"/></Button>
        <Button size="icon" variant="secondary" className="rounded-full h-10 w-10"><Users className="h-5 w-5"/></Button>
        <Button size="icon" variant="ghost" className="rounded-full h-10 w-10"><Settings className="h-5 w-5"/></Button>
        <Button variant="destructive" className="rounded-full ml-2 gap-2" onClick={()=> { setJoined(false); router.push("/meetings"); }}><PhoneOff className="h-4 w-4"/> Leave</Button>
      </div>
    </div>
  );
}
