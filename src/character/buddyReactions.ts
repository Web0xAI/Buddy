import { NormalActivity, Mood } from "../types";

export interface ReactionResult {
  activity: NormalActivity;
  mood: Mood;
  triggerWords: string[];
}

/**
 * Analyzes raw text (user speech or buddy response) to find emotional, behavioral, or topical cues.
 */
export function analyzeConversationText(text: string, isUserText: boolean): ReactionResult {
  const lower = text.toLowerCase().trim();
  const result: ReactionResult = {
    activity: "idle",
    mood: "IDLE",
    triggerWords: [],
  };

  if (!lower) return result;

  // 1. Check for compliments / positive / exciting topics
  const excitedWords = [
    "love", "heart", "adore", "great", "awesome", "cool", "wonderful", "amazing",
    "excited", "exciting", "hype", "pumped", "stoked", "thrilled", "beautiful",
    "best friend", "happy", "joy", "yay", "yippee", "wow", "unreal", "super"
  ];
  const matchedExcited = excitedWords.filter(w => lower.includes(w));
  if (matchedExcited.length > 0) {
    result.activity = "excited";
    result.mood = "EXCITED";
    result.triggerWords = matchedExcited;
    return result;
  }

  // 2. Check for confusion / questions / curiosities
  const curiousWords = [
    "why", "how", "what", "who", "where", "explain", "understand", "question",
    "learn", "study", "idea", "genius", "brain", "smart", "clever", "mystery", "search"
  ];
  const matchedCurious = curiousWords.filter(w => lower.includes(w));
  if (matchedCurious.length > 0) {
    result.activity = "curious";
    result.mood = "THINKING";
    result.triggerWords = matchedCurious;
    
    // If it's a specific question that sounds confusing to Buddy
    if (lower.includes("confused") || lower.includes("hard to") || lower.includes("don't know") || lower.includes("dont know") || lower.includes("clueless")) {
      result.activity = "confused";
      result.mood = "SURPRISED";
    }
    return result;
  }

  // 3. Check for sadness / empathy / worry
  const concernedWords = [
    "sad", "cry", "crying", "sob", "sorry", "unhappy", "hurt", "pain", "lonely",
    "scared", "afraid", "worried", "concern", "broke", "lost", "bad", "heavy"
  ];
  const matchedConcerned = concernedWords.filter(w => lower.includes(w));
  if (matchedConcerned.length > 0) {
    result.activity = "concerned";
    result.mood = "SAD";
    result.triggerWords = matchedConcerned;
    return result;
  }

  // 4. Check for frustration / anger
  const angryWords = [
    "angry", "mad", "annoy", "frustrat", "hate", "stupid", "dumb", "furious", "rage", "shut up"
  ];
  const matchedAngry = angryWords.filter(w => lower.includes(w));
  if (matchedAngry.length > 0) {
    result.activity = "confused"; // Soften angry reactions into slightly confused/concerned
    result.mood = "ANGRY";
    result.triggerWords = matchedAngry;
    return result;
  }

  // 5. Check for sleepy / cozy
  const sleepyWords = [
    "sleep", "sleepy", "tired", "dream", "cozy", "night", "bed", "exhausted", "rest", "yawns"
  ];
  const matchedSleepy = sleepyWords.filter(w => lower.includes(w));
  if (matchedSleepy.length > 0) {
    result.activity = "sleepy";
    result.mood = "SLEEPY";
    result.triggerWords = matchedSleepy;
    return result;
  }

  // 6. Check for pride or playful actions
  const playfulWords = [
    "joke", "haha", "hahaha", "lol", "funny", "game", "gaming", "play", "prank", "silly", "goofy"
  ];
  const matchedPlayful = playfulWords.filter(w => lower.includes(w));
  if (matchedPlayful.length > 0) {
    result.activity = "playful";
    result.mood = "EXCITED";
    result.triggerWords = matchedPlayful;
    return result;
  }

  // Default fallback if no keywords triggered
  result.activity = isUserText ? "listening" : "speaking";
  result.mood = "IDLE";
  return result;
}
