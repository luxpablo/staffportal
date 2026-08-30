import { prisma } from "./prisma";
import { getRoleLevel, isFounder } from "./channelAuth";

export async function canAccessMeeting(user:any, meeting:any){
  if(!user || !meeting) return false;
  if(isFounder(user)) return true;
  // Host always can
  if(meeting.hostId===user.id) return true;
  // Check if user is participant
  const participant = await prisma.meetingParticipant.findUnique({ where:{ meetingId_userId:{ meetingId: meeting.id, userId: user.id } }});
  if(participant) return true;
  // Check visibility for calendar events? For meetings, check type
  if(meeting.type==="COMPANY") return true;
  if(meeting.type==="DEPARTMENT" && meeting.departmentId){
    if(user.departmentId===meeting.departmentId) return true;
    if(getRoleLevel(user.role?.name) >= 50) return true; // managers can see dept meetings
  }
  // Channel-linked meeting: check channel access
  if(meeting.channelId){
    const { canAccessChannel } = await import("./channelAuth");
    const channel = await prisma.channel.findUnique({ where:{ id: meeting.channelId }});
    if(channel && await canAccessChannel(user, channel)) return true;
  }
  // Private meetings only for participants
  if(meeting.type==="PRIVATE"){
    return false;
  }
  // For other types, check if invited or has permission
  return false;
}

export async function canManageMeeting(user:any, meeting:any){
  if(isFounder(user)) return true;
  if(meeting.hostId===user.id) return true;
  const participant = await prisma.meetingParticipant.findUnique({ where:{ meetingId_userId:{ meetingId: meeting.id, userId: user.id } }});
  if(participant?.role==="CO_HOST" || participant?.role==="HOST") return true;
  if(getRoleLevel(user.role?.name) >= 80) return true; // admin
  return false;
}

export async function requireMeetingAccess(user:any, meetingId:string){
  const meeting = await prisma.meeting.findUnique({ where:{ id: meetingId }, include:{ participants:true }});
  if(!meeting) throw new Error("Meeting not found");
  const can = await canAccessMeeting(user, meeting);
  if(!can) throw new Error("Forbidden: cannot access meeting");
  return meeting;
}

export function canCreateMeeting(user:any, type:string){
  if(isFounder(user)) return true;
  const level = getRoleLevel(user?.role?.name);
  // Only manager+ can create department/company meetings
  if(["DEPARTMENT","COMPANY","PRIVATE"].includes(type)){
    return level >= 50;
  }
  // All can create instant/scheduled/one-to-one
  return level >= 20;
}
