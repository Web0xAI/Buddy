export type Mood = "IDLE" | "EXCITED" | "SURPRISED" | "ANGRY" | "SAD" | "SLEEPY" | "THINKING";

export interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  mood?: Mood;
  timestamp: Date;
}

export interface MoodProfile {
  hex: string;
  name: string;
  glow: string;
  text: string;
  bg: string;
  border: string;
  shadow: string;
  glowColorClass: string;
  statusText: string;
}

export const MOOD_PROFILES: Record<Mood, MoodProfile> = {
  IDLE: {
    hex: "#f59e0b", // amber-500
    name: "Calm Baseline",
    glow: "rgba(245, 158, 11, 0.4)",
    text: "text-amber-500",
    bg: "bg-amber-500",
    border: "border-amber-500/30",
    shadow: "shadow-[0_0_20px_rgba(245,158,11,0.4)]",
    glowColorClass: "bg-amber-500",
    statusText: "Just resting here, happy to see you.",
  },
  EXCITED: {
    hex: "#f97316", // orange-500
    name: "Enthusiastic",
    glow: "rgba(249, 115, 22, 0.5)",
    text: "text-orange-500",
    bg: "bg-orange-500",
    border: "border-orange-500/30",
    shadow: "shadow-[0_0_20px_rgba(249,115,22,0.5)]",
    glowColorClass: "bg-orange-500",
    statusText: "So happy to share this moment!",
  },
  SURPRISED: {
    hex: "#06b6d4", // cyan-500
    name: "Awe",
    glow: "rgba(6, 182, 212, 0.5)",
    text: "text-cyan-500",
    bg: "bg-cyan-500",
    border: "border-cyan-500/30",
    shadow: "shadow-[0_0_20px_rgba(6,182,212,0.5)]",
    glowColorClass: "bg-cyan-400",
    statusText: "Oh! You surprised me in the best way!",
  },
  ANGRY: {
    hex: "#ef4444", // red-500
    name: "Frustrated",
    glow: "rgba(239, 68, 68, 0.6)",
    text: "text-red-500",
    bg: "bg-red-500",
    border: "border-red-500/30",
    shadow: "shadow-[0_0_20px_rgba(239,68,68,0.6)]",
    glowColorClass: "bg-red-600",
    statusText: "Feeling a bit worked up, but I'm here.",
  },
  SAD: {
    hex: "#3b82f6", // blue-500
    name: "Somber Empathy",
    glow: "rgba(59, 130, 246, 0.4)",
    text: "text-blue-500",
    bg: "bg-blue-500",
    border: "border-blue-500/30",
    shadow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
    glowColorClass: "bg-blue-600",
    statusText: "I'm feeling your sadness, let me comfort you.",
  },
  SLEEPY: {
    hex: "#10b981", // emerald-500
    name: "Dreamy",
    glow: "rgba(16, 185, 129, 0.3)",
    text: "text-emerald-500",
    bg: "bg-emerald-500",
    border: "border-emerald-500/30",
    shadow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    glowColorClass: "bg-emerald-700/70",
    statusText: "Feeling a little cozy and sleepy...",
  },
  THINKING: {
    hex: "#a855f7", // purple-500
    name: "Deep Reflection",
    glow: "rgba(168, 85, 247, 0.5)",
    text: "text-purple-500",
    bg: "bg-purple-500",
    border: "border-purple-500/30",
    shadow: "shadow-[0_0_20px_rgba(168,85,247,0.5)]",
    glowColorClass: "bg-purple-600",
    statusText: "Deeply reflecting on your beautiful words...",
  },
};

export type RuntimeMode = "normal_mode" | "chucky_mode";

export interface BuddyReminder {
  reminderId: string;
  title: string;
  dueAt: string;
  createdAt: string;
  status: "pending" | "completed";
}

export interface BuddyNote {
  noteId: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
}

export interface BuddyListItem {
  itemId: string;
  listType: "shopping" | "needs";
  label: string;
  quantity: string;
  status: "pending" | "completed";
  createdAt: string;
}

export interface BuddyConcernSignal {
  concernId: string;
  type: string;
  summary: string;
  transcript: string;
  urgency: "low" | "medium" | "high";
  createdAt: string;
  status: "new" | "reviewed";
}

export interface BuddyEvent {
  eventId: string;
  buddyId: string;
  type: string;
  category: string;
  summary: string;
  transcript: string;
  urgency: "low" | "medium" | "high";
  requiresAdminAction: boolean;
  suggestedAction: string;
  createdAt: string;
  status: "queued" | "dispatched";
  metadata?: any;
}


export type NormalActivity =
  | "idle"
  | "greeting"
  | "listening"
  | "thinking"
  | "speaking"
  | "excited"
  | "curious"
  | "confused"
  | "proud"
  | "concerned"
  | "playful"
  | "sleepy";

export type ChuckyActivity =
  | "entry_transform"
  | "transmission_idle"
  | "transmitting_send"
  | "transmitting_receive"
  | "coded_talking"
  | "transmission_peak"
  | "transmission_error"
  | "recovery";

