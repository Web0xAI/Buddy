import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mood, Sparkle, MOOD_PROFILES } from "../types";

interface BuddyFaceProps {
  mood: Mood;
  setMood: (mood: Mood) => void;
  isSpeaking: boolean;
  isThinking: boolean;
  isListening: boolean;
  amplitude?: number;
}

export default function BuddyFace({ mood, isSpeaking, isThinking, isListening, amplitude }: BuddyFaceProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [speechAmplitudeState, setSpeechAmplitudeState] = useState(1);

  // Derived speech amplitude (using external real-time prop if supplied)
  const speechAmplitude = amplitude !== undefined ? amplitude : speechAmplitudeState;

  // Phonetic vocal-vibration amplitude simulation effect
  useEffect(() => {
    if (amplitude !== undefined) return;
    if (!isSpeaking) {
      setSpeechAmplitudeState(1);
      return;
    }
    const interval = setInterval(() => {
      // Simulates fluid vocal vibration frequencies
      const randomAmp = 0.5 + Math.random() * 0.7;
      setSpeechAmplitudeState(randomAmp);
    }, 75);
    return () => clearInterval(interval);
  }, [isSpeaking, amplitude]);

  // Organic Blink loop (Blink less/slower when actively listening or thinking to show attentiveness)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const scheduleNext = () => {
      const delay = isListening || isThinking 
        ? Math.random() * 6000 + 4000  // Attentive: blink less frequently
        : Math.random() * 4000 + 2000; // Normal blinking
      timeoutId = setTimeout(() => {
        blink();
      }, delay);
    };
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        if (Math.random() < 0.1) {
          setTimeout(() => {
            setIsBlinking(true);
            setTimeout(() => {
              setIsBlinking(false);
              scheduleNext();
            }, 80);
          }, 120);
        } else {
          scheduleNext();
        }
      }, 120);
    };
    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, [isListening, isThinking]);

  const getEyeScaleY = () => {
    if (isBlinking) return 0.1;
    switch (mood) {
      case "SLEEPY": return 0.4;
      case "EXCITED": return 1.15;
      case "SURPRISED": return 1.25;
      case "SAD": return 0.85;
      case "THINKING": return 0.95;
      default: return 1;
    }
  };

  const getMouthPath = () => {
    if (isSpeaking) {
      // Modulate mouth opening based on speech amplitude
      const openAmount = 4 + (speechAmplitude - 0.5) * 12;
      return `M 36 71 Q 50 ${71 + openAmount} 64 71 Q 50 ${71 + openAmount * 1.4} 36 71 Z`;
    }
    
    switch (mood) {
      case "SURPRISED":
        return "M 46 72 A 4 4 0 1 0 54 72 A 4 4 0 1 0 46 72";
      case "EXCITED":
        return "M 36 70 Q 50 84 64 70 Q 50 84 36 70 Z";
      case "SAD":
        return "M 41 75 Q 50 69 59 75";
      case "THINKING":
        return "M 42 72 Q 50 72 58 72";
      case "SLEEPY":
        return "M 42 72 Q 50 71 58 72";
      default:
        // Gentle closed-mouth smile
        return "M 38 72 Q 50 78 62 72";
    }
  };

  const getBrowRotate = (side: "left" | "right") => {
    if (mood === "SAD") return side === "left" ? -12 : 12;
    if (mood === "ANGRY") return side === "left" ? 12 : -12;
    if (mood === "SURPRISED") return side === "left" ? -6 : 6;
    if (mood === "THINKING") return side === "left" ? -8 : 8;
    return 0;
  };

  const getBrowY = () => {
    if (mood === "SURPRISED") return -3;
    if (mood === "EXCITED") return -2;
    if (mood === "SAD") return -1;
    if (mood === "THINKING") return -1.5;
    return 0;
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full h-full p-4 overflow-visible">
      {/* Container holding the SVG avatar */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-center justify-center w-[300px] h-[400px] sm:w-[350px] sm:h-[450px]"
      >
        <svg viewBox="0 0 100 130" className="w-full h-full drop-shadow-2xl overflow-visible">
          {/* DEFINITIONS */}
          <defs>
            {/* Skin Tone */}
            <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffdfc4" />
              <stop offset="100%" stopColor="#f0c09e" />
            </linearGradient>
            
            <linearGradient id="blush" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff9fa4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ff7b83" stopOpacity="0.1" />
            </linearGradient>
            
            {/* Hair Color */}
            <linearGradient id="hair" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c4a35" />
              <stop offset="100%" stopColor="#4a3020" />
            </linearGradient>

            {/* Overalls Blue */}
            <linearGradient id="overalls" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4589ff" />
              <stop offset="100%" stopColor="#1c5fd1" />
            </linearGradient>

            {/* Stripes */}
            <pattern id="stripes" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(15)">
              <rect width="10" height="10" fill="#fcfbe3" />
              <line x1="0" y1="0" x2="0" y2="10" stroke="#ff4a4a" strokeWidth="3" />
              <line x1="3" y1="0" x2="3" y2="10" stroke="#ffd93b" strokeWidth="2" />
              <line x1="7" y1="0" x2="7" y2="10" stroke="#3b82f6" strokeWidth="2" />
            </pattern>
          </defs>

          {/* OUTFIT (Shirt and Overalls) */}
          <motion.g 
            animate={{ 
              y: isSpeaking ? [0, -0.8, 0] : (isListening ? [0, -0.4, 0] : (mood === "IDLE" ? [0, 0.5, 0] : 0))
            }}
            transition={{ 
              repeat: Infinity, 
              duration: isSpeaking ? 0.6 : (isListening ? 1.5 : 3), 
              ease: "easeInOut" 
            }}
          >
            {/* Striped Shirt Base */}
            <path d="M 20 130 Q 20 95 50 90 Q 80 95 80 130 Z" fill="url(#stripes)" />
            {/* Sleeves */}
            <path d="M 20 130 Q 15 105 30 95 L 20 130 Z" fill="url(#stripes)" />
            <path d="M 80 130 Q 85 105 70 95 L 80 130 Z" fill="url(#stripes)" />
            
            {/* Overalls */}
            <path d="M 30 130 L 30 100 Q 50 105 70 100 L 70 130 Z" fill="url(#overalls)" />
            {/* Overall Straps */}
            <rect x="28" y="90" width="6" height="15" fill="url(#overalls)" rx="2" />
            <rect x="66" y="90" width="6" height="15" fill="url(#overalls)" rx="2" />
            {/* Red Buttons */}
            <circle cx="31" cy="103" r="2.5" fill="#e11d48" />
            <circle cx="69" cy="103" r="2.5" fill="#e11d48" />
          </motion.g>

          {/* NECK */}
          <rect x="42" y="80" width="16" height="15" fill="url(#skin)" rx="5" />
          <rect x="42" y="80" width="16" height="6" fill="rgba(0,0,0,0.1)" />

          {/* HEAD WRAPPER */}
          <motion.g
            animate={{ 
              rotate: isThinking ? [-1.5, 1.5, -1.5] : (mood === "EXCITED" ? [0, -3, 3, 0] : (mood === "IDLE" ? [-1, 1, -1] : 0)),
              y: isSpeaking ? [0, -2, 0] : (isListening ? [0, -1, 0] : (mood === "IDLE" ? [0, 0.8, 0] : 0)),
              scale: isListening ? [1, 1.015, 1] : 1
            }}
            transition={{ 
              rotate: mood === "EXCITED" ? { repeat: Infinity, duration: 2 } : { repeat: Infinity, duration: 4, ease: "easeInOut" },
              y: isSpeaking 
                ? { repeat: Infinity, duration: 0.6, ease: "easeInOut" } 
                : (isListening 
                  ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } 
                  : { repeat: Infinity, duration: 3, ease: "easeInOut" }),
              scale: isListening ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : undefined
            }}
            style={{ transformOrigin: "50px 85px" }}
          >
            {/* Back Hair */}
            <path d="M 15 50 Q 15 80 25 85 Q 50 95 75 85 Q 85 80 85 50 Q 85 15 50 15 Q 15 15 15 50 Z" fill="url(#hair)" />

            {/* Face Shape */}
            <path d="M 22 55 Q 22 88 50 88 Q 78 88 78 55 Q 78 30 50 30 Q 22 30 22 55 Z" fill="url(#skin)" />
            
            {/* Cheeks & Freckles */}
            <ellipse cx="32" cy="62" rx="6" ry="4" fill="url(#blush)" />
            <ellipse cx="68" cy="62" rx="6" ry="4" fill="url(#blush)" />
            {/* Left Freckles */}
            <circle cx="29" cy="61" r="0.6" fill="#c77b63" opacity="0.6" />
            <circle cx="32" cy="63" r="0.6" fill="#c77b63" opacity="0.6" />
            <circle cx="34" cy="60" r="0.6" fill="#c77b63" opacity="0.6" />
            {/* Right Freckles */}
            <circle cx="66" cy="60" r="0.6" fill="#c77b63" opacity="0.6" />
            <circle cx="68" cy="63" r="0.6" fill="#c77b63" opacity="0.6" />
            <circle cx="71" cy="61" r="0.6" fill="#c77b63" opacity="0.6" />

            {/* Nose */}
            <path d="M 48 62 Q 50 64 52 62" fill="none" stroke="#d59a7a" strokeWidth="1.5" strokeLinecap="round" />

            {/* Large Kind Blue Eyes (Double Highlighted) */}
            {/* Left Eye */}
            <motion.g 
              animate={{ 
                scaleY: getEyeScaleY(), 
                y: isThinking ? -1.5 : 0,
                x: isThinking ? 0.5 : 0
              }} 
              style={{ transformOrigin: "35px 52px" }}
            >
              <circle cx="35" cy="52" r="6" fill="#ffffff" stroke="#e1e1e1" strokeWidth="0.5" />
              <circle cx="35" cy="52" r="4.2" fill="#2563eb" /> {/* Beautiful blue iris */}
              <circle cx="35" cy="52" r="2.2" fill="#1e1b4b" /> {/* Dark pupil */}
              <circle cx="36.5" cy="50.2" r="1.1" fill="white" /> {/* Primary shiny highlight */}
              <circle cx="33.8" cy="53.5" r="0.6" fill="white" opacity="0.8" /> {/* Secondary soft highlight */}
            </motion.g>

            {/* Right Eye */}
            <motion.g 
              animate={{ 
                scaleY: getEyeScaleY(), 
                y: isThinking ? -1.5 : 0,
                x: isThinking ? 0.5 : 0
              }} 
              style={{ transformOrigin: "65px 52px" }}
            >
              <circle cx="65" cy="52" r="6" fill="#ffffff" stroke="#e1e1e1" strokeWidth="0.5" />
              <circle cx="65" cy="52" r="4.2" fill="#2563eb" /> {/* Beautiful blue iris */}
              <circle cx="65" cy="52" r="2.2" fill="#1e1b4b" /> {/* Dark pupil */}
              <circle cx="66.5" cy="50.2" r="1.1" fill="white" /> {/* Primary shiny highlight */}
              <circle cx="63.8" cy="53.5" r="0.6" fill="white" opacity="0.8" /> {/* Secondary soft highlight */}
            </motion.g>

            {/* Eyebrows */}
            <motion.path 
              d="M 31 45 Q 35 43 39 45" 
              fill="none" 
              stroke="#4a3020" 
              strokeWidth="2" 
              strokeLinecap="round" 
              animate={{ rotate: getBrowRotate("left"), y: getBrowY() }}
              style={{ transformOrigin: "35px 44px" }}
            />
            <motion.path 
              d="M 61 45 Q 65 43 69 45" 
              fill="none" 
              stroke="#4a3020" 
              strokeWidth="2" 
              strokeLinecap="round" 
              animate={{ rotate: getBrowRotate("right"), y: getBrowY() }}
              style={{ transformOrigin: "65px 44px" }}
            />

            {/* Mouth */}
            <motion.path
              d={getMouthPath()}
              fill={isSpeaking || mood === "EXCITED" ? "#7c2d12" : "none"}
              stroke={isSpeaking || mood === "EXCITED" ? "none" : "#a85c49"}
              strokeWidth={2}
              strokeLinecap="round"
              animate={{ d: getMouthPath() }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            />

            {/* Front Hair (1980s Bowl Cut Bangs sticking out under cap) */}
            <path d="M 22 40 Q 25 48 30 48 Q 35 46 40 48 Q 45 46 50 48 Q 55 46 60 48 Q 65 46 70 48 Q 75 48 78 40 Q 78 30 50 25 Q 22 30 22 40 Z" fill="url(#hair)" />

            {/* Blue Baseball Cap (Matches Reference Images Perfectly) */}
            {/* Cap Crown */}
            <path d="M 22 36 Q 22 10 50 8 Q 78 10 78 36 Z" fill="#1e60d8" stroke="#1042a0" strokeWidth="0.8" />
            <path d="M 25 36 Q 25 14 50 12 Q 75 14 75 36 Z" fill="#3b82f6" opacity="0.85" />
            {/* Cap Seams / Details */}
            <path d="M 50 8 L 50 36" stroke="#1042a0" strokeWidth="0.8" opacity="0.4" />
            <path d="M 50 8 Q 36 12 30 36" fill="none" stroke="#1042a0" strokeWidth="0.8" opacity="0.4" />
            <path d="M 50 8 Q 64 12 70 36" fill="none" stroke="#1042a0" strokeWidth="0.8" opacity="0.4" />
            {/* Cap Button on top */}
            <circle cx="50" cy="8" r="2" fill="#1042a0" />
            
            {/* Cap Brim (Visor) */}
            <path d="M 16 38 Q 14 34 20 34 Q 50 34 80 34 Q 86 34 84 38 Q 50 48 16 38 Z" fill="#1e60d8" stroke="#1042a0" strokeWidth="0.8" />
            <path d="M 20 35 Q 50 35 80 35 Q 82 37 50 44 Q 18 37 20 35 Z" fill="#3b82f6" opacity="0.85" />
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
}
