"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Hash, Lock, Megaphone, Users, Plus, Search, Send, Paperclip, Smile, Reply, Pin, MoreHorizontal, AtSign, X, MessageCircle, Crown, Code, Briefcase, Building2, Users2, Settings, FileText } from "lucide-react";

type Channel = { id:string; name:string; description?:string; type:string; isPrivate:boolean; unreadCount?:number; _count?:any; members?:any[] };
type Message = { id:string; content:string; author:{name:string;avatar?:string}; createdAt:string; replyTo?:any; reactions?:any[]; attachments?:any[]; isPinned?:boolean; editedAt?:string };

const WORKSPACES = [
  { id:"founder", label:"Founder Office", icon:Crown, color:"from-amber-500 to-yellow-600" },
  { id:"management", label:"Management", icon:Building2, color:"from-blue-600 to-indigo-600" },
  { id:"development", label:"Development", icon:Code, color:"from-violet-600 to-indigo-600" },
  { id:"support", label:"Support", icon:Users, color:"from-emerald-500 to-teal-600" },
  { id:"sales", label:"Sales", icon:Briefcase, color:"from-orange-500 to-red-500" },
];

export default function ChannelsPage(){
  const [channels,setChannels]=useState<Channel[]>([]);
  const [conversations,setConversations]=useState<any[]>([]);
  const [selected,setSelected]=useState<Channel| null>(null);
  const [selectedDM,setSelectedDM]=useState<any>(null);
  const [messages,setMessages]=useState<Message[]>([]);
  const [input,setInput]=useState("");
  const [search,setSearch]=useState("");
  const [showCreate,setShowCreate]=useState(false);
  const [createForm,setCreateForm]=useState({ name:"", description:"", type:"PUBLIC", isPrivate:false, workspaceId:"development" });
  const [typingUsers,setTypingUsers]=useState<string[]>([]);
  const [presence,setPresence]=useState<Record<string,string>>({});
  const [threadParent,setThreadParent]=useState<Message| null>(null);
  const [showMembers,setShowMembers]=useState(true);
  const [showThread,setShowThread]=useState(false);
  const messagesEndRef=useRef<HTMLDivElement>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [editContent,setEditContent]=useState("");

  const loadChannels=()=> fetch("/api/channels").then(r=>r.json()).then(d=> setChannels(d.data||[]));
  const loadDMs=()=> fetch("/api/conversations").then(r=>r.json()).then(d=> setConversations(d.data||[]));
  useEffect(()=>{ loadChannels(); loadDMs(); },[]);

  const loadMessages=(channelId:string, cursor?:string)=>{
    const params=new URLSearchParams({ channelId, limit:"50" });
    if(cursor) params.set("cursor", cursor);
    if(search) params.set("search", search);
    fetch(`/api/messages?${params}`).then(r=>r.json()).then(d=>{
      if(cursor) setMessages(prev=> [...d.data, ...prev]);
      else setMessages(d.data||[]);
    });
  };
  useEffect(()=>{ if(selected) loadMessages(selected.id); else if(selectedDM) {
    fetch(`/api/conversations/${selectedDM.id}/messages`).then(r=>r.json()).then(d=> setMessages(d.data||[]));
  }},[selected, selectedDM]);

  useEffect(()=>{ messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); },[messages]);

  // Socket real-time (try connect, fallback to polling)
  useEffect(()=>{
    let interval:any;
    try{
      // Try Socket.IO if available
      const token = document.cookie.match(/zyphron_token=([^;]+)/)?.[1];
      if(token){
        import("@/lib/socketClient").then(({ getSocket })=>{
          const s=getSocket(token);
          if(s){
            s.connect();
            s.on("message:new", (msg:any)=>{
              if(msg.channelId===selected?.id) setMessages(prev=> [...prev, msg]);
            });
            s.on("typing:start", ({userId}:{userId:string})=> setTypingUsers(prev=> [...new Set([...prev, userId])]));
            s.on("typing:stop", ({userId}:{userId:string})=> setTypingUsers(prev=> prev.filter(id=> id!==userId)));
            s.on("presence:update", ({userId, status}:{userId:string,status:string})=> setPresence(prev=> ({...prev, [userId]:status})));
            if(selected) s.emit("channel:join", selected.id);
            return ()=> s.disconnect();
          }
        }).catch(()=>{});
      }
    }catch{}
    // Fallback polling for messages every 3s
    interval=setInterval(()=>{
      if(selected) loadMessages(selected.id);
    },3000);
    return ()=> clearInterval(interval);
  },[selected]);

  const sendMessage=async()=>{
    if(!input.trim() || (!selected && !selectedDM)) return;
    const content=input.trim();
    setInput("");
    if(selected){
      const res=await fetch("/api/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ channelId: selected.id, content, replyToId: threadParent?.id })});
      const j=await res.json();
      if(!res.ok) return alert(j.error);
      setMessages(prev=> [...prev, j.data]);
      // Emit via socket
      try{
        const token=document.cookie.match(/zyphron_token=([^;]+)/)?.[1];
        const { getSocket }=await import("@/lib/socketClient");
        getSocket(token)?.emit("message:new", { ...j.data, channelId: selected.id });
        getSocket(token)?.emit("typing:stop", { channelId: selected.id });
      }catch{}
      setThreadParent(null);
    } else if(selectedDM){
      const res=await fetch(`/api/conversations/${selectedDM.id}/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ content })});
      const j=await res.json();
      if(!res.ok) return alert(j.error);
      setMessages(prev=> [...prev, j.data]);
    }
  };

  const handleTyping=(v:string)=>{
    setInput(v);
    if(selected && v){
      try{
        const token=document.cookie.match(/zyphron_token=([^;]+)/)?.[1];
        import("@/lib/socketClient").then(({getSocket})=> getSocket(token)?.emit("typing:start", { channelId: selected.id }));
      }catch{}
    }
  };

  const createChannel=async(e:React.FormEvent)=>{
    e.preventDefault();
    const res=await fetch("/api/channels",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(createForm)});
    const j=await res.json();
    if(!res.ok) return alert(j.error);
    setShowCreate(false);
    setCreateForm({ name:"", description:"", type:"PUBLIC", isPrivate:false, workspaceId:"development" });
    loadChannels();
  };

  const handleFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    const fd=new FormData();
    fd.append("file", file);
    const res=await fetch("/api/upload",{method:"POST", body: fd});
    const j=await res.json();
    if(!res.ok) return alert(j.error);
    // Send as file message
    if(selected){
      await fetch("/api/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ channelId: selected.id, content: `📎 ${j.name}`, type:"FILE", attachments:[{ fileName: j.name, fileUrl: j.url, fileSize: j.size, mimeType: file.type }] })});
      loadMessages(selected.id);
    }
  };

  const toggleReaction=async(msgId:string, emoji:string)=>{
    const has = messages.find(m=> m.id===msgId)?.reactions?.some((r:any)=> r.emoji===emoji);
    if(has){
      await fetch(`/api/messages/${msgId}/reactions?emoji=${encodeURIComponent(emoji)}`,{method:"DELETE"});
    } else {
      await fetch(`/api/messages/${msgId}/reactions`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ emoji })});
    }
    if(selected) loadMessages(selected.id);
  };

  const filteredChannels = channels.filter(c=> !search || c.name.includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-64px-32px)] -m-4 lg:-m-6 bg-white dark:bg-slate-950 overflow-hidden">
      {/* Workspaces rail */}
      <div className="hidden lg:flex w-[64px] border-r bg-slate-900 dark:bg-slate-950 flex-col items-center py-3 gap-2 shrink-0">
        {WORKSPACES.map(w=>(
          <button key={w.id} className={`h-10 w-10 rounded-xl bg-gradient-to-br ${w.color} flex items-center justify-center text-white shadow-soft hover:scale-105 transition-transform`} title={w.label}>
            <w.icon className="h-5 w-5"/>
          </button>
        ))}
        <div className="h-px w-6 bg-white/10 my-1"/>
        <button className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white"><Plus className="h-5 w-5"/></button>
      </div>

      {/* Channel list */}
      <div className="w-[280px] border-r bg-slate-50 dark:bg-slate-900 flex flex-col shrink-0 hidden md:flex">
        <div className="p-3 border-b bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Zyphron Cloud</h2>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=> setShowCreate(true)}><Plus className="h-4 w-4"/></Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
            <Input placeholder="Search channels, messages, files..." className="pl-8 h-8 text-xs" value={search} onChange={e=> setSearch(e.target.value)}/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1 flex items-center gap-2">Channels <span className="ml-auto text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{filteredChannels.length}</span></div>
            <div className="space-y-0.5">
              {filteredChannels.length===0 ? <div className="text-xs text-muted-foreground py-4 text-center">No channels available yet.<br/><Button size="sm" variant="ghost" className="h-auto p-0 text-xs" onClick={()=> setShowCreate(true)}>Create one</Button></div> : filteredChannels.map(ch=>(
                <button key={ch.id} onClick={()=> { setSelected(ch); setSelectedDM(null); setShowThread(false); }}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-white dark:hover:bg-slate-800 ${selected?.id===ch.id?"bg-white dark:bg-slate-800 shadow-soft border":""}`}>
                  <span className="h-5 w-5 rounded flex items-center justify-center bg-slate-200 dark:bg-slate-700 shrink-0">
                    {ch.type==="ANNOUNCEMENT"?<Megaphone className="h-3 w-3"/> : ch.isPrivate? <Lock className="h-3 w-3"/> : <Hash className="h-3 w-3"/>}
                  </span>
                  <span className="truncate flex-1 text-xs font-medium">{ch.name}</span>
                  {ch.unreadCount ? <Badge variant="default" className="h-5 px-1.5 text-[10px]">{ch.unreadCount}</Badge> : null}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">Direct Messages</div>
            <div className="space-y-0.5">
              {conversations.length===0 ? <div className="text-xs text-muted-foreground py-2 px-2">No DMs — start a conversation with an authorized team member.</div> : conversations.slice(0,8).map((c:any)=>(
                <button key={c.id} onClick={()=> { setSelectedDM(c); setSelected(null); }} className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-white dark:hover:bg-slate-800 ${selectedDM?.id===c.id?"bg-white dark:bg-slate-800 shadow-soft border":""}`}>
                  <span className="h-6 w-6 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs font-bold">{c.members?.[0]?.user?.name?.[0]||"?"}</span>
                  <span className="truncate flex-1 text-xs">{c.name||c.members?.find((m:any)=>m.userId!==c.members?.[0]?.userId)?.user?.name||"DM"}</span>
                  {c.unreadCount ? <Badge className="h-4 px-1 text-[10px]">{c.unreadCount}</Badge> : <span className={`h-2 w-2 rounded-full ${presence[c.id]==="Online"?"bg-emerald-500":"bg-slate-300"}`}/>}
                </button>
              ))}
              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-white dark:hover:bg-slate-800"><Plus className="h-3 w-3"/> New DM</button>
            </div>
          </div>
        </div>
        <div className="p-2 border-t bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">ZC</div>
            <div className="flex-1 min-w-0"><div className="text-xs font-medium">You</div><div className="text-[11px] text-emerald-600 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"/> Online</div></div>
            <Button size="icon" variant="ghost" className="h-7 w-7"><Settings className="h-4 w-4"/></Button>
          </div>
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950">
        {!selected && !selectedDM ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4"><MessageCircle className="h-8 w-8 text-muted-foreground"/></div>
            <h3 className="font-semibold">Welcome to Zyphron Channels</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">Select a channel or DM to start collaborating. All messages are permission-checked — private channels like <code className="bg-muted px-1 rounded">founder-private</code> return 403 for unauthorized users.</p>
            <Button className="mt-4 gap-2" onClick={()=> setShowCreate(true)}><Plus className="h-4 w-4"/> Create Channel</Button>
          </div>
        ) : (
          <>
            <div className="h-12 border-b flex items-center gap-3 px-4 shrink-0">
              <div className="h-7 w-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center"><Hash className="h-4 w-4"/></div>
              <div>
                <div className="font-semibold text-sm flex items-center gap-2">{selected?.name || selectedDM?.name || "DM"} {selected?.isPrivate && <Lock className="h-3 w-3 text-muted-foreground"/>} {selected?.type==="ANNOUNCEMENT" && <Badge variant="warning" className="text-[10px]">Announcement</Badge>}</div>
                <div className="text-xs text-muted-foreground truncate">{selected?.description || `${selected?.members?.length||0} members • ${selected?.type}` || "Direct message"}</div>
              </div>
              <div className="ml-auto flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=> setShowMembers(!showMembers)}><Users className="h-4 w-4"/></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7"><Search className="h-4 w-4"/></Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-slate-50/30 dark:bg-slate-900/20">
              {messages.length===0 ? <div className="py-12 text-center"><div className="text-sm font-medium">This is the beginning of this conversation.</div><div className="text-xs text-muted-foreground">No messages yet — say hello!</div></div> : messages.map(m=>(
                <div key={m.id} className="group flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 p-2 rounded-xl -mx-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{m.author?.name?.[0]||"?"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2"><span className="font-medium text-sm">{m.author?.name}</span><span className="text-[11px] text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>{m.editedAt && <span className="text-[10px] text-muted-foreground">(edited)</span>}{m.isPinned && <Pin className="h-3 w-3 text-amber-500"/>}</div>
                    {m.replyTo && <div className="text-xs bg-slate-100 dark:bg-slate-800 rounded-lg p-2 mb-1 border-l-2 border-primary"><span className="font-medium">{m.replyTo.author?.name}:</span> {m.replyTo.content.slice(0,120)}</div>}
                    <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                    {(m.attachments?.length || 0) > 0 && <div className="mt-2 flex gap-2">{(m.attachments || []).map((a:any)=> <a key={a.id} href={a.fileUrl} target="_blank" className="text-xs flex items-center gap-1 p-2 rounded-lg border bg-white dark:bg-slate-800"><FileText className="h-3 w-3"/>{a.fileName} ({(a.fileSize/1024).toFixed(1)}kB)</a>)}</div>}
                    <div className="flex gap-1 mt-2">
                      {(m.reactions?.length || 0) > 0 && (
                        <div className="flex gap-1">{Array.from(new Set((m.reactions || []).map((r:any)=> r.emoji))).map((emoji:any)=>{
                          const count = (m.reactions || []).filter((r:any)=> r.emoji===emoji).length;
                          return <button key={emoji} onClick={()=> toggleReaction(m.id, emoji)} className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border flex items-center gap-1 hover:bg-slate-200">{emoji} <span>{count}</span></button>;
                        })}</div>
                      )}
                      <div className="hidden group-hover:flex gap-1 ml-auto">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={()=> setThreadParent(m)}><Reply className="h-3 w-3"/></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={()=> toggleReaction(m.id, "❤️")}><Smile className="h-3 w-3"/></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={()=>{
                          if(confirm("Delete message?")) fetch(`/api/messages/${m.id}`,{method:"DELETE"}).then(()=> loadMessages(selected!.id));
                        }}><X className="h-3 w-3"/></Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {typingUsers.length>0 && <div className="text-xs text-muted-foreground italic">{typingUsers.join(", ")} is typing...</div>}
              <div ref={messagesEndRef}/>
            </div>

            {threadParent && (
              <div className="border-t bg-amber-50 dark:bg-amber-950/20 p-2 flex items-center gap-2">
                <Reply className="h-4 w-4 text-muted-foreground"/>
                <span className="text-xs flex-1 truncate">Replying to <strong>{threadParent.author?.name}</strong>: {threadParent.content.slice(0,60)}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={()=> setThreadParent(null)}><X className="h-3 w-3"/></Button>
              </div>
            )}

            <div className="p-3 border-t bg-white dark:bg-slate-950 shrink-0">
              <div className="flex items-end gap-2 rounded-2xl border bg-slate-50 dark:bg-slate-900 p-2">
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={()=> fileRef.current?.click()}><Paperclip className="h-4 w-4"/></Button>
                <input ref={fileRef} type="file" className="hidden" onChange={handleFile}/>
                <textarea
                  value={input}
                  onChange={e=> handleTyping(e.target.value)}
                  onKeyDown={e=> { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendMessage(); } }}
                  placeholder={`Message #${selected?.name||"DM"} — @ for mentions, Shift+Enter for newline`}
                  className="flex-1 bg-transparent outline-none text-sm resize-none min-h-[36px] max-h-[120px] py-2"
                  rows={1}
                />
                <Button size="icon" className="h-8 w-8 shrink-0" onClick={sendMessage} disabled={!input.trim()}><Send className="h-4 w-4"/></Button>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 flex gap-2">
                <span><strong>Enter</strong> to send</span><span>•</span><span><strong>Shift+Enter</strong> newline</span><span>•</span><span>Drag/drop or paste images</span>
                {editingId && <span>• Editing <Button variant="ghost" className="h-auto p-0 text-xs" onClick={()=> {setEditingId(null); setEditContent("");}}>Cancel</Button></span>}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Members */}
      {showMembers && selected && (
        <div className="hidden xl:flex w-[240px] border-l bg-slate-50 dark:bg-slate-900 flex-col shrink-0">
          <div className="p-3 border-b bg-white dark:bg-slate-900">
            <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"><Users className="h-3 w-3"/> Members — {selected.members?.length||0}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {(selected.members||[]).map((m:any)=>(
              <div key={m.userId} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800">
                <div className="h-7 w-7 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs font-bold">{m.user?.name?.[0]}</div>
                <div className="flex-1 min-w-0"><div className="text-xs font-medium truncate">{m.user?.name}</div><div className="text-[11px] text-muted-foreground">{m.role} • {m.user?.status}</div></div>
                <span className={`h-2 w-2 rounded-full ${presence[m.userId]==="Online"?"bg-emerald-500":"bg-slate-300"}`}/>
              </div>
            ))}
            <div className="text-xs text-muted-foreground p-2">Pinned messages, files, and channel settings would appear here.</div>
          </div>
        </div>
      )}

      {/* Create channel modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=> setShowCreate(false)}>
          <form onSubmit={createChannel} onClick={e=> e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="font-semibold">Create Channel</h3>
            <div className="space-y-1"><label className="text-sm font-medium">Name *</label><div className="flex items-center gap-2"><span className="text-muted-foreground">#</span><Input value={createForm.name} onChange={e=> setCreateForm({...createForm, name:e.target.value})} placeholder="general" required /></div></div>
            <div className="space-y-1"><label className="text-sm font-medium">Description</label><Input value={createForm.description} onChange={e=> setCreateForm({...createForm, description:e.target.value})} placeholder="What is this channel about?" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-sm font-medium">Type</label><select value={createForm.type} onChange={e=> setCreateForm({...createForm, type:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>PUBLIC</option><option>PRIVATE</option><option>ANNOUNCEMENT</option><option>PROJECT</option><option>SUPPORT</option><option>MANAGEMENT</option></select></div>
              <div className="space-y-1"><label className="text-sm font-medium">Workspace</label><select value={createForm.workspaceId} onChange={e=> setCreateForm({...createForm, workspaceId:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option value="development">Development</option><option value="management">Management</option><option value="founder">Founder Office</option><option value="support">Support</option><option value="sales">Sales</option></select></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={createForm.isPrivate} onChange={e=> setCreateForm({...createForm, isPrivate:e.target.checked})} /> Private (only invited members)</label>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=> setShowCreate(false)}>Cancel</Button><Button type="submit">Create</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
