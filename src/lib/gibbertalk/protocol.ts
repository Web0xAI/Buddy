import { GibberTalkPacket, PacketType } from "./packetTypes";

export const generateId = (prefix: string = ""): string => {
  return `${prefix}${Math.random().toString(36).substring(2, 9)}`;
};

export const createPacket = (
  sender: string,
  type: PacketType,
  session: string,
  payload: string = "",
  replyExpected: boolean = false
): GibberTalkPacket => {
  return {
    v: 1,
    type,
    sender,
    session,
    packet: generateId("p_"),
    ttl: 3,
    payload,
    replyExpected
  };
};

export interface GibberTalkConfig {
  senderId: string;
  cooldownMs: number;
  sessionTimeoutMs: number;
  maxTurnsPerSession: number;
}

export const DEFAULT_CONFIG: GibberTalkConfig = {
  senderId: `buddy_${generateId("")}`,
  cooldownMs: 3000,
  sessionTimeoutMs: 30000,
  maxTurnsPerSession: 10
};
