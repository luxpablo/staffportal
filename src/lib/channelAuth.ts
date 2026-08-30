import { prisma } from "./prisma";

const HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  FOUNDER: 100,
  OWNER: 100,
  CO_FOUNDER: 90,
  "CO-FOUNDER": 90,
  ADMIN: 80,
  CEO: 80,
  EXECUTIVE: 80,
  DIRECTOR: 70,
  HR_MANAGER: 60,
  MANAGER: 50,
  TEAM_LEAD: 40,
  SENIOR_STAFF: 30,
  STAFF: 20,
  TRAINEE: 10,
};

export function getRoleLevel(roleName?: string){
  if(!roleName) return 0;
  return HIERARCHY[roleName.toUpperCase()] ?? 20;
}

export function isFounder(user:any){
  const level = getRoleLevel(user?.role?.name);
  return level >= 100;
}

export async function canAccessChannel(user:any, channel:any){
  if(!user || !channel) return false;
  // Founder / Super Admin can access all
  if(isFounder(user)) return true;
  // Archived channels only for members or founder
  if(channel.isArchived){
    const member = await prisma.channelMember.findUnique({ where:{ channelId_userId:{ channelId: channel.id, userId: user.id } }});
    return !!member;
  }
  // Private channels: must be member
  if(channel.isPrivate){
    const member = await prisma.channelMember.findUnique({ where:{ channelId_userId:{ channelId: channel.id, userId: user.id } }});
    return !!member;
  }
  // Department-scoped: check department membership or higher hierarchy (manager+)
  if(channel.departmentId){
    if(user.departmentId === channel.departmentId) return true;
    const userLevel = getRoleLevel(user.role?.name);
    // Managers and above can access department channels if they manage that department
    if(userLevel >= 50){
      // Check if user is manager of that department (managerId)
      const dept = await prisma.department.findUnique({ where:{ id: channel.departmentId }});
      if(dept?.managerId === user.id) return true;
      // CEO/Admin etc. can access all department public channels
      if(userLevel >= 80) return true;
    }
    // For public department channels, check if user is member
    const member = await prisma.channelMember.findUnique({ where:{ channelId_userId:{ channelId: channel.id, userId: user.id } }});
    if(member) return true;
    // Otherwise, public department channels are visible to all in same workspace? For now, allow if channel is not private
    // But to respect hierarchy, we require membership for department private, else allow
    return true; // public department channels visible to all authenticated (can be restricted later)
  }
  // Public, no department: all authenticated users can access
  return true;
}

export async function isChannelMember(userId:string, channelId:string){
  const member = await prisma.channelMember.findUnique({ where:{ channelId_userId:{ channelId, userId } }});
  return !!member;
}

export async function requireChannelAccess(user:any, channelId:string){
  const channel = await prisma.channel.findUnique({ where:{ id: channelId }, include:{ members:true }});
  if(!channel) throw new Error("Channel not found");
  const can = await canAccessChannel(user, channel);
  if(!can) throw new Error("Forbidden: insufficient permissions for channel");
  return channel;
}

export function canPerform(user:any, action:string, channel:any){
  // For now, simple: founder can do all, channel owner/admin can do, members can do basic
  // In future, integrate with Permission model
  if(isFounder(user)) return true;
  const requiredLevel: Record<string, number> = {
    "channel:delete": 80,
    "channel:archive": 60,
    "channel:invite": 40,
    "channel:remove": 50,
    "message:pin": 40,
    "message:delete:any": 50,
  };
  const level = getRoleLevel(user?.role?.name);
  const need = requiredLevel[action] ?? 20;
  return level >= need;
}
