import { RuntimeMode, NormalActivity, ChuckyActivity } from "../../types";

export type PacketType =
  | "ping"
  | "pong"
  | "hello"
  | "ack"
  | "data"
  | "busy"
  | "end"
  | "error";

export interface GibberTalkPacket {
  v: number;
  type: PacketType;
  sender: string;
  session: string;
  packet: string; // packetId
  ttl: number;
  payload: string;
  replyExpected?: boolean;
}
