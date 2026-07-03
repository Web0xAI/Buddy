import { RuntimeMode, NormalActivity, ChuckyActivity, Mood } from "../types";

export interface BuddyCharacterState {
  mode: RuntimeMode;
  normalActivity: NormalActivity;
  chuckyActivity: ChuckyActivity;
  mood: Mood;
}

export const INITIAL_STATE: BuddyCharacterState = {
  mode: "normal_mode",
  normalActivity: "idle",
  chuckyActivity: "transmission_idle",
  mood: "IDLE",
};

export function isChuckyState(mode: RuntimeMode): boolean {
  return mode === "chucky_mode";
}

export function getStatusMessage(state: BuddyCharacterState, userName: string): string {
  if (state.mode === "chucky_mode") {
    switch (state.chuckyActivity) {
      case "entry_transform":
        return "[SYSTEM] Initializing secure telemetry channel...";
      case "transmission_idle":
        return "[CARRIER] Sub-band linked. Awaiting burst transmissions.";
      case "transmitting_send":
        return "[CARRIER] Modulating and dispatching acoustic envelope...";
      case "transmitting_receive":
        return "[CARRIER] Demodulating incoming carrier signal packet...";
      case "coded_talking":
        return "[CARRIER] Synchronized telemetry vocalization active.";
      case "transmission_peak":
        return "[CARRIER] Transmission signal amplitude maximum!";
      case "transmission_error":
        return "[SYSTEM] Acoustic packet collision detected. Retrying...";
      case "recovery":
        return "[SYSTEM] Closing acoustic link, restoring companion node...";
    }
  }

  switch (state.normalActivity) {
    case "greeting":
      return `Hey ${userName}! I'm Buddy! Oh my gosh, I'm so excited to talk to you!`;
    case "listening":
      return `I'm listening closely, ${userName}. Speak to me!`;
    case "thinking":
      return "Reflecting deeply... Let me compile my thoughts!";
    case "speaking":
      return "Sharing my thoughts with you!";
    case "excited":
      return "Whoa, that is so cool! Let's do this!";
    case "curious":
      return "Ooh! Tell me more! I'm super curious!";
    case "confused":
      return "Wait, really? Let me try to understand...";
    case "proud":
      return "Aww, yeah! I'm so proud of that!";
    case "concerned":
      return "I'm right here with you. It's going to be okay.";
    case "playful":
      return "Haha, you are so much fun to talk to!";
    case "sleepy":
      return "Feeling all warm and cozy... so sleepy...";
    case "idle":
    default:
      return "Just resting here, happy to hang out with you!";
  }
}
