"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(token?: string): Socket | null {
  if(typeof window==="undefined") return null;
  if(socket?.connected) return socket;
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || "";
  // Use same host for socket, path /api/socket/io
  socket = io(url || window.location.origin, {
    path: "/api/socket/io",
    auth: token ? { token } : undefined,
    withCredentials: true,
    autoConnect: false,
  });
  return socket;
}

export function connectSocket(token:string){
  const s = getSocket(token);
  if(!s) return null;
  if(!s.connected) s.connect();
  return s;
}

export function disconnectSocket(){
  if(socket){
    socket.disconnect();
    socket=null;
  }
}
