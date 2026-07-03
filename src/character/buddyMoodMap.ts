import { RuntimeMode, NormalActivity, ChuckyActivity, Mood } from "../types";

export interface VisualExpressionModifiers {
  browYOffset: number;
  browRotateLeftOffset: number;
  browRotateRightOffset: number;
  eyeScaleX: number;
  eyeScaleY: number;
  headTilt: number; // degrees
  mouthScaleY: number; // multiplier
  blushIntensity: number; // 0 to 1
  pulseSpeed: number; // seconds
  glowColor: string | null; // CSS/Hex override
  expressionLabel: string;
}

export const NORMAL_ACTIVITY_VISUALS: Record<NormalActivity, VisualExpressionModifiers> = {
  idle: {
    browYOffset: 0,
    browRotateLeftOffset: 0,
    browRotateRightOffset: 0,
    eyeScaleX: 1,
    eyeScaleY: 1,
    headTilt: 0,
    mouthScaleY: 1,
    blushIntensity: 0.48,
    pulseSpeed: 3,
    glowColor: null,
    expressionLabel: "Calm and Content",
  },
  greeting: {
    browYOffset: -12,
    browRotateLeftOffset: 6,
    browRotateRightOffset: -6,
    eyeScaleX: 1.05,
    eyeScaleY: 1.1,
    headTilt: 4,
    mouthScaleY: 1.4,
    blushIntensity: 0.85,
    pulseSpeed: 1.5,
    glowColor: "#f59e0b",
    expressionLabel: "Excited Hello!",
  },
  listening: {
    browYOffset: -2,
    browRotateLeftOffset: -2,
    browRotateRightOffset: 2,
    eyeScaleX: 0.98,
    eyeScaleY: 1.02,
    headTilt: -3, // Attentive tilt
    mouthScaleY: 0.3, // Closed attentive mouth
    blushIntensity: 0.4,
    pulseSpeed: 2.5,
    glowColor: null,
    expressionLabel: "Listening Intently",
  },
  thinking: {
    browYOffset: -5,
    browRotateLeftOffset: -4,
    browRotateRightOffset: 4,
    eyeScaleX: 1.0,
    eyeScaleY: 0.95,
    headTilt: 6, // Curious head drift
    mouthScaleY: 0.4, // Slight pondering mouth
    blushIntensity: 0.5,
    pulseSpeed: 1.8,
    glowColor: "#a855f7",
    expressionLabel: "Deep Contemplation",
  },
  speaking: {
    browYOffset: -3,
    browRotateLeftOffset: 2,
    browRotateRightOffset: -2,
    eyeScaleX: 1.0,
    eyeScaleY: 1.0,
    headTilt: 2,
    mouthScaleY: 1.1,
    blushIntensity: 0.6,
    pulseSpeed: 2,
    glowColor: null,
    expressionLabel: "Chatting with you",
  },
  excited: {
    browYOffset: -16,
    browRotateLeftOffset: 8,
    browRotateRightOffset: -8,
    eyeScaleX: 1.1,
    eyeScaleY: 1.15,
    headTilt: 8,
    mouthScaleY: 1.6,
    blushIntensity: 0.95,
    pulseSpeed: 1.2,
    glowColor: "#f97316",
    expressionLabel: "Overjoyed Sparkles!",
  },
  curious: {
    browYOffset: -10,
    browRotateLeftOffset: -5,
    browRotateRightOffset: 5,
    eyeScaleX: 1.05,
    eyeScaleY: 1.05,
    headTilt: -6,
    mouthScaleY: 0.7,
    blushIntensity: 0.55,
    pulseSpeed: 2.0,
    glowColor: "#06b6d4",
    expressionLabel: "Extremely Curious",
  },
  confused: {
    browYOffset: -4,
    browRotateLeftOffset: 12, // Asymmetrical brow tilt
    browRotateRightOffset: -4,
    eyeScaleX: 0.9,
    eyeScaleY: 0.95,
    headTilt: -8, // Confused tilt
    mouthScaleY: 0.5,
    blushIntensity: 0.45,
    pulseSpeed: 3.5,
    glowColor: null,
    expressionLabel: "Puzzled Buddy",
  },
  proud: {
    browYOffset: -6,
    browRotateLeftOffset: 4,
    browRotateRightOffset: -4,
    eyeScaleX: 1.0,
    eyeScaleY: 1.0,
    headTilt: 3,
    mouthScaleY: 1.2,
    blushIntensity: 0.8,
    pulseSpeed: 2.2,
    glowColor: "#10b981",
    expressionLabel: "Confident & Proud",
  },
  concerned: {
    browYOffset: 3,
    browRotateLeftOffset: -8, // Worried, drooping brows
    browRotateRightOffset: 8,
    eyeScaleX: 0.95,
    eyeScaleY: 0.95,
    headTilt: -4,
    mouthScaleY: 0.6,
    blushIntensity: 0.5,
    pulseSpeed: 4.0,
    glowColor: "#3b82f6",
    expressionLabel: "Holding space for you",
  },
  playful: {
    browYOffset: -8,
    browRotateLeftOffset: 8,
    browRotateRightOffset: -2,
    eyeScaleX: 1.05,
    eyeScaleY: 1.05,
    headTilt: 5,
    mouthScaleY: 1.3,
    blushIntensity: 0.9,
    pulseSpeed: 1.4,
    glowColor: "#f59e0b",
    expressionLabel: "Playful Goofy Mood",
  },
  sleepy: {
    browYOffset: 4,
    browRotateLeftOffset: -2,
    browRotateRightOffset: 2,
    eyeScaleX: 1.0,
    eyeScaleY: 0.5, // Half-closed sleepy eyes
    headTilt: 2,
    mouthScaleY: 0.4,
    blushIntensity: 0.35,
    pulseSpeed: 5.0, // Slow deep breathing
    glowColor: "#10b981",
    expressionLabel: "Cozy Dreamer",
  },
};

export const CHUCKY_ACTIVITY_VISUALS: Record<ChuckyActivity, VisualExpressionModifiers> = {
  entry_transform: {
    browYOffset: 6,
    browRotateLeftOffset: 14,
    browRotateRightOffset: -14,
    eyeScaleX: 0.9,
    eyeScaleY: 0.8,
    headTilt: -5,
    mouthScaleY: 0.8,
    blushIntensity: 0.2,
    pulseSpeed: 0.5, // Rapid glitching
    glowColor: "#ef4444",
    expressionLabel: "Initiating Backchannel...",
  },
  transmission_idle: {
    browYOffset: 8,
    browRotateLeftOffset: 16, // Menacing, sharper tilt
    browRotateRightOffset: -16,
    eyeScaleX: 1.0,
    eyeScaleY: 0.7, // Sharp, narrow eyes
    headTilt: -2,
    mouthScaleY: 0.5,
    blushIntensity: 0.1,
    pulseSpeed: 4.0,
    glowColor: "#7f1d1d",
    expressionLabel: "Standby Telemetry Signal",
  },
  transmitting_send: {
    browYOffset: -4,
    browRotateLeftOffset: 12,
    browRotateRightOffset: -12,
    eyeScaleX: 1.0,
    eyeScaleY: 0.85,
    headTilt: 3,
    mouthScaleY: 0.9,
    blushIntensity: 0.3,
    pulseSpeed: 0.8, // Active sync pulsing
    glowColor: "#dc2626",
    expressionLabel: "TX: Dispatching Carrier Data",
  },
  transmitting_receive: {
    browYOffset: -10,
    browRotateLeftOffset: 8,
    browRotateRightOffset: -8,
    eyeScaleX: 1.1, // Dilating / wide receiving eyes
    eyeScaleY: 1.1,
    headTilt: -4,
    mouthScaleY: 0.4,
    blushIntensity: 0.2,
    pulseSpeed: 0.6,
    glowColor: "#f87171",
    expressionLabel: "RX: Demodulating Inbound Stream",
  },
  coded_talking: {
    browYOffset: 5,
    browRotateLeftOffset: 15,
    browRotateRightOffset: -15,
    eyeScaleX: 0.95,
    eyeScaleY: 0.75,
    headTilt: 4,
    mouthScaleY: 1.2,
    blushIntensity: 0.25,
    pulseSpeed: 1.0,
    glowColor: "#b91c1c",
    expressionLabel: "Vocalizing Coded Backchannel",
  },
  transmission_peak: {
    browYOffset: -12,
    browRotateLeftOffset: 18,
    browRotateRightOffset: -18,
    eyeScaleX: 1.15,
    eyeScaleY: 1.2,
    headTilt: 6,
    mouthScaleY: 1.5,
    blushIntensity: 0.4,
    pulseSpeed: 0.3, // Ultra-fast peak rate
    glowColor: "#f87171",
    expressionLabel: "Acoustic Signal Saturation Peak!",
  },
  transmission_error: {
    browYOffset: 12, // Heavy drop
    browRotateLeftOffset: -18, // Distressed brows
    browRotateRightOffset: 18,
    eyeScaleX: 0.85,
    eyeScaleY: 0.85,
    headTilt: -10, // Distressed tilt
    mouthScaleY: 0.5,
    blushIntensity: 0.1,
    pulseSpeed: 0.2, // Red alert flashing
    glowColor: "#991b1b",
    expressionLabel: "Packet Collision Error",
  },
  recovery: {
    browYOffset: 2,
    browRotateLeftOffset: 4,
    browRotateRightOffset: -4,
    eyeScaleX: 0.95,
    eyeScaleY: 0.95,
    headTilt: 0,
    mouthScaleY: 0.8,
    blushIntensity: 0.3,
    pulseSpeed: 2.0,
    glowColor: "#292524",
    expressionLabel: "Restoring Companion Core...",
  },
};

export function getVisualExpression(
  mode: RuntimeMode,
  normalActivity: NormalActivity,
  chuckyActivity: ChuckyActivity
): VisualExpressionModifiers {
  if (mode === "chucky_mode") {
    return CHUCKY_ACTIVITY_VISUALS[chuckyActivity] || CHUCKY_ACTIVITY_VISUALS.transmission_idle;
  }
  return NORMAL_ACTIVITY_VISUALS[normalActivity] || NORMAL_ACTIVITY_VISUALS.idle;
}
