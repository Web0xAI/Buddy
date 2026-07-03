import { useEffect, useRef, useState } from "react";
import { Mood } from "../types";

export interface HeartbeatConfig {
  bpm: number;
  volume: number;
}

export const MOOD_HEARTBEAT_MAP: Record<Mood, HeartbeatConfig> = {
  SLEEPY: { bpm: 48, volume: 0.20 },
  SAD: { bpm: 58, volume: 0.35 },
  IDLE: { bpm: 72, volume: 0.50 },
  THINKING: { bpm: 84, volume: 0.65 },
  SURPRISED: { bpm: 98, volume: 0.80 },
  EXCITED: { bpm: 112, volume: 0.90 },
  ANGRY: { bpm: 125, volume: 1.00 },
};

export function useHeartbeat(mood: Mood) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  
  // Keep live references to active BPM and Volume to avoid rebuilding loops continuously
  const currentMoodRef = useRef<Mood>(mood);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    currentMoodRef.current = mood;
    if (isPlayingRef.current) {
      // Re-trigger the interval dynamically to adapt immediately to the new tempo
      startHeartbeatLoop();
    }
  }, [mood]);

  const initAudio = () => {
    if (audioCtxRef.current) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtxRef.current = new AudioContextClass();
    }
  };

  const playThump = (delay: number, amplitudeMultiplier: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === "suspended") return;

    try {
      const activeMood = currentMoodRef.current;
      const config = MOOD_HEARTBEAT_MAP[activeMood];
      const now = ctx.currentTime + delay;

      // Primary Oscillator: Sub-bass thud
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      
      // Frequency glide for heartbeat "thump"
      osc1.frequency.setValueAtTime(110, now);
      osc1.frequency.exponentialRampToValueAtTime(25, now + 0.16);

      // Elegant amplitude envelope (very fast attack, smooth decay)
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(config.volume * 0.38 * amplitudeMultiplier, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      // Secondary Oscillator: Slightly higher frequency so it's beautifully audible on small/laptop speakers
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      
      osc2.frequency.setValueAtTime(140, now);
      osc2.frequency.exponentialRampToValueAtTime(45, now + 0.14);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(config.volume * 0.08 * amplitudeMultiplier, now + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      // Lowpass filter to make it deeply warm, organic, and non-distracting
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, now);

      // Route nodes
      osc1.connect(gain1);
      osc2.connect(gain2);

      gain1.connect(filter);
      gain2.connect(filter);

      filter.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.18);

      osc2.start(now);
      osc2.stop(now + 0.16);
    } catch (e) {
      console.warn("Heartbeat Audio synthesis warning:", e);
    }
  };

  const startHeartbeatLoop = () => {
    stopHeartbeatLoop();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const playLubDub = () => {
      // First beat "Lub"
      playThump(0, 1.0);
      // Second beat "Dub" (delayed slightly, softer, higher tone)
      playThump(0.14, 0.78);
    };

    // Immediate first thump
    playLubDub();

    const activeMood = currentMoodRef.current;
    const config = MOOD_HEARTBEAT_MAP[activeMood];
    const intervalMs = (60 / config.bpm) * 1000;

    intervalIdRef.current = setInterval(playLubDub, intervalMs);
  };

  const stopHeartbeatLoop = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  const toggleHeartbeat = async () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (isPlaying) {
      stopHeartbeatLoop();
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      isPlayingRef.current = true;
      setIsPlaying(true);
      startHeartbeatLoop();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    isPlaying,
    toggleHeartbeat,
    config: MOOD_HEARTBEAT_MAP[mood]
  };
}
