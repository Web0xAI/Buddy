import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mood, RuntimeMode, NormalActivity, ChuckyActivity } from "../types";
import { getVisualExpression } from "../character/buddyMoodMap";

export interface MoodExpressionConfig {
  scleraRx: number;
  scleraRy: number;
  irisR: number;
  irisYOffset: number;
  pupilR: number;
  browY: number;
  browRotateLeft: number;
  browRotateRight: number;
  
  // Mouth configuration
  mouthLeftX: number;
  mouthRightX: number;
  mouthY: number;
  mouthLowerOffset: number; // offset down for lower lip
  mouthUpperOffset: number; // offset up/down for upper lip
  mouthFill: string;
  mouthStroke: string;
  mouthStrokeWidth: number;
}

export const MOOD_EXPRESSIONS: Record<Mood, MoodExpressionConfig> = {
  IDLE: {
    scleraRx: 61,
    scleraRy: 70,
    irisR: 44,
    irisYOffset: 0,
    pupilR: 23,
    browY: 0,
    browRotateLeft: 0,
    browRotateRight: 0,
    mouthLeftX: 421,
    mouthRightX: 603,
    mouthY: 637,
    mouthLowerOffset: 32, // gentle closed smile
    mouthUpperOffset: 0,
    mouthFill: "none",
    mouthStroke: "#80351F",
    mouthStrokeWidth: 12,
  },
  EXCITED: {
    scleraRx: 65,
    scleraRy: 75,
    irisR: 48,
    irisYOffset: -2,
    pupilR: 25,
    browY: -8,
    browRotateLeft: 5,
    browRotateRight: -5,
    mouthLeftX: 400,
    mouthRightX: 624,
    mouthY: 630,
    mouthLowerOffset: 70, // big open smile
    mouthUpperOffset: -10,
    mouthFill: "#6E1B00",
    mouthStroke: "#80351F",
    mouthStrokeWidth: 6,
  },
  SURPRISED: {
    scleraRx: 74,
    scleraRy: 74, // wide circular eyes
    irisR: 38,    // slightly smaller iris for "shock" effect
    irisYOffset: -4,
    pupilR: 18,
    browY: -16,   // highly raised brows
    browRotateLeft: -8,
    browRotateRight: 8,
    mouthLeftX: 476,
    mouthRightX: 548,
    mouthY: 650,
    mouthLowerOffset: 32, // surprised open circle
    mouthUpperOffset: -32,
    mouthFill: "#6E1B00",
    mouthStroke: "#80351F",
    mouthStrokeWidth: 6,
  },
  ANGRY: {
    scleraRx: 58,
    scleraRy: 65,
    irisR: 40,
    irisYOffset: 2,
    pupilR: 22,
    browY: 10,
    browRotateLeft: 18, // menacing tilted down eyebrows
    browRotateRight: -18,
    mouthLeftX: 430,
    mouthRightX: 594,
    mouthY: 645,
    mouthLowerOffset: 12, // narrow grimace
    mouthUpperOffset: -12,
    mouthFill: "#5E1100",
    mouthStroke: "#2A0A02",
    mouthStrokeWidth: 8,
  },
  SAD: {
    scleraRx: 60,
    scleraRy: 62,
    irisR: 42,
    irisYOffset: 4, // looking slightly down/sad
    pupilR: 21,
    browY: -3,
    browRotateLeft: -12, // outer brows droop
    browRotateRight: 12,
    mouthLeftX: 430,
    mouthRightX: 594,
    mouthY: 660,
    mouthLowerOffset: -5,  // sad frown
    mouthUpperOffset: -25,
    mouthFill: "none",
    mouthStroke: "#80351F",
    mouthStrokeWidth: 12,
  },
  SLEEPY: {
    scleraRx: 61,
    scleraRy: 30, // half-closed sleepy eyes
    irisR: 44,
    irisYOffset: 8,
    pupilR: 20,
    browY: 2,
    browRotateLeft: -2,
    browRotateRight: 2,
    mouthLeftX: 440,
    mouthRightX: 584,
    mouthY: 642,
    mouthLowerOffset: 6, // quiet flat line mouth
    mouthUpperOffset: -2,
    mouthFill: "none",
    mouthStroke: "#80351F",
    mouthStrokeWidth: 10,
  },
  THINKING: {
    scleraRx: 61,
    scleraRy: 66,
    irisR: 44,
    irisYOffset: -6, // looking up and to the side
    pupilR: 22,
    browY: -4,
    browRotateLeft: -4,
    browRotateRight: 4,
    mouthLeftX: 435,
    mouthRightX: 589,
    mouthY: 640,
    mouthLowerOffset: 4, // thoughtful smirk/straight line
    mouthUpperOffset: -4,
    mouthFill: "none",
    mouthStroke: "#80351F",
    mouthStrokeWidth: 10,
  }
};

export const getScleraPath = (cx: number, cy: number, rx: number, ry: number) => {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
};

export const getSparklePath = (cx: number, cy: number, r: number) => {
  return `M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z`;
};

interface BuddyAvatarProps {
  runtimeMode: RuntimeMode;
  normalActivity: NormalActivity;
  chuckyActivity: ChuckyActivity;
  mood: Mood;
  isSpeaking: boolean;
  listeningState: boolean;
  audioLevel?: number; // fallback amplitude for mouth movement
  gibbertalkActive?: boolean;
  spokenText?: string;
  subtitleText?: string;
}

export default function BuddyAvatar({
  runtimeMode,
  normalActivity,
  chuckyActivity,
  mood,
  isSpeaking,
  listeningState,
  audioLevel = 0,
  gibbertalkActive = false,
  spokenText = "",
  subtitleText = "",
}: BuddyAvatarProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [wiggle, setWiggle] = useState(0);
  const [thinkingVariation, setThinkingVariation] = useState({
    headTilt: 0,
    eyebrowShiftX: 0,
    eyebrowShiftY: 0,
    eyeLookX: 0,
    eyeLookY: 0,
  });

  // Organic blink loop
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const scheduleNext = () => {
      const isAttentive = listeningState || mood === "THINKING" || runtimeMode === "chucky_mode";
      const delay = isAttentive
        ? Math.random() * 8000 + 5000 // Attentive: blink less frequently
        : Math.random() * 4000 + 2000; // Normal blinking

      timeoutId = setTimeout(() => {
        blink();
      }, delay);
    };

    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        // Chance of double-blink
        if (Math.random() < 0.15) {
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
      }, 100);
    };

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, [listeningState, mood, runtimeMode]);

  // Subtle glitch/shiver effect for Chucky Mode
  useEffect(() => {
    if (runtimeMode !== "chucky_mode") {
      setWiggle(0);
      return;
    }

    const interval = setInterval(() => {
      // Jitter during transmissions
      const intensity = chuckyActivity === "coded_talking" || chuckyActivity === "transmission_peak" ? 3.5 : 0.9;
      setWiggle((Math.random() - 0.5) * intensity);
    }, 100);

    return () => clearInterval(interval);
  }, [runtimeMode, chuckyActivity]);

  // Periodic micro-movements for the thinking state
  useEffect(() => {
    if (mood !== "THINKING") {
      setThinkingVariation({
        headTilt: 0,
        eyebrowShiftX: 0,
        eyebrowShiftY: 0,
        eyeLookX: 0,
        eyeLookY: 0,
      });
      return;
    }

    // Possible thoughtful gaze directions/zones for Buddy to drift into
    const zones = [
      { x: -14, y: -11, label: "up-left" },
      { x: 14, y: -11, label: "up-right" },
      { x: -10, y: 8, label: "down-left" },
      { x: 10, y: 8, label: "down-right" },
      { x: -16, y: -2, label: "far-left" },
      { x: 16, y: -2, label: "far-right" }
    ];

    let currentZone = zones[0]; // Start looking up-left
    let headTiltTarget = -4.5; // Start with a leftward thoughtful tilt

    // Dynamic timeout IDs to manage independent timescales of micro-movements vs gaze shifts
    let jitterTimeoutId: NodeJS.Timeout;
    let zoneShiftTimeoutId: NodeJS.Timeout;

    const performMicroDart = () => {
      // Small micro-movements/saccades around the current focal zone to simulate visual processing
      const jitterX = (Math.random() * 3.5 - 1.75);
      const jitterY = (Math.random() * 2.5 - 1.25);

      // Micro head-sway around the current tilt angle
      const randomTilt = headTiltTarget + (Math.random() * 1.5 - 0.75);

      // Eyebrows furrow inward and twitch slightly as if processing ideas
      const baseEyebrowShiftX = 8.0;
      const randomBrowShiftX = baseEyebrowShiftX + (Math.random() * 2.2 - 1.1);
      const randomBrowShiftY = -1.5 + (Math.random() * 2.2 - 1.1);

      setThinkingVariation({
        headTilt: randomTilt,
        eyebrowShiftX: randomBrowShiftX,
        eyebrowShiftY: randomBrowShiftY,
        eyeLookX: currentZone.x + jitterX,
        eyeLookY: currentZone.y + jitterY,
      });

      // Schedule next micro-dart with an organic, randomized delay (200ms - 600ms)
      const nextDelay = Math.random() * 400 + 200;
      jitterTimeoutId = setTimeout(performMicroDart, nextDelay);
    };

    const shiftGazeZone = () => {
      // Shift Buddy's general gaze to a different thinking quadrant
      const availableZones = zones.filter(z => z !== currentZone);
      currentZone = availableZones[Math.floor(Math.random() * availableZones.length)];

      // When the gaze shifts, also alternate the overall head tilt to match the mood shift
      headTiltTarget = Math.random() < 0.5 ? -4.5 : 3.0;

      // Schedule next major gaze zone drift (every 1.5 to 3.5 seconds)
      const nextShiftDelay = Math.random() * 2000 + 1500;
      zoneShiftTimeoutId = setTimeout(shiftGazeZone, nextShiftDelay);
    };

    // Kick off both loops
    performMicroDart();
    shiftGazeZone();

    return () => {
      clearTimeout(jitterTimeoutId);
      clearTimeout(zoneShiftTimeoutId);
    };
  }, [mood]);

  const isChucky = runtimeMode === "chucky_mode";

  // Resolve visual modifiers from the reusable Buddy Character Runtime mapping matrix
  const visualExpression = getVisualExpression(runtimeMode, normalActivity, chuckyActivity);

  // Base configuration based on active mood
  const baseConfig = MOOD_EXPRESSIONS[mood] || MOOD_EXPRESSIONS.IDLE;

  // Dynamic excitement/intensity level calculation from real-time text analysis
  let intensityTier = 0; // 0 = baseline, 1 = happy, 2 = excited
  
  const cleanText = (subtitleText || spokenText || "").toLowerCase();

  // Helper to match precise whole-word boundaries to avoid false substring activations
  const hasWord = (...words: string[]) => {
    return words.some(word => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      return regex.test(cleanText);
    });
  };
  
  // Define our 26+ rich, emoji-like dynamic emotional affects / concepts
  const affectLove = isSpeaking && !isChucky && hasWord("love", "heart", "hearts", "adore");
  const affectExcited = isSpeaking && !isChucky && hasWord(
    "excited", "exciting", "hype", "hyped", "pumped", "stoked", "thrilled", 
    "enthusiastic", "overjoyed", "stoked", "pumped", "can't wait", "cant wait", 
    "unreal", "so ready", "super happy", "yahoo", "yippee", "hurray", "yay"
  );
  const affectGenius = isSpeaking && !isChucky && hasWord("idea", "genius", "brain", "smart", "clever", "thought", "knowledge", "expert", "mastermind", "brilliant", "eureka");
  const affectGaming = isSpeaking && !isChucky && hasWord("game", "gaming", "play", "arcade", "console", "nintendo", "xbox", "playstation", "gamer", "video game");
  const affectDog = isSpeaking && !isChucky && hasWord("dog", "puppy", "bark", "pup", "woof", "canine", "retriever", "doggy");
  const affectSpace = isSpeaking && !isChucky && hasWord("space", "alien", "ufo", "galaxy", "rocket", "moon", "star", "mars", "universe", "comet", "orbit", "astronaut");
  const affectDetective = isSpeaking && !isChucky && hasWord("explore", "adventure", "detective", "search", "clue", "mystery", "find", "discover", "map", "quest", "spy", "inspector");
  const affectFire = isSpeaking && !isChucky && hasWord("fire", "lit", "burning", "hot", "blaze", "spicy", "chili", "pepper", "superhot");
  const affectSilly = isSpeaking && !isChucky && hasWord("silly", "goofy", "crazy", "weird", "funny", "joke", "prank", "goof", "wacky");
  const affectGrateful = isSpeaking && !isChucky && hasWord("thanks", "thank you", "grateful", "appreciate", "blessed", "kindness", "sweetheart", "thoughtful");
  const affectTime = isSpeaking && !isChucky && hasWord("time", "clock", "future", "tomorrow", "calendar", "tick", "tock", "hour", "minute");
  const affectSpooky = isSpeaking && !isChucky && hasWord("ghost", "spooky", "scary", "halloween", "haunted", "vampire", "creepy", "skeleton", "ghoul", "monster");
  const affectBooks = isSpeaking && !isChucky && hasWord("book", "school", "learn", "study", "homework", "math", "reading", "class", "science", "teacher", "history");

  const affectSparkle = isSpeaking && !isChucky && hasWord("sparkle", "sparkling", "magic", "crystals", "mystical");
  const affectSparklingJoy = isSpeaking && !isChucky && hasWord("wow", "amazing", "sparkle", "wonder", "wonderful", "gorgeous", "awesome", "incredible", "magical");
  const affectLaugh = isSpeaking && !isChucky && hasWord("haha", "hahaha", "lol", "hilarious", "giggle");
  const affectCry = isSpeaking && !isChucky && hasWord("crying", "sob", "weep");
  const affectAngry = isSpeaking && !isChucky && hasWord("angry", "furious", "rage");
  const affectWink = isSpeaking && !isChucky && hasWord("wink", "winking");
  const affectSweat = isSpeaking && !isChucky && hasWord("nervous", "anxious", "sweat");
  const affectMindBlown = isSpeaking && !isChucky && hasWord("mindblown", "mind-blown", "eureka");
  const affectCool = isSpeaking && !isChucky && hasWord("sunglasses", "shades");
  const affectSleep = isSpeaking && !isChucky && hasWord("sleepy", "zzz", "yawn", "snore");
  const affectSuccess = isSpeaking && !isChucky && hasWord("victory", "trophy", "champion");
  const affectShock = isSpeaking && !isChucky && hasWord("shocked", "horrified");
  const affectSweetYum = isSpeaking && !isChucky && hasWord("yummy", "delicious");
  const affectParty = isSpeaking && !isChucky && hasWord("party", "confetti", "balloon");
  const affectMoney = isSpeaking && !isChucky && hasWord("money", "rich", "cash", "dollar");
  const affectFlower = isSpeaking && !isChucky && hasWord("flower", "flowers", "rose", "tulip");
  const affectDanger = isSpeaking && !isChucky && hasWord("danger", "hazardous", "toxic");
  const affectCat = isSpeaking && !isChucky && hasWord("meow", "kitten", "kitty");
  const affectDevil = isSpeaking && !isChucky && hasWord("devil", "demon");
  const affectAngel = isSpeaking && !isChucky && hasWord("angel", "halo");
  const affectMusic = isSpeaking && !isChucky && hasWord("music", "sing", "dance", "song");
  const affectWater = isSpeaking && !isChucky && hasWord("splash", "swim", "ocean");
  const affectHeadphones = isSpeaking && !isChucky && hasWord("headphones");
  const affectWinter = isSpeaking && !isChucky && hasWord("winter", "snow", "freeze", "glacier");
  const affectShark = isSpeaking && !isChucky && hasWord("shark");
  const affectLucky = isSpeaking && !isChucky && hasWord("clover", "irish", "pot-of-gold");

  const isExcitedText = (intensityTier >= 1.5 && isSpeaking) || affectSparkle || affectSuccess || affectExcited || affectSparklingJoy;
  const isLoveText = affectLove;
  const isIntellectText = affectMindBlown || affectGenius;

  if (isSpeaking) {
    if (affectSparkle || affectSuccess || affectExcited || affectSparklingJoy || mood === "EXCITED" || mood === "SURPRISED") {
      intensityTier = 2; // Excited!
    } else if (affectLove || affectMindBlown || affectGenius || mood === "THINKING") {
      intensityTier = 1.2; // Happy / Engaged
    } else {
      intensityTier = 0.6; // Slightly happy when talking by default
    }
  } else {
    // Idle state values
    if (mood === "EXCITED" || mood === "SURPRISED") {
      intensityTier = 1.5;
    } else if (mood === "THINKING") {
      intensityTier = 0.8;
    } else if (mood === "SAD" || mood === "ANGRY" || mood === "SLEEPY") {
      intensityTier = 0;
    } else {
      intensityTier = 0;
    }
  }

  const lastWordMatch = (subtitleText || "").trim().match(/(\w+)[^\w]*$/);
  const currentWord = lastWordMatch ? lastWordMatch[1].toLowerCase() : "";
  const isOoohMouth = isSpeaking && (currentWord.startsWith("ooo") || currentWord === "wow" || currentWord === "oh" || currentWord === "whoa" || currentWord === "woah");

  // Derive dynamic configuration based on active emotional intensity combined with visual runtime modifiers
  const config = {
    ...baseConfig,
    // Lift eyebrows extra high when excited/surprised, modified by character runtime
    browY: (isExcitedText ? -16 : (intensityTier >= 0.8 ? -9 : baseConfig.browY)) + visualExpression.browYOffset,
    // Rotate eyebrows dynamically based on excitement, modified by character runtime
    browRotateLeft: (isExcitedText ? 8 : baseConfig.browRotateLeft) + visualExpression.browRotateLeftOffset,
    browRotateRight: (isExcitedText ? -8 : baseConfig.browRotateRight) + visualExpression.browRotateRightOffset,
    // Dilate iris/pupil slightly when happy/excited, scaled by character runtime
    irisR: Math.round((isExcitedText ? baseConfig.irisR + 4 : (intensityTier >= 0.8 ? baseConfig.irisR + 2 : baseConfig.irisR)) * visualExpression.eyeScaleX),
    pupilR: Math.round((isExcitedText ? baseConfig.pupilR + 3 : (intensityTier >= 0.8 ? baseConfig.pupilR + 1 : baseConfig.pupilR)) * visualExpression.eyeScaleY),
  };

  // Blushing cheeks size and opacity, incorporating character runtime's blush intensity
  const blushRadius = isExcitedText ? 72 : (isLoveText ? 66 : (intensityTier >= 0.8 ? 60 : 52));
  const blushOpacity = (isExcitedText ? 0.95 : (isLoveText ? 0.85 : (intensityTier >= 0.8 ? 0.7 : 0.48))) * visualExpression.blushIntensity;

  // Blink logic for scaleY of eye container, modified by character runtime's eye scale
  const getLeftEyeScaleY = () => {
    if (isBlinking) return 0.05;
    if (affectWink || affectLaugh || affectCry || affectSleep) return 1.0;
    if (isChucky) return 1.05;
    return visualExpression.eyeScaleY;
  };

  const getRightEyeScaleY = () => {
    if (isBlinking) return 0.05;
    if (affectLaugh || affectCry || affectSleep) return 1.0;
    if (isChucky) return 1.05;
    return visualExpression.eyeScaleY;
  };

  // Dedicated mouth calculations for normal and speaking modes
  const amplitudeFactor = audioLevel > 0 ? audioLevel : (isSpeaking ? 0.6 : 0);

  // Dynamic calculations for normal mode mouth shape
  const startX = config.mouthLeftX;
  const endX = config.mouthRightX;
  const baseY = config.mouthY;

  let lowerOffset = config.mouthLowerOffset;
  let upperOffset = config.mouthUpperOffset;

  if (amplitudeFactor > 0.05) {
    const openSpread = amplitudeFactor * 55;
    // Morph smoothly from the mood's offset to a vocalized open state
    lowerOffset = Math.max(lowerOffset, 25 + openSpread);
    upperOffset = Math.min(upperOffset, -5 - openSpread * 0.4);
  }

  // Multiply mouth sizing dynamically using mouthScaleY from character runtime
  const lowerY = baseY + (lowerOffset * visualExpression.mouthScaleY);
  const upperY = baseY + (upperOffset * visualExpression.mouthScaleY);
  const mouthPath = `M ${startX} ${baseY} Q 512 ${lowerY} ${endX} ${baseY} Q 512 ${upperY} ${startX} ${baseY} Z`;

  // Retain custom legacy getMouthPath solely for Chucky Mode's specific animations
  const getMouthPath = () => {
    if (!isChucky) {
      if (affectCat) {
        // Double curve feline "3" mouth
        return "M 445 640 Q 478 665 512 645 Q 546 665 579 640";
      }
      if (isOoohMouth) {
        // Perfect rounded vocalized oval shape for "Oooh!" / "Wow!" / "Oh!"
        const oX1 = 455;
        const oX2 = 569;
        const oLower = baseY + 62 + amplitudeFactor * 24;
        const oUpper = baseY - 48 - amplitudeFactor * 14;
        return `M ${oX1} ${baseY} Q 512 ${oLower} ${oX2} ${baseY} Q 512 ${oUpper} ${oX1} ${baseY} Z`;
      }
      return mouthPath;
    }

    if (amplitudeFactor > 0.1) {
      const heightMultiplier = 20 + amplitudeFactor * 45;
      return `M 396 640 Q 550 ${640 + heightMultiplier} 628 610 Q 512 ${650 + heightMultiplier * 1.2} 396 640 Z`;
    }
    
    switch (chuckyActivity) {
      case "transmission_peak":
      case "coded_talking":
        return "M 396 640 C 465 720 568 690 628 600 C 580 620 500 620 396 640 Z";
      case "transmission_error":
        return "M 410 650 Q 512 610 614 650"; // Creepy straight line
      default:
        return "M 396 640 C 465 704 568 682 628 606 C 580 640 512 660 452 654 Z";
    }
  };

  // Define our consistent premium color gradients per mood to ensure Buddy's physical features
  // (skin tone, hat, eyes, overalls) remain stable and professional, avoiding weird color-shifts
  // (such as turning green when thinking or purple when sleepy) while still allowing blush to respond.
  const moodGradients: Record<Mood, {
    skin0: string; skin50: string; skin100: string;
    cap0: string; cap45: string; cap100: string;
    brim0: string; brim100: string;
    eye0: string; eye40: string; eye100: string;
    overall0: string; overall100: string;
    blush: string;
  }> = {
    IDLE: {
      skin0: "#FFF2E6", skin50: "#FFD1A9", skin100: "#EDA16B",
      cap0: "#75D1FF", cap45: "#1C8DEC", cap100: "#0B56A1",
      brim0: "#1E9CFF", brim100: "#085BA6",
      eye0: "#B3F0FF", eye40: "#1E96FC", eye100: "#053F9E",
      overall0: "#FF4A4F", overall100: "#C2131C",
      blush: "#FF7076"
    },
    EXCITED: {
      skin0: "#FFF2E6", skin50: "#FFD1A9", skin100: "#EDA16B",
      cap0: "#75D1FF", cap45: "#1C8DEC", cap100: "#0B56A1",
      brim0: "#1E9CFF", brim100: "#085BA6",
      eye0: "#B3F0FF", eye40: "#1E96FC", eye100: "#053F9E",
      overall0: "#FF4A4F", overall100: "#C2131C",
      blush: "#FF3F80" // Slightly brighter pink blush for excitement
    },
    SAD: {
      skin0: "#FFF2E6", skin50: "#FFD1A9", skin100: "#EDA16B",
      cap0: "#75D1FF", cap45: "#1C8DEC", cap100: "#0B56A1",
      brim0: "#1E9CFF", brim100: "#085BA6",
      eye0: "#B3F0FF", eye40: "#1E96FC", eye100: "#053F9E",
      overall0: "#FF4A4F", overall100: "#C2131C",
      blush: "#E2935C" // Muted blush for sadness
    },
    SURPRISED: {
      skin0: "#FFF2E6", skin50: "#FFD1A9", skin100: "#EDA16B",
      cap0: "#75D1FF", cap45: "#1C8DEC", cap100: "#0B56A1",
      brim0: "#1E9CFF", brim100: "#085BA6",
      eye0: "#B3F0FF", eye40: "#1E96FC", eye100: "#053F9E",
      overall0: "#FF4A4F", overall100: "#C2131C",
      blush: "#FDA4AF" // Light rose blush
    },
    ANGRY: {
      skin0: "#FFF2E6", skin50: "#FFD1A9", skin100: "#EDA16B",
      cap0: "#75D1FF", cap45: "#1C8DEC", cap100: "#0B56A1",
      brim0: "#1E9CFF", brim100: "#085BA6",
      eye0: "#B3F0FF", eye40: "#1E96FC", eye100: "#053F9E",
      overall0: "#FF4A4F", overall100: "#C2131C",
      blush: "#FF4A4F" // Flushed red blush
    },
    SLEEPY: {
      skin0: "#FFF2E6", skin50: "#FFD1A9", skin100: "#EDA16B",
      cap0: "#75D1FF", cap45: "#1C8DEC", cap100: "#0B56A1",
      brim0: "#1E9CFF", brim100: "#085BA6",
      eye0: "#B3F0FF", eye40: "#1E96FC", eye100: "#053F9E",
      overall0: "#FF4A4F", overall100: "#C2131C",
      blush: "#EC4899" // Soft magenta/pink blush
    },
    THINKING: {
      skin0: "#FFF2E6", skin50: "#FFD1A9", skin100: "#EDA16B",
      cap0: "#75D1FF", cap45: "#1C8DEC", cap100: "#0B56A1",
      brim0: "#1E9CFF", brim100: "#085BA6",
      eye0: "#B3F0FF", eye40: "#1E96FC", eye100: "#053F9E",
      overall0: "#FF4A4F", overall100: "#C2131C",
      blush: "#FFAC75" // Soft orange/peach blush for contemplative warming
    }
  };

  const activeGrads = moodGradients[mood] || moodGradients.IDLE;

  const getActiveEmoticon = () => {
    if (affectLove) return "💖";
    if (affectSparklingJoy) return "🌟";
    if (affectExcited) return "🤩";
    if (affectGenius) return "💡";
    if (affectGaming) return "🎮";
    if (affectDog) return "🐶";
    if (affectSpace) return "🚀";
    if (affectDetective) return "🔍";
    if (affectFire) return "🔥";
    if (affectSilly) return "🤪";
    if (affectGrateful) return "🙏";
    if (affectTime) return "⏰";
    if (affectSpooky) return "👻";
    if (affectBooks) return "📚";
    if (affectSparkle) return "✨";
    if (affectLaugh) return "😂";
    if (affectCry) return "😭";
    if (affectAngry) return "💢";
    if (affectSweat) return "💦";
    if (affectMindBlown) return "💥";
    if (affectCool) return "😎";
    if (affectSleep) return "💤";
    if (affectSuccess) return "🎉";
    if (affectShock) return "⚡";
    if (affectSweetYum) return "😋";
    if (affectParty) return "🎈";
    if (affectMoney) return "🪙";
    if (affectFlower) return "🌸";
    if (affectDanger) return "🔥";
    if (affectCat) return "🐾";
    if (affectDevil) return "😈";
    if (affectAngel) return "👼";
    if (affectMusic) return "🎵";
    if (affectWater) return "🌊";
    if (affectHeadphones) return "🎧";
    if (affectWinter) return "❄️";
    if (affectShark) return "🦈";
    if (affectLucky) return "🍀";
    if (isExcitedText || isIntellectText) return "✨";
    if (isLoveText) return "❤️";
    return null;
  };

  const renderEyeContent = (cx: number, cy: number, isLeft: boolean) => {
    if (isChucky) {
      return (
        <>
          <motion.circle
            cx={cx}
            cy={cy}
            r="34"
            fill="url(#eyeGradEvil)"
            animate={{
              x: mood === "THINKING" ? thinkingVariation.eyeLookX : 0,
              y: mood === "THINKING" ? thinkingVariation.eyeLookY : 0,
            }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          />
          <motion.circle
            cx={cx}
            cy={cy - 6}
            r="13"
            fill="#1C0002"
            animate={{
              x: mood === "THINKING" ? thinkingVariation.eyeLookX * 1.15 : 0,
              y: mood === "THINKING" ? thinkingVariation.eyeLookY * 1.15 : 0,
            }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          />
          <circle cx={cx} cy={cy} r="4" fill="#FFFFFF" />
        </>
      );
    }

    const irisR = config.irisR;
    const pupilR = config.pupilR;
    const irisY = cy + config.irisYOffset;

    if (affectLove) {
      return (
        <>
          <motion.path
            d={`M ${cx} ${cy - 12} 
                C ${cx - 24} ${cy - 36}, ${cx - 40} ${cy - 12}, ${cx - 40} ${cy + 12} 
                C ${cx - 40} ${cy + 28}, ${cx - 16} ${cy + 40}, ${cx} ${cy + 52} 
                C ${cx + 16} ${cy + 40}, ${cx + 40} ${cy + 28}, ${cx + 40} ${cy + 12} 
                C ${cx + 40} ${cy - 12}, ${cx + 24} ${cy - 36}, ${cx} ${cy - 12} Z`}
            fill="#FF2E93"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <circle cx={cx} cy={cy + 8} r="10" fill="#FFFFFF" opacity="0.9" />
          <circle cx={cx - 8} cy={cy - 4} r="8" fill="#FFFFFF" opacity="0.9" />
        </>
      );
    }

    if (affectSparklingJoy) {
      return (
        <>
          {/* Natural iris base */}
          <circle cx={cx} cy={cy} r={irisR} fill="url(#eyeGrad)" />
          
          {/* Bouncing pupil */}
          <motion.circle
            cx={cx}
            cy={cy - 12}
            r={pupilR}
            fill="#05226E"
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />

           {/* Epic Sparkle Highlight 1 (twinkling primary glint) */}
          <motion.path
            d={getSparklePath(cx - 8, cy - 18, 6)}
            fill="#FFFFFF"
            animate={{ rotate: 360, scale: [0.95, 1.25, 0.95] }}
            transition={{ 
              rotate: { repeat: Infinity, duration: 6, ease: "linear" },
              scale: { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
            }}
            style={{ transformOrigin: `${cx - 8}px ${cy - 18}px` }}
          />

          {/* Epic Sparkle Highlight 2 (soft golden companion sparkle) */}
          <motion.path
            d={getSparklePath(cx + 8, cy - 4, 4)}
            fill="#FFF59D"
            animate={{ rotate: -180, scale: [0.8, 1.2, 0.8] }}
            transition={{ 
              rotate: { repeat: Infinity, duration: 5, ease: "linear" },
              scale: { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
            }}
            style={{ transformOrigin: `${cx + 8}px ${cy - 4}px` }}
          />

          {/* Dynamic soft light reflection dot */}
          <circle cx={cx - 10} cy={cy - 2} r="3" fill="#FFFFFF" opacity="0.6" />
        </>
      );
    }

    if (affectSparkle) {
      return (
        <>
          <motion.path
            d={`M ${cx} ${cy - 38} Q ${cx} ${cy} ${cx + 38} ${cy} Q ${cx} ${cy} ${cx} ${cy + 38} Q ${cx} ${cy} ${cx - 38} ${cy} Q ${cx} ${cy} ${cx} ${cy - 38} Z`}
            fill="#FFD700"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <motion.path
            d={`M ${cx} ${cy - 18} Q ${cx} ${cy} ${cx + 18} ${cy} Q ${cx} ${cy} ${cx} ${cy + 18} Q ${cx} ${cy} ${cx - 18} ${cy} Q ${cx} ${cy} ${cx} ${cy - 18} Z`}
            fill="#FFFFFF"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        </>
      );
    }

    if (affectSuccess) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#FFB900" />
          <motion.path
            d={`M ${cx} ${cy - 22} L ${cx + 6} ${cy - 8} L ${cx + 20} ${cy - 8} L ${cx + 10} ${cy + 2} L ${cx + 14} ${cy + 16} L ${cx} ${cy + 8} L ${cx - 14} ${cy + 16} L ${cx - 10} ${cy + 2} L ${cx - 20} ${cy - 8} L ${cx - 6} ${cy - 8} Z`}
            fill="#FFFFFF"
            animate={{ scale: [1, 1.25, 1], rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        </>
      );
    }

    if (affectMindBlown) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#4B0082" />
          <motion.path
            d={`M ${cx} ${cy} 
                C ${cx + 20} ${cy - 20}, ${cx + 20} ${cy + 20}, ${cx} ${cy + 30}
                C ${cx - 20} ${cy + 30}, ${cx - 30} ${cy}, ${cx} ${cy - 25}
                C ${cx + 25} ${cy - 25}, ${cx + 10} ${cy + 10}, ${cx - 5} ${cy + 5}`}
            fill="none"
            stroke="#00FFFF"
            strokeWidth="4"
            strokeLinecap="round"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <circle cx={cx} cy={cy} r="6" fill="#FFFFFF" />
        </>
      );
    }

    if (affectSweat) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="url(#eyeGrad)" />
          <motion.circle
            cx={cx}
            cy={cy + 4}
            r="12"
            fill="#05226E"
            animate={{
              x: [-16, 16, -16, 0, 12, -12, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "easeInOut",
            }}
          />
          <circle cx={cx - 10} cy={cy - 10} r="5" fill="#FFFFFF" />
        </>
      );
    }

    if (affectAngry) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#DC2626" />
          <motion.path
            d={`M ${cx - 15} ${cy + 15} Q ${cx} ${cy - 30} ${cx + 15} ${cy + 15} Z`}
            fill="#F59E0B"
            animate={{ scaleY: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            style={{ transformOrigin: `${cx}px ${cy + 15}px` }}
          />
          <ellipse cx={cx} cy={cy + 5} rx="8" ry="12" fill="#000000" />
        </>
      );
    }

    if (affectMoney) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#F59E0B" opacity="0.3" />
          <circle cx={cx} cy={cy} r={irisR - 4} fill="none" stroke="#10B981" strokeWidth="3" />
          <motion.text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            fill="#047857"
            fontSize="36"
            fontWeight="900"
            fontFamily="monospace"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            $
          </motion.text>
        </>
      );
    }

    if (affectLucky) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#10B981" opacity="0.2" />
          <motion.g
            animate={{ rotate: [0, 45, 0], scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            <circle cx={cx} cy={cy - 12} r="10" fill="#047857" />
            <circle cx={cx} cy={cy + 12} r="10" fill="#047857" />
            <circle cx={cx - 12} cy={cy} r="10" fill="#047857" />
            <circle cx={cx + 12} cy={cy} r="10" fill="#047857" />
            <path d={`M ${cx} ${cy} Q ${cx + 8} ${cy + 18} ${cx + 12} ${cy + 22}`} stroke="#047857" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="5" fill="#FFFFFF" />
          </motion.g>
        </>
      );
    }

    if (affectMusic) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#EC4899" opacity="0.25" />
          <motion.g
            animate={{
              y: [0, -6, 0],
              rotate: [-15, 15, -15],
            }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            <path d={`M ${cx - 6} ${cy + 10} L ${cx - 6} ${cy - 16} L ${cx + 12} ${cy - 10} L ${cx + 12} ${cy + 10}`} fill="none" stroke="#EC4899" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={cx - 10} cy={cy + 10} r="7" fill="#EC4899" />
            <circle cx={cx + 8} cy={cy + 10} r="7" fill="#EC4899" />
          </motion.g>
        </>
      );
    }

    if (affectCat) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#10B981" />
          <ellipse cx={cx} cy={cy} rx="16" ry="16" fill="#059669" opacity="0.6" />
          <motion.ellipse
            cx={cx}
            cy={cy}
            rx="4"
            ry="24"
            fill="#111827"
            animate={{ rx: [4, 8, 4] }}
            transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
          />
          <circle cx={cx - 10} cy={cy - 10} r="6" fill="#FFFFFF" />
        </>
      );
    }

    if (affectDanger) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#111827" stroke="#EF4444" strokeWidth="2.5" />
          <motion.polygon
            points={`${cx},${cy - 20} ${cx + 18},${cy + 14} ${cx - 18},${cy + 14}`}
            fill="#FBBF24"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.0 }}
            style={{ transformOrigin: `${cx}px ${cy + 4}px` }}
          />
          <text x={cx} y={cy + 11} textAnchor="middle" fill="#000000" fontSize="18" fontWeight="bold">!</text>
        </>
      );
    }

    if (affectDevil) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#7C3AED" />
          <motion.polygon
            points={`${cx - 18},${cy} ${cx},${cy - 6} ${cx + 18},${cy} ${cx},${cy + 6}`}
            fill="#FBBF24"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <circle cx={cx - 8} cy={cy - 10} r="5" fill="#FFFFFF" />
        </>
      );
    }

    if (affectAngel) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#E0F2FE" stroke="#38BDF8" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="14" fill="#0284C7" />
          <circle cx={cx} cy={cy} r="6" fill="#FFFFFF" />
          <ellipse cx={cx} cy={cy - 8} rx="12" ry="4" fill="#FFFFFF" opacity="0.6" />
        </>
      );
    }

    if (affectFlower) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#FCE7F3" />
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            {[0, 72, 144, 216, 288].map((angle) => (
              <path
                key={angle}
                d={`M ${cx} ${cy} C ${cx - 10} ${cy - 22}, ${cx + 10} ${cy - 22}, ${cx} ${cy}`}
                fill="#F472B6"
                transform={`rotate(${angle} ${cx} ${cy})`}
              />
            ))}
            <circle cx={cx} cy={cy} r="6" fill="#FCE7F3" />
            <circle cx={cx} cy={cy} r="3" fill="#F472B6" />
          </motion.g>
        </>
      );
    }

    if (affectSweetYum) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="url(#eyeGrad)" />
          <motion.circle
            cx={cx}
            cy={cy - 12}
            r={pupilR}
            fill="#05226E"
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <circle cx={cx - 8} cy={cy - 18} r="6" fill="#FFFFFF" />
          <circle cx={cx + 10} cy={cy - 8} r="3.5" fill="#FFFFFF" opacity="0.8" />
        </>
      );
    }

    if (affectParty) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#F472B6" opacity="0.2" />
          <circle cx={cx} cy={cy} r={irisR - 4} fill="none" stroke="#60A5FA" strokeWidth="4" />
          <circle cx={cx} cy={cy} r={irisR - 12} fill="none" stroke="#F59E0B" strokeWidth="3" />
          <motion.circle
            cx={cx}
            cy={cy}
            r="10"
            fill="#EF4444"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.0 }}
          />
          <circle cx={cx - 14} cy={cy - 14} r="4" fill="#34D399" />
          <circle cx={cx + 14} cy={cy - 14} r="4" fill="#F472B6" />
          <circle cx={cx + 14} cy={cy + 14} r="4" fill="#60A5FA" />
          <circle cx={cx - 14} cy={cy + 14} r="4" fill="#F59E0B" />
        </>
      );
    }

    if (affectWater) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#0284C7" />
          <motion.path
            d={`M ${cx - 24} ${cy} Q ${cx - 12} ${cy - 18} ${cx} ${cy} T ${cx + 24} ${cy}`}
            fill="none"
            stroke="#E0F2FE"
            strokeWidth="3.5"
            strokeLinecap="round"
            animate={{ x: [-8, 8, -8] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          />
          <motion.path
            d={`M ${cx - 24} ${cy + 10} Q ${cx - 12} ${cy - 8} ${cx} ${cy + 10} T ${cx + 24} ${cy + 10}`}
            fill="none"
            stroke="#E0F2FE"
            strokeWidth="2.5"
            strokeLinecap="round"
            animate={{ x: [8, -8, 8] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          />
          <circle cx={cx} cy={cy - 6} r="10" fill="#0369A1" />
          <circle cx={cx - 6} cy={cy - 10} r="4" fill="#FFFFFF" />
        </>
      );
    }

    if (affectHeadphones) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#111827" stroke="#10B981" strokeWidth="2.5" />
          <g>
            <motion.rect
              x={cx - 14}
              y={cy - 14}
              width="6"
              height="28"
              rx="2"
              fill="#34D399"
              animate={{ scaleY: [0.3, 0.9, 0.5, 1.0, 0.4] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
              style={{ transformOrigin: `${cx - 11}px ${cy + 14}px` }}
            />
            <motion.rect
              x={cx - 3}
              y={cy - 14}
              width="6"
              height="28"
              rx="2"
              fill="#10B981"
              animate={{ scaleY: [0.7, 0.3, 1.0, 0.5, 0.8] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
              style={{ transformOrigin: `${cx}px ${cy + 14}px` }}
            />
            <motion.rect
              x={cx + 8}
              y={cy - 14}
              width="6"
              height="28"
              rx="2"
              fill="#059669"
              animate={{ scaleY: [0.4, 0.9, 0.3, 0.7, 0.5] }}
              transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }}
              style={{ transformOrigin: `${cx + 11}px ${cy + 14}px` }}
            />
          </g>
        </>
      );
    }

    if (affectWinter) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#EFF6FF" stroke="#93C5FD" strokeWidth="2" />
          <motion.g
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <g key={angle} transform={`rotate(${angle} ${cx} ${cy})`}>
                <line x1={cx} y1={cy} x2={cx} y2={cy - 22} stroke="#3B82F6" strokeWidth="3.5" strokeLinecap="round" />
                <line x1={cx} y1={cy - 14} x2={cx - 6} y2={cy - 20} stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                <line x1={cx} y1={cy - 14} x2={cx + 6} y2={cy - 20} stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ))}
          </motion.g>
          <circle cx={cx} cy={cy} r="6" fill="#3B82F6" />
          <circle cx={cx} cy={cy} r="2.5" fill="#EFF6FF" />
        </>
      );
    }

    if (affectShark) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#4B5563" />
          <motion.path
            d={`M ${cx - 15} ${cy + 10} C ${cx - 15} ${cy - 20}, ${cx} ${cy - 20}, ${cx + 10} ${cy - 24} C ${cx} ${cy - 8}, ${cx + 15} ${cy + 10}, ${cx - 15} ${cy + 10} Z`}
            fill="#1F2937"
            animate={{ scaleY: [1, 1.15, 1], rotate: [-10, 10, -10] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <circle cx={cx - 6} cy={cy - 12} r="3" fill="#FFFFFF" />
        </>
      );
    }

    if (affectShock) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
          <motion.circle
            cx={cx}
            cy={cy}
            r="6"
            fill="#000000"
            animate={{
              x: [0, -1.5, 1.5, -1, 1, 0],
              y: [0, 1, -1, 1.5, -1.5, 0],
            }}
            transition={{ repeat: Infinity, duration: 0.15 }}
          />
        </>
      );
    }

    if (affectWink && !isLeft) {
      return (
        <>
          <circle cx={cx} cy={cy} r={irisR} fill="url(#eyeGrad)" />
          <motion.path
            d={getSparklePath(cx, cy, 24)}
            fill="#FFD700"
            animate={{ scale: [1, 1.3, 1], rotate: [0, 45, 0] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <circle cx={cx - 10} cy={cy - 10} r="5" fill="#FFFFFF" />
        </>
      );
    }

    return (
      <>
        <motion.circle
          cx={cx}
          cy={irisY}
          r={irisR}
          fill="url(#eyeGrad)"
          animate={{
            x: mood === "THINKING" ? thinkingVariation.eyeLookX : 0,
            y: mood === "THINKING" ? thinkingVariation.eyeLookY : 0,
            cy: irisY,
            r: irisR
          }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
        />
        
        <motion.circle
          cx={(isLeft ? 400 : 624) + (isLeft ? 9 : -9) + (mood === "THINKING" ? 0 : config.irisYOffset * 0.5)}
          cy={cy + 6 + config.irisYOffset}
          r={pupilR}
          fill="#05226E"
          animate={{
            x: mood === "THINKING" ? thinkingVariation.eyeLookX * 1.15 : 0,
            y: mood === "THINKING" ? thinkingVariation.eyeLookY * 1.15 : 0,
            cx: (isLeft ? 400 : 624) + (isLeft ? 9 : -9) + (mood === "THINKING" ? 0 : config.irisYOffset * 0.5),
            cy: cy + 6 + config.irisYOffset,
            r: pupilR
          }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
        />
        
        <>
          <circle cx={cx - 15} cy={cy - 24} r="14" fill="#FFFFFF" />
          <circle cx={cx + 21} cy={cy + 20} r="7" fill="#FFFFFF" opacity="0.84" />
          <circle cx={cx - 15} cy={cy + 18} r="4.5" fill="#FFFFFF" opacity="0.65" />

          <AnimatePresence>
            {(isExcitedText || isIntellectText) && (
              <motion.g
                initial={{ scale: 0, opacity: 0, rotate: 0 }}
                animate={{ scale: [1, 1.25, 1], opacity: 1, rotate: isLeft ? 360 : -360 }}
                exit={{ scale: 0, opacity: 0 }}
                style={{ transformOrigin: `${cx - 5}px ${cy - 10}px` }}
                transition={{
                  scale: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
                  rotate: { repeat: Infinity, duration: 6.0, ease: "linear" },
                  opacity: { duration: 0.25 }
                }}
              >
                <path d={getSparklePath(cx - 5, cy - 10, 7)} fill="#FFE03D" />
              </motion.g>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isLoveText && (
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                style={{ transformOrigin: `${cx - 5}px ${cy - 10}px` }}
                transition={{
                  scale: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
                  opacity: { duration: 0.25 }
                }}
              >
                <path d={`M ${cx - 5} ${cy - 16} C ${cx - 7} ${cy - 21}, ${cx - 15} ${cy - 21}, ${cx - 15} ${cy - 15} C ${cx - 15} ${cy - 10}, ${cx - 8} ${cy - 5}, ${cx - 5} ${cy - 1} C ${cx - 2} ${cy - 5}, ${cx + 5} ${cy - 10}, ${cx + 5} ${cy - 15} C ${cx + 5} ${cy - 21}, ${cx - 3} ${cy - 21}, ${cx - 5} ${cy - 16} Z`} fill="#FF4D6A" />
              </motion.g>
            )}
          </AnimatePresence>
        </>
      </>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full h-full p-2 overflow-visible" id="buddy-avatar-frame">
      {/* High-fidelity Listening Wave Rings */}
      <AnimatePresence>
        {listeningState && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            {/* Ambient Background Wave Rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0.15, 0.45, 0],
                  scale: [0.85, 1.3 + (audioLevel * 0.4) + (i * 0.15), 1.6 + (i * 0.25)],
                  borderWidth: ["1px", "3px", "1px"],
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeOut",
                }}
                className={`absolute w-full h-full rounded-full border-dashed ${
                  isChucky 
                    ? "border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                    : "border-orange-400/40 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                }`}
                style={{
                  filter: "blur(2px)",
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          y: isSpeaking 
            ? [0, -8, 0] 
            : (listeningState ? [0, -6, 0] : [0, -12, 0]),
          rotate: isChucky ? wiggle : 0,
        }}
        transition={{
          y: {
            repeat: Infinity,
            duration: isSpeaking ? 1.8 : (listeningState ? 2.8 : 4.0),
            ease: "easeInOut"
          },
          rotate: { duration: 0.1 }
        }}
        className="relative flex items-center justify-center w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[440px] md:h-[440px]"
        style={{ transformOrigin: "50% 75%" }}
      >
        <svg
          viewBox="0 0 1024 1024"
          className="w-full h-full drop-shadow-[0_24px_60px_rgba(0,0,0,0.22)] overflow-visible"
        >
          {/* DEFINITIONS & GRADIENTS */}
          <defs>
            {/* Skin Tone Normal */}
            <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
              <motion.stop offset="0%" animate={{ stopColor: activeGrads.skin0 }} transition={{ duration: 0.8 }} />
              <motion.stop offset="50%" animate={{ stopColor: activeGrads.skin50 }} transition={{ duration: 0.8 }} />
              <motion.stop offset="100%" animate={{ stopColor: activeGrads.skin100 }} transition={{ duration: 0.8 }} />
            </linearGradient>

            {/* Skin Tone Chucky */}
            <linearGradient id="skinEvil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFD8B3" />
              <stop offset="48%" stopColor="#E08C56" />
              <stop offset="100%" stopColor="#A2502C" />
            </linearGradient>

            {/* Cap Color (Super bright, rich 1980s blue with gradient) */}
            <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
              <motion.stop offset="0%" animate={{ stopColor: activeGrads.cap0 }} transition={{ duration: 0.8 }} />
              <motion.stop offset="45%" animate={{ stopColor: activeGrads.cap45 }} transition={{ duration: 0.8 }} />
              <motion.stop offset="100%" animate={{ stopColor: activeGrads.cap100 }} transition={{ duration: 0.8 }} />
            </linearGradient>

            <linearGradient id="capBrimGrad" x1="0" y1="0" x2="0" y2="1">
              <motion.stop offset="0%" animate={{ stopColor: activeGrads.brim0 }} transition={{ duration: 0.8 }} />
              <motion.stop offset="100%" animate={{ stopColor: activeGrads.brim100 }} transition={{ duration: 0.8 }} />
            </linearGradient>

            {/* Hair Color (Premium warm-brown gradient) */}
            <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9C5221" />
              <stop offset="60%" stopColor="#6E3511" />
              <stop offset="100%" stopColor="#451C05" />
            </linearGradient>

            {/* Eye Gradients */}
            <radialGradient id="eyeGrad" cx="35%" cy="30%" r="65%">
              <motion.stop offset="0%" animate={{ stopColor: activeGrads.eye0 }} transition={{ duration: 0.8 }} />
              <motion.stop offset="40%" animate={{ stopColor: activeGrads.eye40 }} transition={{ duration: 0.8 }} />
              <motion.stop offset="100%" animate={{ stopColor: activeGrads.eye100 }} transition={{ duration: 0.8 }} />
            </radialGradient>

            <radialGradient id="eyeGradEvil" cx="45%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#FFE0E0" />
              <stop offset="35%" stopColor="#FF3E3E" />
              <stop offset="75%" stopColor="#A60D0D" />
              <stop offset="100%" stopColor="#3B0303" />
            </radialGradient>

            {/* Button Golden Shine */}
            <linearGradient id="buttonGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFEAA7" />
              <stop offset="40%" stopColor="#F1C40F" />
              <stop offset="100%" stopColor="#D35400" />
            </linearGradient>

            {/* Overalls Red */}
            <linearGradient id="overallGrad" x1="0" y1="0" x2="0" y2="1">
              <motion.stop offset="0%" animate={{ stopColor: activeGrads.overall0 }} transition={{ duration: 0.8 }} />
              <motion.stop offset="100%" animate={{ stopColor: activeGrads.overall100 }} transition={{ duration: 0.8 }} />
            </linearGradient>

            <linearGradient id="overallGradEvil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C92025" />
              <stop offset="100%" stopColor="#690408" />
            </linearGradient>

            {/* Radial Blushing Gland */}
            <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
              <motion.stop offset="0%" animate={{ stopColor: activeGrads.blush }} stopOpacity="0.48" transition={{ duration: 0.8 }} />
              <motion.stop offset="100%" animate={{ stopColor: activeGrads.blush }} stopOpacity="0" transition={{ duration: 0.8 }} />
            </radialGradient>

            <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2E0804" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#2E0804" stopOpacity="0" />
            </radialGradient>

            {/* Custom soft-focus shadows for nose and chin */}
            <radialGradient id="noseShadowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2E0804" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#2E0804" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#2E0804" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="chinShadowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2E0804" stopOpacity="0.48" />
              <stop offset="65%" stopColor="#2E0804" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2E0804" stopOpacity="0" />
            </radialGradient>

            {/* Glow / Horror Aura Filters */}
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="16" stdDeviation="15" floodColor="#3D1A02" floodOpacity="0.14" />
            </filter>
            
            <filter id="evilGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#FF2E2E" floodOpacity="0.95" />
              <feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#1E9CFF" floodOpacity="0.45" />
            </filter>

            {/* Dynamic ClipPath for Mouth Interior Details */}
            <clipPath id="mouthClip">
              <motion.path
                d={getMouthPath()}
                animate={{ d: getMouthPath() }}
                transition={isSpeaking ? { duration: 0.08 } : { type: "spring", stiffness: 220, damping: 15 }}
              />
            </clipPath>
          </defs>

          {/* GLITCH NEON TRANSMISSION ELEMENTS (Chucky Mode Only, Pulsating) */}
          {isChucky && (
            <g id="glitch-aura">
              <motion.rect
                animate={{ opacity: [0.2, 0.8, 0.2], scaleX: [0.85, 1.15, 0.85] }}
                transition={{ repeat: Infinity, duration: 0.18 }}
                x="140" y="290" width="80" height="12" rx="3" fill="#167CF2"
              />
              <motion.rect
                animate={{ opacity: [0.9, 0.3, 0.9], scaleX: [1.2, 0.9, 1.2] }}
                transition={{ repeat: Infinity, duration: 0.12 }}
                x="110" y="380" width="90" height="10" rx="3" fill="#F1222F"
              />
              <motion.rect
                animate={{ opacity: [0.3, 0.9, 0.3], x: [810, 790, 810] }}
                transition={{ repeat: Infinity, duration: 0.22 }}
                x="800" y="260" width="75" height="11" rx="3" fill="#167CF2"
              />
              <motion.rect
                animate={{ opacity: [0.8, 0.4, 0.8], width: [60, 90, 60] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                x="830" y="360" width="60" height="9" rx="3" fill="#F1222F"
              />
            </g>
          )}

          {/* CHARACTER BREATHING GROUP (Subtle idle breathing scale & shift) */}
          <motion.g
            id="character-breathing-group"
            animate={{
              scaleY: [1, 1.014, 1],
              scaleX: [1, 1.005, 1],
              y: [0, -1.2, 0],
            }}
            style={{ transformOrigin: "512px 1024px" }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* TORSO / CLOTHES */}
            <g id="body">
            {/* Rainbow Striped Shirt base (1980s retro stripes style) */}
            <path id="shirt-base" d="M232 872 C268 768 363 710 512 710 C661 710 756 768 792 872 L826 1024 H198 Z" fill="#FFD02A" />
            {/* Rainbow Stripe Highlights */}
            <path d="M242 842 H782 L790 879 H234 Z" fill="#FFD02A" />
            <path d="M232 879 H792 L801 918 H223 Z" fill="#1C82EC" />
            <path d="M224 918 H800 L810 957 H214 Z" fill="#E72B2F" />
            <path d="M214 957 H810 L820 995 H204 Z" fill="#4CAF58" />
            <path d="M204 995 H820 L828 1024 H196 Z" fill="#7453A6" />

            {/* Sleeves */}
            <path id="left-sleeve" d="M232 870 C197 897 178 951 167 1024 H286 L304 890 Z" fill="#1C82EC" />
            <path id="right-sleeve" d="M792 870 C827 897 846 951 857 1024 H738 L720 890 Z" fill="#1C82EC" />
            <path d="M170 995 H289 L295 958 H177 Z" fill="#E72B2F" />
            <path d="M735 958 H847 L854 995 H729 Z" fill="#E72B2F" />

            {/* Overalls Straps & Bib */}
            <path id="overall-left-strap" d="M336 724 C360 720 390 720 418 727 L458 1024 H296 Z" fill={isChucky ? "url(#overallGradEvil)" : "url(#overallGrad)"} />
            <path id="overall-right-strap" d="M606 727 C634 720 664 720 688 724 L728 1024 H566 Z" fill={isChucky ? "url(#overallGradEvil)" : "url(#overallGrad)"} />
            <path id="overall-bib" d="M342 826 H682 C718 826 742 852 748 889 L764 1024 H260 L276 889 C282 852 306 826 342 826 Z" fill={isChucky ? "url(#overallGradEvil)" : "url(#overallGrad)"} />
            
            {/* Overalls Pocket (Detailed stitch edge) */}
            <path id="overall-pocket" d="M396 876 H628 V976 C628 991 616 1003 601 1003 H423 C408 1003 396 991 396 976 Z" fill={isChucky ? "#800B0E" : "#B00D14"} stroke={isChucky ? "#5E0509" : "#D82C35"} strokeWidth="4.5" />
            
            {/* Stylized Retro Brand typography in normal mode, dark glitch stitches in Chucky Mode */}
            {!isChucky ? (
              <text x="512" y="946" textAnchor="middle" fill="#FFEB60" fontSize="26" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="4.5">BUDDY</text>
            ) : (
              <g stroke="#3D0002" strokeWidth="5" strokeLinecap="round">
                {/* Horror Cross Stitch */}
                <path d="M472 916 L552 956" />
                <path d="M552 916 L472 956" />
              </g>
            )}

            {/* Overalls Big Yellow Buttons (Detailed with specular highlight & thread holes) */}
            {/* Left Button */}
            <circle cx="388" cy="796" r="33" fill="url(#buttonGrad)" stroke="#B87B00" strokeWidth="4.5" />
            <circle cx="388" cy="796" r="27" fill="none" stroke="#FFF" strokeWidth="1.5" opacity="0.45" />
            <g fill="#452300">
              <circle cx="377" cy="785" r="4.5" /><circle cx="399" cy="785" r="4.5" /><circle cx="377" cy="807" r="4.5" /><circle cx="399" cy="807" r="4.5" />
              <path d="M377 785 L399 807" stroke="#452300" strokeWidth="3" />
              <path d="M399 785 L377 807" stroke="#452300" strokeWidth="3" />
            </g>
            {/* Right Button */}
            <circle cx="636" cy="796" r="33" fill="url(#buttonGrad)" stroke="#B87B00" strokeWidth="4.5" />
            <circle cx="636" cy="796" r="27" fill="none" stroke="#FFF" strokeWidth="1.5" opacity="0.45" />
            <g fill="#452300">
              <circle cx="625" cy="785" r="4.5" /><circle cx="647" cy="785" r="4.5" /><circle cx="625" cy="807" r="4.5" /><circle cx="647" cy="807" r="4.5" />
              <path d="M625 785 L647 807" stroke="#452300" strokeWidth="3" />
              <path d="M647 785 L625 807" stroke="#452300" strokeWidth="3" />
            </g>

            {/* Yellow Collars */}
            <path id="yellow-collar-left" d="M430 716 C455 742 480 756 512 758 C488 782 455 784 423 760 Z" fill="#FFD83D" stroke="#C29100" strokeWidth="4" />
            <path id="yellow-collar-right" d="M594 716 C569 742 544 756 512 758 C536 782 569 784 601 760 Z" fill="#FFD83D" stroke="#C29100" strokeWidth="4" />
          </g>

          {/* NECK */}
          <rect id="neck" x="443" y="684" width="138" height="98" rx="52" fill={isChucky ? "url(#skinEvil)" : "url(#skinGrad)"} />
          {/* Collar shadow under chin */}
          <ellipse cx="512" cy="698" rx="60" ry="14" fill="#2E0804" opacity="0.18" />

          {/* HEAD GROUP (Allows tilting and thinking movements) */}
          <motion.g
            id="head-group"
            animate={{
              rotate: (mood === "THINKING" ? thinkingVariation.headTilt : 0) + visualExpression.headTilt,
              y: mood === "THINKING" ? [0, -1.5, 0] : 0,
            }}
            style={{ transformOrigin: "512px 680px" }} // Rotate around neck pivot
            transition={mood === "THINKING" ? {
              rotate: { type: "spring", stiffness: 90, damping: 14 },
              y: { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
            } : { type: "spring", stiffness: 120, damping: 18 }}
          >

          {/* EARS & BACK HAIR */}
          <ellipse cx="261" cy="528" rx="39" ry="54" fill={isChucky ? "#BC7753" : "#F4B384"} stroke={isChucky ? "#8C4A28" : "#E2935C"} strokeWidth="2.5" />
          <ellipse cx="763" cy="528" rx="39" ry="54" fill={isChucky ? "#BC7753" : "#F4B384"} stroke={isChucky ? "#8C4A28" : "#E2935C"} strokeWidth="2.5" />

          {/* Side hair locks */}
          <g id="side-hair" fill="url(#hairGrad)">
            <path d="M264 335 C231 427 238 610 318 694 C340 717 382 706 399 666 C362 610 343 540 347 446 C351 366 317 326 264 335 Z" />
            <path d="M760 335 C793 427 786 610 706 694 C684 717 642 706 625 666 C662 610 681 540 677 446 C673 366 707 326 760 335 Z" />
          </g>

          {/* Soft-focus shadow under the chin casting onto neck */}
          <ellipse cx="512" cy="762" rx="140" ry="34" fill="url(#chinShadowGrad)" />

          {/* HEAD & FACE SHAPE */}
          <path
            id="face"
            d="M512 215 C674 215 776 335 776 520 C776 685 668 765 512 765 C356 765 248 685 248 520 C248 335 350 215 512 215 Z"
            fill={isChucky ? "url(#skinEvil)" : "url(#skinGrad)"}
          />

          {/* Soft volumetric shading on the chin itself */}
          <ellipse cx="512" cy="742" rx="90" ry="24" fill="url(#noseShadowGrad)" opacity="0.65" />

          {/* Premium Soft Radial blushing cheeks */}
          {!isChucky ? (
            <g>
              <motion.circle
                cx="340"
                cy="590"
                r={blushRadius}
                fill="url(#blushGrad)"
                animate={isSpeaking && isExcitedText ? {
                  r: [blushRadius, blushRadius + 5, blushRadius],
                  opacity: blushOpacity
                } : {
                  r: blushRadius,
                  opacity: blushOpacity
                }}
                transition={{ duration: 1.5, repeat: isSpeaking && isExcitedText ? Infinity : 0, ease: "easeInOut" }}
              />
              <motion.circle
                cx="684"
                cy="590"
                r={blushRadius}
                fill="url(#blushGrad)"
                animate={isSpeaking && isExcitedText ? {
                  r: [blushRadius, blushRadius + 5, blushRadius],
                  opacity: blushOpacity
                } : {
                  r: blushRadius,
                  opacity: blushOpacity
                }}
                transition={{ duration: 1.5, repeat: isSpeaking && isExcitedText ? Infinity : 0, ease: "easeInOut" }}
              />
            </g>
          ) : (
            // Sinister heavy purple-grey under-eye hollow shading for Chucky
            <g>
              <ellipse cx="400" cy="545" rx="72" ry="42" fill="url(#shadowGrad)" />
              <ellipse cx="624" cy="545" rx="72" ry="42" fill="url(#shadowGrad)" />
            </g>
          )}

          {/* CHUCKY SCARS & PUFFY GLOWING STITCHES (Chucky Mode Only) */}
          {isChucky && (
            <g id="chucky-horror-comedy-scars">
              {/* Underlying glowing flesh of scars */}
              <g fill="none" stroke="#FF4D4D" strokeWidth="12" strokeLinecap="round" opacity="0.38" style={{ filter: "blur(2px)" }}>
                <path d="M316 378 C353 410 385 439 426 460" />
                <path d="M598 341 C647 376 681 413 711 457" />
                <path d="M335 613 C373 588 409 582 446 591" />
                <path d="M595 642 C642 665 686 666 726 650" />
                <path d="M476 382 C505 355 538 355 570 382" />
              </g>
              {/* Primary deep red scar cuts */}
              <g fill="none" stroke="#5C1A14" strokeWidth="7" strokeLinecap="round" opacity="0.95">
                <path d="M316 378 C353 410 385 439 426 460" />
                <path d="M598 341 C647 376 681 413 711 457" />
                <path d="M335 613 C373 588 409 582 446 591" />
                <path d="M595 642 C642 665 686 666 726 650" />
                <path d="M476 382 C505 355 538 355 570 382" />
              </g>
              {/* Stitches tying the scars together */}
              <g stroke="#1F0B09" strokeWidth="4.5" strokeLinecap="round">
                <path d="M335 390 L319 406" /><path d="M363 415 L347 433" /><path d="M393 439 L378 457" />
                <path d="M617 359 L602 378" /><path d="M648 387 L631 406" /><path d="M676 419 L659 438" />
                <path d="M359 602 L346 584" /><path d="M397 589 L391 570" /><path d="M636 653 L646 634" /><path d="M681 658 L688 638" />
                <path d="M493 370 L484 351" /><path d="M524 363 L524 343" /><path d="M553 371 L563 352" />
              </g>
            </g>
          )}

          {/* BLUE BASEBALL CAP (Polished high-end render with seams and gold button) */}
          <motion.g
            id="blue-cap"
            animate={isSpeaking && isExcitedText ? {
              y: [0, -18, 0],
              rotate: [0, -2, 2, 0]
            } : { y: 0, rotate: 0 }}
            transition={isSpeaking && isExcitedText ? {
              repeat: Infinity,
              duration: 1.6,
              ease: "easeInOut"
            } : { type: "spring", stiffness: 120, damping: 15 }}
            style={{ transformOrigin: "512px 233px" }}
          >
            {/* Cap Dome */}
            <path id="cap-crown" d="M213 325 C233 124 362 40 512 40 C662 40 791 124 811 325 C736 262 638 233 512 233 C386 233 288 262 213 325 Z" fill="url(#capGrad)" stroke="#094A84" strokeWidth="3" />
            {/* Cap Seams */}
            <path d="M512 48 C501 110 498 180 502 245" fill="none" stroke="#0558A1" strokeWidth="7" strokeLinecap="round" opacity="0.45" />
            <path d="M360 80 C407 125 438 185 453 250" fill="none" stroke="#0558A1" strokeWidth="5.5" strokeLinecap="round" opacity="0.32" />
            <path d="M664 80 C617 125 586 185 571 250" fill="none" stroke="#0558A1" strokeWidth="5.5" strokeLinecap="round" opacity="0.32" />
            {/* Gloss Highlight on Dome */}
            {!isChucky && <ellipse cx="512" cy="115" rx="38" ry="17" fill="#8CE0FF" opacity="0.25" />}
            
            {/* Cap Brim / Visor */}
            <path id="cap-brim" d="M208 318 C284 235 385 195 512 195 C639 195 740 235 816 318 C713 303 614 297 512 297 C410 297 311 303 208 318 Z" fill="url(#capBrimGrad)" stroke="#094A84" strokeWidth="3" />
            {/* Visor Shadow Line */}
            <path d="M236 318 C321 280 415 263 512 263 C609 263 703 280 788 318" fill="none" stroke="#043C70" strokeWidth="9.5" strokeLinecap="round" opacity="0.4" />
            {/* Gold Crown Button on top */}
            <circle cx="512" cy="40" r="14" fill="url(#buttonGrad)" stroke="#B87B00" strokeWidth="3.5" />
          </motion.g>

          {/* BROWN BANGS (Bowlcut / Messier in Chucky) */}
          <path
            id={isChucky ? "messy-bangs" : "brown-bangs"}
            d={isChucky 
              ? "M306 295 C360 259 438 245 512 247 C586 245 664 259 718 295 L716 378 C688 329 660 387 633 329 C606 384 574 326 546 371 C519 320 488 377 459 327 C434 384 401 327 374 378 C349 329 325 364 307 350 Z"
              : "M308 295 C361 261 438 245 512 247 C586 245 663 261 716 295 L714 373 C688 337 660 380 634 336 C606 379 574 333 546 367 C519 327 488 372 460 335 C434 378 401 337 374 372 C350 337 325 364 309 350 Z"
            }
            fill="url(#hairGrad)"
          />

          {/* Hair locks detailing */}
          <g id="bang-detail" stroke="#3A1D0B" strokeWidth="5.5" strokeLinecap="round" opacity="0.25">
            <path d="M369 295 C363 327 365 350 372 377" />
            <path d="M438 273 C434 317 435 350 442 386" />
            <path d="M512 263 C509 310 509 347 512 387" />
            <path d="M586 273 C590 317 589 350 582 386" />
            <path d="M655 295 C661 327 659 350 652 387" />
          </g>

          {/* EYEBROWS */}
          <g id="eyebrows">
            {/* Left Brow */}
            <motion.path
              d={isChucky ? "M318 410 C365 422 410 442 458 480" : "M336 415 Q 391 390 446 415"}
              fill="none"
              stroke={isChucky ? "#1A0600" : "#4A2207"}
              strokeWidth={isChucky ? 19 : 13.5}
              strokeLinecap="round"
              animate={{
                x: mood === "THINKING" ? thinkingVariation.eyebrowShiftX : 0,
                y: isChucky ? 8 : config.browY + (mood === "THINKING" ? thinkingVariation.eyebrowShiftY : 0),
                rotate: isChucky ? 22 : config.browRotateLeft + (mood === "THINKING" ? 4 : 0),
                strokeWidth: isChucky ? 19 : 13.5,
                stroke: isChucky ? "#1A0600" : "#4A2207"
              }}
              style={{ transformOrigin: "391px 415px" }}
              transition={{ type: "spring", stiffness: 180, damping: 16 }}
            />
            {/* Right Brow */}
            <motion.path
              d={isChucky ? "M706 410 C659 422 614 442 566 480" : "M578 415 Q 633 390 688 415"}
              fill="none"
              stroke={isChucky ? "#1A0600" : "#4A2207"}
              strokeWidth={isChucky ? 19 : 13.5}
              strokeLinecap="round"
              animate={{
                x: mood === "THINKING" ? -thinkingVariation.eyebrowShiftX : 0,
                y: isChucky ? 8 : config.browY + (mood === "THINKING" ? thinkingVariation.eyebrowShiftY + 2 : 0),
                rotate: isChucky ? -22 : config.browRotateRight + (mood === "THINKING" ? -4 : 0),
                strokeWidth: isChucky ? 19 : 13.5,
                stroke: isChucky ? "#1A0600" : "#4A2207"
              }}
              style={{ transformOrigin: "633px 415px" }}
              transition={{ type: "spring", stiffness: 180, damping: 16 }}
            />
          </g>

          {/* KIND BLUE EYES (NORMAL) or SHARP GLOWING SCARY EYES (CHUCKY) */}
          <g id="eyes" filter={isChucky ? "url(#evilGlow)" : undefined}>
            {/* Left Eye */}
            <motion.g
              animate={{ scaleY: getLeftEyeScaleY() }}
              style={{ transformOrigin: "400px 480px" }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
            >
              {affectWink || affectLaugh || affectCry || affectSleep ? (
                // Custom closed/squinting path for wink/laugh/cry/sleep
                <path
                  d={affectWink || affectLaugh 
                    ? "M 346 480 Q 400 430 454 480" // happy arc up
                    : "M 346 470 Q 400 510 454 470" // sad drooping arc down
                  }
                  fill="none"
                  stroke={isChucky ? "#1A0600" : "#4A2207"}
                  strokeWidth="14"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  {/* White Sclera Path */}
                  <motion.path
                    d={isChucky 
                      ? getScleraPath(400, 480, 54, 54) 
                      : getScleraPath(400, 480, config.scleraRx, config.scleraRy)}
                    fill="#FFFFFF"
                    stroke={isChucky ? "#800B0E" : "#1A6CB0"}
                    strokeWidth={isChucky ? "4" : "1.5"}
                    animate={{
                      d: isChucky 
                        ? getScleraPath(400, 480, 54, 54) 
                        : getScleraPath(400, 480, config.scleraRx, config.scleraRy),
                      stroke: isChucky ? "#800B0E" : "#1A6CB0",
                      strokeWidth: isChucky ? 4 : 1.5
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 16 }}
                  />
                  {/* Bloodshot veins in Chucky mode */}
                  {isChucky && (
                    <g opacity="0.65">
                      <path d="M352 480 Q375 472 384 476" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                      <path d="M448 480 Q425 488 416 480" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                      <path d="M400 432 Q402 455 398 464" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                      <path d="M400 528 Q398 502 402 494" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  )}
                  {/* Custom rendered eye content containing irises, pupils, emoji symbols, and dynamic expressions */}
                  {renderEyeContent(400, 480, true)}
                </>
              )}
            </motion.g>

            {/* Right Eye */}
            <motion.g
              animate={{ scaleY: getRightEyeScaleY() }}
              style={{ transformOrigin: "624px 480px" }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
            >
              {affectLaugh || affectCry || affectSleep ? (
                // Custom closed/squinting path for laugh/cry/sleep
                <path
                  d={affectLaugh 
                    ? "M 570 480 Q 624 430 678 480" // happy arc up
                    : "M 570 470 Q 624 510 678 470" // sad drooping arc down
                  }
                  fill="none"
                  stroke={isChucky ? "#1A0600" : "#4A2207"}
                  strokeWidth="14"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  {/* White Sclera Path */}
                  <motion.path
                    d={isChucky 
                      ? getScleraPath(624, 480, 54, 54) 
                      : getScleraPath(624, 480, config.scleraRx, config.scleraRy)}
                    fill="#FFFFFF"
                    stroke={isChucky ? "#800B0E" : "#1A6CB0"}
                    strokeWidth={isChucky ? "4" : "1.5"}
                    animate={{
                      d: isChucky 
                        ? getScleraPath(624, 480, 54, 54) 
                        : getScleraPath(624, 480, config.scleraRx, config.scleraRy),
                      stroke: isChucky ? "#800B0E" : "#1A6CB0",
                      strokeWidth: isChucky ? 4 : 1.5
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 16 }}
                  />
                  {/* Bloodshot veins in Chucky mode */}
                  {isChucky && (
                    <g opacity="0.65">
                      <path d="M576 480 Q599 472 608 476" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                      <path d="M672 480 Q649 488 640 480" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                      <path d="M624 432 Q626 455 622 464" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                      <path d="M624 528 Q622 502 626 494" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  )}
                  {/* Custom rendered eye content containing irises, pupils, emoji symbols, and dynamic expressions */}
                  {renderEyeContent(624, 480, false)}
                </>
              )}
            </motion.g>

            {/* DYNAMIC EYE OVERLAYS (Tears, sweat, sunglasses, angel halo, devil horns, cat whiskers) */}
            {affectCry && (
              <g opacity="0.85">
                <motion.path
                  d="M 370 500 Q 365 525 370 540 C 375 550, 365 550, 370 540 Z"
                  fill="#38BDF8"
                  animate={{ y: [0, 25, 0], opacity: [0.9, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                />
                <motion.path
                  d="M 654 500 Q 659 525 654 540 C 649 550, 659 550, 654 540 Z"
                  fill="#38BDF8"
                  animate={{ y: [0, 25, 0], opacity: [0.9, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "linear", delay: 0.3 }}
                />
              </g>
            )}

            {affectSweat && (
              <g opacity="0.85">
                <motion.path
                  d="M 300 440 Q 295 460 300 472 C 304 480, 296 480, 300 472 Z"
                  fill="#60A5FA"
                  animate={{ y: [0, 35, 0], opacity: [1, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 2.0, ease: "linear" }}
                />
                <motion.path
                  d="M 724 440 Q 729 460 724 472 C 720 480, 728 480, 724 472 Z"
                  fill="#60A5FA"
                  animate={{ y: [0, 35, 0], opacity: [1, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 2.0, ease: "linear", delay: 0.5 }}
                />
              </g>
            )}

            {affectCool && (
              <g id="retro-sunglasses" opacity="0.95">
                <polygon points="320,440 470,450 460,510 330,490" fill="#111827" stroke="#3B82F6" strokeWidth="4" />
                <polygon points="554,450 704,440 694,490 564,510" fill="#111827" stroke="#3B82F6" strokeWidth="4" />
                <rect x="466" y="456" width="72" height="10" fill="#111827" rx="3" stroke="#3B82F6" strokeWidth="2" />
                <line x1="340" y1="450" x2="380" y2="490" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
                <line x1="574" y1="460" x2="614" y2="500" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
              </g>
            )}

            {affectAngel && (
              <motion.g
                id="angel-halo"
                animate={{ y: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
              >
                <ellipse cx="512" cy="160" rx="90" ry="16" fill="none" stroke="#FBBF24" strokeWidth="8" filter="drop-shadow(0px 0px 10px rgba(251,191,36,0.8))" />
                <ellipse cx="512" cy="160" rx="90" ry="16" fill="none" stroke="#FFFFFF" strokeWidth="2" />
              </motion.g>
            )}

            {affectDevil && (
              <g id="devil-horns" fill="#EF4444" filter="drop-shadow(0px 0px 8px rgba(239,68,68,0.9))">
                <path d="M 330 330 C 310 300, 275 270, 270 240 C 290 260, 310 290, 350 315 Z" />
                <path d="M 694 330 C 714 300, 749 270, 754 240 C 734 260, 714 290, 674 315 Z" />
              </g>
            )}

            {affectCat && (
              <g id="cat-features" stroke="#111827" strokeWidth="4" strokeLinecap="round">
                <line x1="280" y1="610" x2="190" y2="590" />
                <line x1="280" y1="625" x2="180" y2="625" />
                <line x1="280" y1="640" x2="190" y2="660" />
                <line x1="744" y1="610" x2="834" y2="590" />
                <line x1="744" y1="625" x2="844" y2="625" />
                <line x1="744" y1="640" x2="834" y2="660" />
                <polygon points="496,550 528,550 512,566" fill="#F472B6" stroke="none" />
              </g>
            )}
          </g>

          {/* NOSE SHADOW (Radial Gradient behind nose for depth) */}
          <ellipse cx="512" cy="578" rx="55" ry="34" fill="url(#noseShadowGrad)" />

          {/* NOSE */}
          <g id="nose">
            <ellipse cx="512" cy="565" rx="36" ry="31" fill={isChucky ? "#9C4D2C" : "#E28E56"} opacity={isChucky ? 0.75 : 0.62} />
            <ellipse cx="503" cy="552" rx="14" ry="8" fill={isChucky ? "#FFD0B3" : "#FFE1C7"} opacity={isChucky ? 0.52 : 0.65} />
          </g>

          {/* FRECKLES (Dotted over cheeks below the eyes, aligned with blush) */}
          <g id="freckles" fill={isChucky ? "#5E1D11" : "#944B24"} opacity="0.8">
            {/* Left cheek group */}
            <circle cx="310" cy="580" r="4" />
            <circle cx="330" cy="570" r="3.5" />
            <circle cx="355" cy="585" r="4" />
            <circle cx="325" cy="598" r="4" />
            <circle cx="345" cy="605" r="3" />
            {/* Right cheek group */}
            <circle cx="714" cy="580" r="4" />
            <circle cx="694" cy="570" r="3.5" />
            <circle cx="669" cy="585" r="4" />
            <circle cx="699" cy="598" r="4" />
            <circle cx="679" cy="605" r="3" />
          </g>

          {/* MOUTH & TEETH (Wholesome friendly smile vs. stitched crooked horror-comedy grin) */}
          <g id="mouth">
            {/* Main Mouth Background Outer Stroke */}
            <motion.path
              d={getMouthPath()}
              fill={isChucky ? "#3B0502" : (amplitudeFactor > 0.05 || config.mouthFill !== "none" ? config.mouthFill : "none")}
              stroke={isChucky ? "#2A0A02" : config.mouthStroke}
              strokeWidth={isChucky ? 12 : config.mouthStrokeWidth}
              strokeLinecap="round"
              animate={{
                d: getMouthPath(),
                fill: isChucky ? "#3B0502" : (amplitudeFactor > 0.05 || config.mouthFill !== "none" ? (config.mouthFill === "none" ? "#6E1B00" : config.mouthFill) : "none"),
                stroke: isChucky ? "#2A0A02" : config.mouthStroke,
                strokeWidth: isChucky ? 12 : config.mouthStrokeWidth
              }}
              transition={isSpeaking ? { duration: 0.08 } : { type: "spring", stiffness: 220, damping: 15 }}
            />

            {/* Dynamic Details Clipped inside the Mouth Shape */}
            <g clipPath="url(#mouthClip)">
              {/* Normal Mode Interior Details */}
              {!isChucky && (amplitudeFactor > 0.05 || config.mouthFill !== "none") && (
                <>
                  {/* Dynamic White Teeth bar that moves with amplitude */}
                  <motion.path
                    d="M 425 628 Q 512 642 599 628"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="11"
                    strokeLinecap="round"
                    animate={{
                      d: `M 425 ${628 + amplitudeFactor * 4} Q 512 ${642 + amplitudeFactor * 8} 599 ${628 + amplitudeFactor * 4}`,
                      strokeWidth: 10 + amplitudeFactor * 2
                    }}
                    transition={{ duration: 0.08 }}
                  />
                  {/* Dynamic Pink Tongue that expands and rises with amplitude */}
                  <motion.ellipse
                    cx="512"
                    cy="685"
                    rx="56"
                    ry="24"
                    fill="#FF8D85"
                    animate={{
                      cy: 685 - amplitudeFactor * 22,
                      rx: 56 + amplitudeFactor * 14,
                      ry: 24 + amplitudeFactor * 8
                    }}
                    transition={{ duration: 0.08 }}
                  />
                </>
              )}

              {/* Chucky Mode Interior Details */}
              {isChucky && (
                <motion.g
                  animate={{
                    scaleY: 1 + amplitudeFactor * 0.95,
                    y: -amplitudeFactor * 6,
                    scaleX: 1 + amplitudeFactor * 0.12
                  }}
                  style={{ transformOrigin: "512px 635px" }}
                  transition={{ duration: 0.08 }}
                >
                  {/* Villain grin crooked toothy outlines */}
                  <path d="M427 631 C481 660 557 650 620 609 C590 650 520 681 452 654 Z" fill="#F5EFE6" stroke="#2A0A02" strokeWidth="4.5" />
                  {/* Individual jagged teeth dividers */}
                  <path d="M455 640 L457 652" stroke="#2A0A02" strokeWidth="4" />
                  <path d="M485 642 L488 657" stroke="#2A0A02" strokeWidth="4" />
                  <path d="M515 644 L518 660" stroke="#2A0A02" strokeWidth="4" />
                  <path d="M545 640 L548 656" stroke="#2A0A02" strokeWidth="4" />
                  <path d="M575 632 L578 647" stroke="#2A0A02" strokeWidth="4" />
                  <path d="M602 622 L604 634" stroke="#2A0A02" strokeWidth="4" />
                </motion.g>
              )}
            </g>

            {/* Stitches (Outer details, drawn on top, stretching dynamically with voice) */}
            {isChucky && (
              <>
                {/* Left corner stitches stretching */}
                <motion.g
                  animate={{
                    scaleY: 1 + amplitudeFactor * 0.45,
                    y: -amplitudeFactor * 3
                  }}
                  style={{ transformOrigin: "405px 632px" }}
                  transition={{ duration: 0.08 }}
                >
                  <path d="M390 632 L405 652" stroke="#1C0601" strokeWidth="5.5" strokeLinecap="round" />
                  <path d="M415 624 L422 648" stroke="#1C0601" strokeWidth="5.5" strokeLinecap="round" />
                </motion.g>

                {/* Right corner stitches stretching */}
                <motion.g
                  animate={{
                    scaleY: 1 + amplitudeFactor * 0.45,
                    y: -amplitudeFactor * 3
                  }}
                  style={{ transformOrigin: "620px 615px" }}
                  transition={{ duration: 0.08 }}
                >
                  <path d="M610 612 L606 636" stroke="#1C0601" strokeWidth="5.5" strokeLinecap="round" />
                  <path d="M632 598 L620 618" stroke="#1C0601" strokeWidth="5.5" strokeLinecap="round" />
                </motion.g>
              </>
            )}
          </g>

          {/* SILHOUETTE OUTLINE & AMBIENT OCCLUSION */}
          <path
            d="M512 215 C674 215 776 335 776 520 C776 685 668 765 512 765 C356 765 248 685 248 520 C248 335 350 215 512 215 Z"
            fill="none"
            stroke={isChucky ? "#6B1D0B" : "#C97C47"}
            strokeWidth="4"
            opacity={isChucky ? 0.35 : 0.2}
          />

          {/* Dynamic Floating Emoticon and Emotion Particles */}
          {!isChucky && isSpeaking && (
            <g id="floating-emotions" pointerEvents="none">
              {/* Dynamic Text Emoticon Left */}
              {getActiveEmoticon() && (
                <motion.g
                  initial={{ y: 560, x: 230, opacity: 0, scale: 0 }}
                  animate={{
                    y: [560, 310, 100],
                    x: [230, 180, 220],
                    opacity: [0, 0.75, 0],
                    scale: [0.4, 1.0, 0.5],
                    rotate: [-15, 15, -10]
                  }}
                  transition={{ repeat: Infinity, duration: 4.2, ease: "easeOut", delay: 0 }}
                >
                  <text fontSize="22" textAnchor="middle">{getActiveEmoticon()}</text>
                </motion.g>
              )}

              {/* Dynamic Text Emoticon Right */}
              {getActiveEmoticon() && (
                <motion.g
                  initial={{ y: 530, x: 770, opacity: 0, scale: 0 }}
                  animate={{
                    y: [530, 260, 80],
                    x: [770, 810, 760],
                    opacity: [0, 0.75, 0],
                    scale: [0.4, 1.1, 0.5],
                    rotate: [15, -15, 10]
                  }}
                  transition={{ repeat: Infinity, duration: 4.8, ease: "easeOut", delay: 0.8 }}
                >
                  <text fontSize="24" textAnchor="middle">{getActiveEmoticon()}</text>
                </motion.g>
              )}

              {/* Dynamic Text Emoticon Center */}
              {getActiveEmoticon() && (
                <motion.g
                  initial={{ y: 460, x: 512, opacity: 0, scale: 0 }}
                  animate={{
                    y: [460, 220, 60],
                    x: [512, 470, 530],
                    opacity: [0, 0.7, 0],
                    scale: [0.3, 0.9, 0.4],
                    rotate: [0, 45, -45]
                  }}
                  transition={{ repeat: Infinity, duration: 3.8, ease: "easeOut", delay: 1.6 }}
                >
                  <text fontSize="20" textAnchor="middle">{getActiveEmoticon()}</text>
                </motion.g>
              )}

              {/* Floating Star 1 */}
              <motion.g
                initial={{ y: 550, x: 260, opacity: 0, scale: 0 }}
                animate={isExcitedText || isIntellectText || affectSparkle || affectSparklingJoy ? {
                  y: [550, 320, 120],
                  x: [260, 220, 250],
                  opacity: [0, 0.7, 0],
                  scale: [0.3, 0.9, 0.4],
                  rotate: [0, 180, 360]
                } : { opacity: 0 }}
                transition={{ repeat: Infinity, duration: 4.0, ease: "easeOut", delay: 0 }}
              >
                <path d={getSparklePath(0, 0, 12)} fill="#FFF59D" />
              </motion.g>

              {/* Floating Star 2 */}
              <motion.g
                initial={{ y: 520, x: 740, opacity: 0, scale: 0 }}
                animate={isExcitedText || isIntellectText || affectSparkle || affectSparklingJoy ? {
                  y: [520, 280, 100],
                  x: [740, 780, 750],
                  opacity: [0, 0.7, 0],
                  scale: [0.3, 1.0, 0.4],
                  rotate: [0, -120, -240]
                } : { opacity: 0 }}
                transition={{ repeat: Infinity, duration: 4.6, ease: "easeOut", delay: 0.9 }}
              >
                <path d={getSparklePath(0, 0, 14)} fill="#FFF59D" />
              </motion.g>

              {/* Floating Star 3 */}
              <motion.g
                initial={{ y: 480, x: 512, opacity: 0, scale: 0 }}
                animate={isExcitedText || affectSparkle || affectSparklingJoy ? {
                  y: [480, 240, 80],
                  x: [512, 480, 530],
                  opacity: [0, 0.65, 0],
                  scale: [0.2, 0.8, 0.3],
                  rotate: [0, 90, 180]
                } : { opacity: 0 }}
                transition={{ repeat: Infinity, duration: 3.6, ease: "easeOut", delay: 1.8 }}
              >
                <path d={getSparklePath(0, 0, 10)} fill="#FFF9C4" />
              </motion.g>

              {/* Floating Heart 1 */}
              <motion.g
                initial={{ y: 580, x: 320, opacity: 0, scale: 0 }}
                animate={isLoveText || affectLove ? {
                  y: [580, 340, 150],
                  x: [320, 290, 330],
                  opacity: [0, 0.75, 0],
                  scale: [0.4, 0.9, 0.5],
                  rotate: [-12, 12, -8]
                } : { opacity: 0 }}
                transition={{ repeat: Infinity, duration: 4.2, ease: "easeOut", delay: 0.3 }}
              >
                <path d="M 0 -4 C -2 -8, -8 -8, -8 -2 C -8 3, -3 7, 0 11 C 3 7, 8 3, 8 -2 C 8 -8, 2 -8, 0 -4 Z" fill="#FF4D6A" />
              </motion.g>

              {/* Floating Heart 2 */}
              <motion.g
                initial={{ y: 560, x: 680, opacity: 0, scale: 0 }}
                animate={isLoveText || affectLove ? {
                  y: [560, 310, 130],
                  x: [680, 710, 670],
                  opacity: [0, 0.75, 0],
                  scale: [0.4, 1.0, 0.5],
                  rotate: [12, -12, 6]
                } : { opacity: 0 }}
                transition={{ repeat: Infinity, duration: 4.8, ease: "easeOut", delay: 1.4 }}
              >
                <path d="M 0 -5 C -3 -10, -10 -10, -10 -3 C -10 4, -3 9, 0 14 C 3 9, 10 4, 10 -3 C 10 -10, 3 -10, 0 -5 Z" fill="#FF4081" />
              </motion.g>
            </g>
          )}
        </motion.g>
      </motion.g>
    </svg>
      </motion.div>
    </div>
  );
}
