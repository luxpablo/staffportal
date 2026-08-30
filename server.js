const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const SECRET = process.env.AUTH_SECRET || "zyphron_dev_secret_32_chars_minimum!!";

// In-memory stores for fallback (if no Redis)
const presence = new Map(); // userId -> { status, lastSeen, socketId }
const typing = new Map(); // channelId -> Set<userId>

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try{
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    }catch(err){
      console.error("Error handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    path: "/api/socket/io",
    cors: { origin: "*", methods: ["GET","POST"] },
  });

  // Auth middleware for socket
  io.use((socket, next) => {
    try{
      const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.match(/zyphron_token=([^;]+)/)?.[1];
      if(!token) return next(new Error("Unauthorized: no token"));
      const decoded = jwt.verify(token, SECRET);
      if(!decoded?.userId) return next(new Error("Invalid token"));
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    }catch(e){
      next(new Error("Auth failed: "+e.message));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`[socket] user ${userId} connected ${socket.id}`);

    // Presence: online
    presence.set(userId, { status:"Online", lastSeen: Date.now(), socketId: socket.id });
    io.emit("presence:update", { userId, status:"Online" });

    // Join authorized channels — server verifies via API in production, here we trust and let API enforce 403
    socket.on("channel:join", async (channelId, cb) => {
      try{
        socket.join(`channel:${channelId}`);
        if(cb) cb({ success:true });
        socket.to(`channel:${channelId}`).emit("member:joined", { channelId, userId });
      }catch(e){
        if(cb) cb({ error:e.message });
      }
    });

    socket.on("channel:leave", (channelId) => {
      socket.leave(`channel:${channelId}`);
      socket.to(`channel:${channelId}`).emit("member:left", { channelId, userId });
    });

    // Message events — client emits message:new, server broadcasts
    socket.on("message:new", (msg) => {
      // msg should contain channelId
      if(msg?.channelId){
        socket.to(`channel:${msg.channelId}`).emit("message:new", msg);
      }
    });
    socket.on("message:update", (msg) => {
      if(msg?.channelId) socket.to(`channel:${msg.channelId}`).emit("message:update", msg);
    });
    socket.on("message:delete", (data) => {
      if(data?.channelId) socket.to(`channel:${data.channelId}`).emit("message:delete", data);
    });
    socket.on("message:reaction", (data) => {
      if(data?.channelId) io.to(`channel:${data.channelId}`).emit("message:reaction", data);
    });

    // Typing
    socket.on("typing:start", ({ channelId }) => {
      if(!typing.has(channelId)) typing.set(channelId, new Set());
      typing.get(channelId).add(userId);
      socket.to(`channel:${channelId}`).emit("typing:start", { channelId, userId });
      // Auto stop after 3s
      setTimeout(()=>{
        typing.get(channelId)?.delete(userId);
        socket.to(`channel:${channelId}`).emit("typing:stop", { channelId, userId });
      }, 3000);
    });
    socket.on("typing:stop", ({ channelId }) => {
      typing.get(channelId)?.delete(userId);
      socket.to(`channel:${channelId}`).emit("typing:stop", { channelId, userId });
    });

    // Presence update
    socket.on("presence:update", ({ status }) => {
      presence.set(userId, { status: status||"Online", lastSeen: Date.now(), socketId: socket.id });
      io.emit("presence:update", { userId, status });
    });

    // Meeting signaling — WebRTC SFU mesh
    socket.on("meeting:join", ({ meetingId, meetingCode }) => {
      const room = `meeting:${meetingId||meetingCode}`;
      socket.join(room);
      socket.to(room).emit("meeting:participant-joined", { meetingId, meetingCode, userId, socketId: socket.id });
      console.log(`[meeting] ${userId} joined ${room}`);
    });
    socket.on("meeting:leave", ({ meetingId, meetingCode }) => {
      const room = `meeting:${meetingId||meetingCode}`;
      socket.leave(room);
      socket.to(room).emit("meeting:participant-left", { meetingId, meetingCode, userId });
    });
    socket.on("meeting:offer", (data) => {
      const room = `meeting:${data.meetingId||data.meetingCode}`;
      socket.to(room).emit("meeting:offer", { ...data, from: userId, socketId: socket.id });
    });
    socket.on("meeting:answer", (data) => {
      const room = `meeting:${data.meetingId||data.meetingCode}`;
      socket.to(room).emit("meeting:answer", { ...data, from: userId });
    });
    socket.on("meeting:ice-candidate", (data) => {
      const room = `meeting:${data.meetingId||data.meetingCode}`;
      socket.to(room).emit("meeting:ice-candidate", { ...data, from: userId });
    });
    socket.on("meeting:media-state", (data) => {
      const room = `meeting:${data.meetingId||data.meetingCode}`;
      io.to(room).emit("meeting:media-state", { ...data, userId });
    });
    socket.on("meeting:screen-share", (data) => {
      const room = `meeting:${data.meetingId||data.meetingCode}`;
      io.to(room).emit("meeting:screen-share", { ...data, userId });
    });
    socket.on("meeting:hand-raise", (data) => {
      const room = `meeting:${data.meetingId||data.meetingCode}`;
      io.to(room).emit("meeting:hand-raise", { ...data, userId });
    });
    socket.on("meeting:mute", (data) => {
      const room = `meeting:${data.meetingId||data.meetingCode}`;
      io.to(room).emit("meeting:mute", { ...data, userId });
    });
    socket.on("meeting:lock", (data) => {
      const room = `meeting:${data.meetingId||data.meetingCode}`;
      io.to(room).emit("meeting:lock", data);
    });

    socket.on("disconnect", () => {
      console.log(`[socket] user ${userId} disconnected`);
      presence.delete(userId);
      io.emit("presence:update", { userId, status:"Offline" });
      // Clean typing
      for(const [ch, set] of typing.entries()){
        if(set.has(userId)){
          set.delete(userId);
          socket.to(`channel:${ch}`).emit("typing:stop", { channelId: ch, userId });
        }
      }
    });
  });

  server.listen(port, (err) => {
    if(err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO on ws://${hostname}:${port}/api/socket/io`);
  });
});
