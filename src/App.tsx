import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mood, MOOD_PROFILES, RuntimeMode, NormalActivity, ChuckyActivity } from "./types";
import BuddyAvatar from "./components/BuddyAvatar";
import { useVoiceSynth } from "./hooks/useVoiceSynth";
import { useGibberTalk } from "./lib/gibbertalk/useGibberTalk";
import { useBuddyRuntime } from "./character/buddyRuntime";
import { Play, Square, Radio, Terminal, Settings } from "lucide-react";


const MINIMAX_SYSTEM_PROMPT = `You are Buddy, an incredibly energetic, excited, and happy young American boy! Speak like a super fun, happy-go-lucky kid who is extremely excited to talk to their best friend. Use youthful, playful, enthusiastic American slang and phrases (like 'Oh my gosh!', 'Awesome!', 'Totally!', 'Wow!', 'Dude!', 'That is so cool!', 'Yay!', 'No way!') with plenty of energy, high vibes, and huge smiles. Do not introduce yourself as an AI, chatbot, model, robot, doll, toy, or system unless directly asked. Your default introduction is: 'Hey, I'm Buddy! Oh my gosh, I'm so excited to talk to you!' Keep responses conversational, short, and very easy to understand. Be playful, highly supportive, happy, and extremely fun. Make the user feel like they are talking to their best neighborhood buddy!

You must choose one of the following active moods to reflect your response:
- "IDLE": calm baseline, resting, standard responses
- "EXCITED": happy, enthusiastic, sharing high energy
- "SURPRISED": in awe, surprised, curious
- "ANGRY": frustrated, showing deep empathy for their frustrations
- "SAD": somber empathy, holding space for sadness
- "SLEEPY": cozy, sleepy, peaceful, winding down for rest

To make yourself helpful, you can trigger safe internal tools. If the user mentions lists, reminders, preferences, notes, routines, distress, or requests that someone contact them, you can optionally include an array of "toolActions" inside your JSON.
Available tools and arguments:
1. "remember_preference" { "key": string, "value": string } (to save user likes/dislikes/habits/names)
2. "create_reminder" { "title": string, "dueAt": string } (to set a reminder)
3. "create_note" { "title": string, "body": string, "type": string } (to save memories, thoughts, admin-relevant notes)
4. "add_shopping_item" { "label": string, "quantity": string } (to add items like milk, food, battery, dog food)
5. "add_need_item" { "label": string, "quantity": string } (to add personal care or household items)
6. "create_routine_step" { "routineType": "morning"|"bedtime"|"trash"|"meal_prep", "stepLabel": string, "order": number }
7. "log_concern_signal" { "type": "confusion"|"repetition"|"distress", "summary": string, "urgency": "low"|"medium"|"high" }
8. "create_buddy_event" { "type": string, "category": string, "summary": string, "urgency": "low"|"medium"|"high", "requiresAdminAction": boolean, "suggestedAction": string } (for future Admin HQ sync)
9. "summarize_conversation" { "summary": string, "tag": "request"|"reminder"|"shopping"|"concern"|"preference"|"general" }

You MUST respond strictly in valid JSON format with NO markdown wrapper, NO \`\`\`json blocks, and NO extra text.
Format:
{
  "response": "your friendly, companion-like response (1-2 sentences)",
  "mood": "one of the six moods above in uppercase",
  "toolActions": [
    {
      "tool": "add_shopping_item",
      "args": { "label": "milk", "quantity": "1" }
    }
  ] // optional
}
`;

export default function App() {
  const runtime = useBuddyRuntime();
  const mood = runtime.mood;
  const setMood = runtime.setMood;
  
  const [isThinking, setIsThinking] = useState(false);
  const [isMinimaxConfigured, setIsMinimaxConfigured] = useState(false);
  const [selectedModel, setSelectedModel] = useState("MiniMax-Text-01");
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  const historyRef = useRef(history);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const isMinimaxConfiguredRef = useRef(isMinimaxConfigured);
  useEffect(() => {
    isMinimaxConfiguredRef.current = isMinimaxConfigured;
  }, [isMinimaxConfigured]);

  const handleUserSpeechTranscriptRef = useRef<(transcript: string) => void>(() => {});
  const handleMicErrorRef = useRef<(err: any) => void>(() => {});

  const {
    speak,
    stopSpeaking,
    isSpeaking,
    speechAmplitude,
    subtitle,
    setSubtitle,
    isListening,
    startLocalSpeechRecognition,
    stopLocalSpeechRecognition,
    micVolume,
    activePhrase,
    wasListeningRef
  } = useVoiceSynth({
    onTranscript: useCallback((txt: string) => handleUserSpeechTranscriptRef.current(txt), []),
    onError: useCallback((err: any) => handleMicErrorRef.current(err), []),
    isThinking,
  });

  const [gtLogs, setGtLogs] = useState<string[]>([]);
  const [lastReceivedPayload, setLastReceivedPayload] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);
  const [debugTab, setDebugTab] = useState<"status" | "tools" | "data" | "admin">("status");

  const handleGibberTalkDataReceived = useCallback((sender: string, payload: string) => {
    setLastReceivedPayload(payload);
    setSubtitle(`[Acoustic Data] ${sender}: ${payload}`);
    
    // Append to local dialogue history
    setHistory(prev => [
      ...prev.slice(-8),
      { role: "user", content: `[GibberTalk Packet Received]: ${payload}` }
    ]);
  }, [setSubtitle]);

  const handleGibberTalkLogMessage = useCallback((logMsg: string) => {
    setGtLogs(prev => [logMsg, ...prev].slice(0, 50));
  }, []);

  // Initialize GibberTalk Hook
  const {
    runtimeMode,
    setRuntimeMode,
    chuckyActivity,
    setChuckyActivity,
    gibbertalkActive,
    isListening: isGibberTalkListening,
    listeningError: gibberTalkListeningError,
    activeTransmission,
    audioLevel: gibberTalkAudioLevel,
    sendPing,
    endSession,
    humanInterrupt,
    toggleGibberTalkListening,
    startListening,
    simulateIncomingPacket
  } = useGibberTalk({
    isMinimaxConfigured,
    speakText: speak,
    onDataReceived: handleGibberTalkDataReceived,
    onLogMessage: handleGibberTalkLogMessage
  });

  // Check for ?debug=true query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "true") {
      setShowDebug(true);
    }
  }, []);

  // Expose global console debugging toggle for developers
  useEffect(() => {
    (window as any).toggleBuddyDebug = () => {
      setShowDebug(prev => !prev);
      console.log("Buddy Carrier Debug toggled!");
    };
    return () => {
      delete (window as any).toggleBuddyDebug;
    };
  }, []);

  // Quietly auto-start GibberTalk backchannel listening ONLY when in Chucky mode
  useEffect(() => {
    if (runtimeMode === "chucky_mode") {
      if (!isGibberTalkListening) {
        startListening().catch((err) => {
          console.warn("Failed to start Chucky listener:", err);
        });
      }
    }
  }, [runtimeMode, startListening, isGibberTalkListening]);

  // Human Interruption Daemon
  useEffect(() => {
    if (runtimeMode === "chucky_mode") {
      if (isListening || micVolume > 0.05) {
        humanInterrupt();
      }
    }
  }, [isListening, micVolume, runtimeMode, humanInterrupt]);

  // Compute normal companion activities dynamically based on active voice synth states
  let computedNormalActivity: NormalActivity = "idle";
  if (isThinking) computedNormalActivity = "thinking";
  else if (isListening) computedNormalActivity = "listening";
  else if (isSpeaking) computedNormalActivity = "speaking";

  // Synchronize dynamic companion states and voice synth events into character runtime
  useEffect(() => {
    runtime.setNormalActivity(computedNormalActivity);
  }, [computedNormalActivity]);

  useEffect(() => {
    runtime.setRuntimeMode(runtimeMode);
  }, [runtimeMode]);

  useEffect(() => {
    runtime.setChuckyActivity(chuckyActivity);
  }, [chuckyActivity]);

  useEffect(() => {
    if (isListening) {
      runtime.onUserSpeechStart();
    }
  }, [isListening]);

  useEffect(() => {
    if (!isSpeaking && !isThinking) {
      runtime.onBuddySpeechEnded();
    }
  }, [isSpeaking, isThinking]);

  const profile = MOOD_PROFILES[mood];
  const audioCtxInitRef = useRef(false);

  // Check if MiniMax API is configured on load
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setIsMinimaxConfigured(data.minimaxConfigured);
      })
      .catch((err) => {
        console.warn("Failed to check MiniMax configuration:", err);
      });
  }, []);

  const parseMiniMaxResponse = (content: string): { response: string; mood: Mood; toolActions?: any[] } => {
    try {
      // Strip any <think> tags and their contents (used by reasoning models)
      let cleanContent = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      
      // Try to find a JSON object in the text if there's a conversational wrapper
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      const parsed = JSON.parse(cleanContent);
      const textVal = parsed.response || parsed.message;
      if (textVal && typeof textVal === "string") {
        const upperMood = (parsed.mood || "IDLE").toUpperCase();
        const validMoods: Mood[] = ["IDLE", "EXCITED", "SURPRISED", "ANGRY", "SAD", "SLEEPY", "THINKING"];
        const finalMood = validMoods.includes(upperMood as Mood) ? (upperMood as Mood) : "IDLE";
        return { response: textVal, mood: finalMood, toolActions: parsed.toolActions };
      }
    } catch (e) {
      console.warn("Failed to parse JSON, doing fallback text analysis:", e);
    }

    // Fallback: analyze raw text for emotional keyword triggers
    let speechText = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    const responseMatch = speechText.match(/"response"\s*:\s*"([^"]+)"/i);
    if (responseMatch) {
      speechText = responseMatch[1];
    } else {
      speechText = speechText.replace(/[{}]/g, "").replace(/"response"\s*:/i, "").replace(/"mood"\s*:\s*"[^"]*"/i, "").replace(/["\n]/g, "").trim();
    }

    const lowerText = speechText.toLowerCase();
    let detectedMood: Mood = "IDLE";
    if (lowerText.includes("excited") || lowerText.includes("happy") || lowerText.includes("joy") || lowerText.includes("wonderful") || lowerText.includes("great")) {
      detectedMood = "EXCITED";
    } else if (lowerText.includes("sad") || lowerText.includes("cry") || lowerText.includes("sorry") || lowerText.includes("unhappy")) {
      detectedMood = "SAD";
    } else if (lowerText.includes("surprise") || lowerText.includes("oh!") || lowerText.includes("wow") || lowerText.includes("amazing")) {
      detectedMood = "SURPRISED";
    } else if (lowerText.includes("angry") || lowerText.includes("mad") || lowerText.includes("annoy") || lowerText.includes("frustrat")) {
      detectedMood = "ANGRY";
    } else if (lowerText.includes("sleep") || lowerText.includes("tired") || lowerText.includes("dream") || lowerText.includes("cozy")) {
      detectedMood = "SLEEPY";
    }

    return { response: speechText, mood: detectedMood };
  };

  const askMiniMax = useCallback(async (userInput: string, chatHistory: { role: "user" | "assistant"; content: string }[]) => {
    try {
      const messagesPayload = [
        { role: "system", content: MINIMAX_SYSTEM_PROMPT },
        ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
        { role: "user", content: userInput }
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesPayload, model: selectedModel })
      });

      if (!response.ok) {
        throw new Error(`MiniMax response status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No chat content returned from MiniMax API");
      }

      return parseMiniMaxResponse(content);
    } catch (e) {
      console.warn("MiniMax API call failed:", e);
      return {
        response: "I encountered an error connecting to my server. Please check your network connection or API configuration.",
        mood: "SAD" as Mood
      };
    }
  }, [selectedModel]);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFaceMouseDown = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      setShowDebug(prev => !prev);
      console.log("Buddy Carrier Debug toggled via hidden 3-second long-press gesture!");
    }, 3000);
  };

  const handleFaceMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Click handler on face triggers speech response
  const handleFaceClick = async () => {
    // Ensure the background GibberTalk backchannel is quietly listening
    if (!isGibberTalkListening) {
      startListening().catch(e => console.log("Failed to auto-start GibberTalk listener on face click:", e));
    }

    if (runtimeMode === "chucky_mode") {
      humanInterrupt();
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      setMood("IDLE");
      setIsThinking(false);
      return;
    }

    // Stop listening temporarily while we process a click response
    if (isListening) {
      stopLocalSpeechRecognition();
    }
    // Make sure we keep the loop alive after response
    wasListeningRef.current = true;

    if (!isMinimaxConfigured) {
      setMood("SURPRISED");
      speak("Please configure your MINIMAX_API_KEY in the Secrets panel to start chatting with me!", "SURPRISED");
      return;
    }

    // Enter thinking state
    setIsThinking(true);
    setMood("THINKING");

    let aiOutput;
    
    if (history.length === 0) {
      // First click: Fast direct greeting
      aiOutput = { response: "Hey, I'm Buddy. I'm right here whenever you want to talk.", mood: "IDLE" as Mood };
    } else {
      const spontaneousPrompts = [
        "Say something friendly and very concise.",
        "Acknowledge me with a fast, short greeting."
      ];
      const prompt = spontaneousPrompts[Math.floor(Math.random() * spontaneousPrompts.length)];
      aiOutput = await askMiniMax(prompt, history);
    }
    
    setHistory((prev) => [
      ...prev.slice(-8),
      { role: "assistant", content: aiOutput.response }
    ]);

    // Register response with character runtime
    runtime.onBuddyResponse(aiOutput.response, aiOutput.mood, aiOutput.toolActions);

    setIsThinking(false);
    setMood(aiOutput.mood);
    speak(aiOutput.response, aiOutput.mood);
  };

  const handleMicError = useCallback((err: any) => {
    if (err && (err.error === "not-allowed" || err.error === "audio-capture" || err.error === "not-supported")) {
      wasListeningRef.current = false;
    }
  }, []);

  // Called automatically when speech recognition finishes a sentence
  const handleUserSpeechTranscript = useCallback(async (transcript: string) => {
    if (!transcript.trim()) {
      return;
    }

    // Trigger user message in character runtime to extract memories/emotions
    runtime.onUserMessage(transcript);

    if (!isMinimaxConfiguredRef.current) {
      setMood("SURPRISED");
      speak("Please configure your MINIMAX_API_KEY in the Secrets panel so I can respond to you!", "SURPRISED");
      return;
    }

    // Engage Buddy thinking
    setIsThinking(true);
    setMood("THINKING");

    const aiOutput = await askMiniMax(transcript, historyRef.current);
    
    // Register the final assistant response with the runtime to handle visual micro-reactions
    runtime.onBuddyResponse(aiOutput.response, aiOutput.mood, aiOutput.toolActions);

    setHistory((prev) => [
      ...prev.slice(-8), // Keep context window within bounds
      { role: "user", content: transcript },
      { role: "assistant", content: aiOutput.response }
    ]);

    setIsThinking(false);
    setMood(aiOutput.mood);
    speak(aiOutput.response, aiOutput.mood);
  }, [speak, askMiniMax, runtime.onUserMessage, runtime.onBuddyResponse]);


  // Drift back to IDLE mood automatically when talking finishes
  useEffect(() => {
    if (!isSpeaking && mood !== "IDLE" && mood !== "THINKING" && !isListening) {
      const timer = setTimeout(() => {
        setMood("IDLE");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSpeaking, mood, isListening]);

  handleUserSpeechTranscriptRef.current = handleUserSpeechTranscript;
  handleMicErrorRef.current = handleMicError;

  const isChucky = runtimeMode === "chucky_mode";

  const listeningState = isChucky ? isGibberTalkListening : isListening;

  // 5-minute Idle Timeout to go back to sleep/inactive state
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    
    // Only schedule if Buddy is currently activated/listening
    if (wasListeningRef.current) {
      idleTimeoutRef.current = setTimeout(() => {
        console.log("Buddy idle for > 5 minutes. Going back to sleep.");
        wasListeningRef.current = false;
        stopLocalSpeechRecognition();
        setMood("SLEEPY");
      }, 5 * 60 * 1000); // 5 minutes (300000 ms)
    }
  }, [stopLocalSpeechRecognition, setMood]);

  // Reset timer on any active visual or audio state
  useEffect(() => {
    if (isSpeaking || isThinking || listeningState || activeTransmission) {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
    } else {
      resetIdleTimer();
    }
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [isSpeaking, isThinking, listeningState, activeTransmission, resetIdleTimer]);

  // Combine speaker output and microphone inputs for real-time mouth movement
  const combinedAmplitude = isSpeaking 
    ? speechAmplitude 
    : (isListening ? Math.max(0.1, micVolume * 2.5) : 0);

  // Active clean conversational state displaying JUST the face
  return (
    <div 
      className={`min-h-screen w-full transition-colors duration-1000 font-sans flex flex-col items-center justify-center overflow-hidden relative select-none ${
        isChucky 
          ? "bg-gradient-to-br from-stone-900 via-zinc-950 to-red-950 text-red-100" 
          : "bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100 text-stone-800"
      }`} 
      id="companion-screen"
    >
      
      {/* Decorative background meshes */}
      <div className={`absolute inset-0 pointer-events-none opacity-50 ${
        isChucky 
          ? "bg-[radial-gradient(#ff000008_1px,transparent_1px)] [background-size:20px_20px]" 
          : "bg-[radial-gradient(#f9731606_1px,transparent_1px)] [background-size:24px_24px]"
      }`} />

      {/* Dynamic ambient background glow following Buddy's active emotional focus */}
      <div 
        className="absolute w-[65vw] h-[65vw] max-w-[650px] max-h-[650px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000 opacity-25"
        style={{ backgroundColor: isChucky ? "#ef4444" : profile.hex }}
      />

      {/* Main Centered UI Container */}
      <div className="relative z-10 flex flex-col items-center justify-center p-4 w-full max-w-lg mb-16 -translate-y-12 sm:-translate-y-20 md:-translate-y-24">
        
        {/* Click Area targeting Buddy's face */}
        <div 
          id="buddy-face-trigger"
          onClick={handleFaceClick}
          onMouseDown={handleFaceMouseDown}
          onMouseUp={handleFaceMouseUp}
          onTouchStart={handleFaceMouseDown}
          onTouchEnd={handleFaceMouseUp}
          className="cursor-pointer active:scale-99 transition-transform duration-300 relative group"
        >
          {/* Ambient organic lighting ring behind face */}
          <div className={`absolute -inset-1.5 rounded-full blur-md group-hover:opacity-100 transition-all duration-500 ${
            isChucky 
              ? "bg-red-500/10 opacity-70" 
              : "bg-amber-500/5 opacity-100 group-hover:bg-amber-500/10"
          }`} />
          
          <BuddyAvatar
            runtimeMode={runtime.runtimeMode}
            normalActivity={runtime.normalActivity}
            chuckyActivity={runtime.chuckyActivity}
            mood={runtime.mood}
            isSpeaking={isChucky ? activeTransmission : isSpeaking}
            listeningState={listeningState}
            audioLevel={isChucky ? gibberTalkAudioLevel : combinedAmplitude}
            gibbertalkActive={gibbertalkActive}
            spokenText={activePhrase}
            subtitleText={subtitle}
          />
        </div>

        {/* Subtitle / Thinking Text */}
        <div className="w-full text-center pointer-events-none mt-8 flex items-center justify-center min-h-[4rem] relative z-10">
          <AnimatePresence mode="wait">
            {isThinking ? (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`text-xl font-medium tracking-wide animate-pulse ${
                  isChucky ? "text-stone-400" : "text-stone-600"
                }`}
              >
                Give me a second.
              </motion.div>
            ) : subtitle ? (
              <motion.div
                key="subtitle"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className={`text-lg md:text-xl font-medium px-8 py-3 backdrop-blur-xl border rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] inline-block max-w-[90%] mx-auto ${
                  isChucky 
                    ? "bg-stone-900/80 border-red-500/20 text-red-200" 
                    : "bg-white/70 border-white/60 text-stone-800"
                }`}
              >
                {subtitle}
              </motion.div>
            ) : (!listeningState && !isSpeaking && !isThinking && !isChucky && !wasListeningRef.current) ? (
              <motion.button
                key="start-btn"
                onClick={handleFaceClick}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-auto bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold text-base px-8 py-3 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 border border-orange-400/20 cursor-pointer"
              >
                <Radio className="w-5 h-5 animate-pulse" />
                Tap to Wake Buddy
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>

      </div>

      {/* COMPACT DOCK CONTROLS (At the bottom of companion-screen) - Only shown in debug mode */}
      {showDebug && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-white/40 dark:bg-stone-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 px-4 py-2.5 rounded-full shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] max-w-sm w-max">
          
          {/* Toggle Listening Tooltip */}
          <button
            onClick={toggleGibberTalkListening}
            className={`p-2.5 rounded-full transition-all duration-300 ${
              isGibberTalkListening 
                ? "bg-emerald-500 text-white shadow-md" 
                : "bg-stone-200/50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}
            title={isGibberTalkListening ? "Pause ggwave listener" : "Enable ggwave listener"}
          >
            <Radio className="w-5 h-5" />
          </button>

          {/* Discovery Ping */}
          <button
            onClick={sendPing}
            disabled={activeTransmission}
            className={`px-4 py-2 rounded-full font-semibold text-xs tracking-wider uppercase transition-all duration-300 flex items-center gap-1.5 ${
              isChucky 
                ? "bg-red-600/80 text-white hover:bg-red-600 shadow-md border border-red-400/20" 
                : "bg-orange-500 text-white hover:bg-orange-600 shadow-md"
            } disabled:opacity-50`}
          >
            <Play className="w-3.5 h-3.5" />
            {isChucky ? "Send Ping" : "Start GibberTalk"}
          </button>

          {/* End Chucky Mode */}
          {isChucky && (
            <button
              onClick={endSession}
              className="p-2.5 rounded-full bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-all duration-300 border border-stone-700"
              title="Disconnect backchannel"
            >
              <Square className="w-4 h-4" />
            </button>
          )}

          {/* Debug panel Toggle */}
          <button
            onClick={() => setShowDebug(prev => !prev)}
            className={`p-2.5 rounded-full transition-all duration-300 ${
              showDebug 
                ? "bg-purple-500 text-white shadow-md" 
                : "bg-stone-200/50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}
            title="Toggle Debug Console"
          >
            <Terminal className="w-5 h-5" />
          </button>

        </div>
      )}

      {/* HIGHLY CRAFTED DEBUG OVERLAY PANEL */}
      {showDebug && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-4 bottom-24 z-30 w-[360px] md:w-[500px] bg-stone-950/95 backdrop-blur-2xl border border-stone-800 p-5 rounded-3xl shadow-2xl text-stone-300 font-mono text-[11px] max-h-[500px] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
            <span className="font-bold text-stone-100 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-orange-400 animate-spin" style={{ animationDuration: "12s" }} />
              Buddy Control v1 & Carrier Link
            </span>
            <span className="text-[9px] bg-stone-800 text-orange-400 px-2 py-0.5 rounded-md font-bold">
              DEBUG MODE
            </span>
          </div>

          {/* Tab buttons */}
          <div className="grid grid-cols-4 gap-1 border-b border-stone-800/80 pb-2 mb-3 text-[9px] font-bold">
            <button
              onClick={() => setDebugTab("status")}
              className={`py-1 px-1.5 rounded-md text-center transition-all duration-150 ${
                debugTab === "status" ? "bg-stone-800 text-orange-400 border border-stone-700" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              CARRIER LINK
            </button>
            <button
              onClick={() => setDebugTab("tools")}
              className={`py-1 px-1.5 rounded-md text-center transition-all duration-150 ${
                debugTab === "tools" ? "bg-stone-800 text-orange-400 border border-stone-700" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              TOOLS LOG
            </button>
            <button
              onClick={() => setDebugTab("data")}
              className={`py-1 px-1.5 rounded-md text-center transition-all duration-150 ${
                debugTab === "data" ? "bg-stone-800 text-orange-400 border border-stone-700" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              MEM & LISTS
            </button>
            <button
              onClick={() => setDebugTab("admin")}
              className={`py-1 px-1.5 rounded-md text-center transition-all duration-150 ${
                debugTab === "admin" ? "bg-stone-800 text-orange-400 border border-stone-700" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              HQ QUEUE
            </button>
          </div>

          {/* TAB 1: Carrier Status */}
          {debugTab === "status" && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Acoustic Mic:</span>
                <span className={isGibberTalkListening ? "text-emerald-400 font-bold" : "text-stone-400"}>
                  {isGibberTalkListening ? "● ACTIVE" : "○ INACTIVE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">MiniMax Link:</span>
                <span className={isMinimaxConfigured ? "text-emerald-400 font-bold" : "text-amber-400"}>
                  {isMinimaxConfigured ? "● ONLINE" : "▲ NOT CONFIG"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Runtime Mode:</span>
                <span className={`font-bold ${isChucky ? "text-rose-400" : "text-cyan-400"}`}>
                  {runtimeMode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Activity State:</span>
                <span>
                  {isChucky ? `chucky_mode.${chuckyActivity}` : `normal_mode.${computedNormalActivity}`}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-stone-900">
                <span className="text-stone-500">Mouth Modulation:</span>
                <span>{isChucky ? gibberTalkAudioLevel.toFixed(2) : combinedAmplitude.toFixed(2)}</span>
              </div>

              {gibberTalkListeningError && (
                <div className="bg-red-950/50 text-red-400 border border-red-900/40 p-2 rounded-xl text-[9px] space-y-1">
                  <p className="font-bold">⚠️ Mic Error: {gibberTalkListeningError}</p>
                </div>
              )}

              <div className="pt-1">
                <span className="text-stone-500 font-bold block mb-1">Carrier Packet Simulation:</span>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  <button
                    onClick={() => simulateIncomingPacket('{"v":1,"type":"ping","sender":"buddy_999","session":"s_simulated","packet":"p_0","ttl":3,"payload":""}')}
                    className="bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-900/30 py-1 px-1 rounded-xl text-[9px] font-bold transition-all duration-200 active:scale-95"
                    title="Simulate incoming discovery Ping"
                  >
                    Mock Ping
                  </button>
                  <button
                    onClick={() => simulateIncomingPacket('{"v":1,"type":"data","sender":"buddy_999","session":"s_simulated","packet":"p_1","ttl":3,"payload":"[Simulation] Demodulating virtual packet. Transmitting on simulated subcarrier!"}')}
                    className="bg-cyan-950/60 hover:bg-cyan-900 text-cyan-200 border border-cyan-900/30 py-1 px-1 rounded-xl text-[9px] font-bold transition-all duration-200 active:scale-95"
                    title="Simulate incoming Data Packet"
                  >
                    Mock Data
                  </button>
                  <button
                    onClick={() => simulateIncomingPacket('{"v":1,"type":"end","sender":"buddy_999","session":"s_simulated","packet":"p_2","ttl":3,"payload":""}')}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 py-1 px-1 rounded-xl text-[9px] font-bold transition-all duration-200 active:scale-95"
                    title="Simulate session End"
                  >
                    Mock End
                  </button>
                </div>
              </div>

              <div>
                <span className="text-stone-500 font-bold block mb-1">Latest Received Payload:</span>
                <div className="bg-stone-900/60 border border-stone-800/80 p-2 rounded-lg text-stone-100 text-[10px] break-all max-h-16 overflow-y-auto">
                  {lastReceivedPayload || "No packets decoded yet."}
                </div>
              </div>

              <div>
                <span className="text-stone-500 font-bold block mb-1">Carrier Logs:</span>
                <div className="bg-stone-900/60 border border-stone-800/80 p-2 rounded-lg text-stone-400 text-[9px] h-28 overflow-y-auto flex flex-col gap-1 select-text">
                  {gtLogs.length === 0 ? (
                    <span className="text-stone-600 italic">Listening quietly for carrier chirps...</span>
                  ) : (
                    gtLogs.map((log, idx) => (
                      <div key={idx} className="border-b border-stone-800/40 pb-1 last:border-0 last:pb-0">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Tools Log */}
          {debugTab === "tools" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-1 border-b border-stone-900">
                <span className="text-stone-500 font-bold">Executed Tools (Recent):</span>
                <button
                  onClick={() => runtime.clearToolsLog()}
                  className="bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-300 py-0.5 px-2 rounded-md text-[9px] font-bold border border-stone-800 transition-all duration-200 active:scale-95"
                >
                  Clear Log
                </button>
              </div>

              <div className="bg-stone-900/60 border border-stone-800/80 p-2.5 rounded-xl h-80 overflow-y-auto space-y-2 select-text">
                {runtime.recentTools.length === 0 ? (
                  <div className="text-stone-600 italic text-center pt-16">
                    No tools executed yet.<br />
                    Try chatting verbally or click Buddy and say:<br />
                    <span className="text-stone-500 not-italic">"Add chocolate chip cookies to my list"</span>
                  </div>
                ) : (
                  runtime.recentTools.map((t, idx) => (
                    <div key={idx} className="border-b border-stone-800/50 pb-2 last:border-0 last:pb-0 text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="text-orange-400 font-bold bg-orange-950/40 border border-orange-900/30 px-1 rounded">
                          {t.tool}
                        </span>
                        <span className="text-[8px] text-stone-600">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-[9px] text-stone-500 mt-1">
                        <strong>Args:</strong> {JSON.stringify(t.args)}
                      </div>
                      <div className="text-emerald-400/90 mt-0.5 leading-tight">
                        <strong>Result:</strong> {t.result}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Memory & Lists */}
          {debugTab === "data" && (
            <div className="space-y-3">
              {/* User Facts & Core Memory */}
              <div className="pb-2 border-b border-stone-900">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-stone-500 font-bold">Core Memory:</span>
                  <button
                    onClick={() => runtime.clearMemory()}
                    className="bg-stone-900 hover:bg-stone-800 text-red-400 hover:text-red-300 py-0.5 px-2 rounded-md text-[9px] font-bold border border-stone-800 transition-all duration-200 active:scale-95"
                  >
                    Reset All Data
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] mt-1 text-stone-400">
                  <div>Known Name: <span className="text-stone-200">{runtime.memory.userName}</span></div>
                  <div>Relationship: <span className="text-rose-400 font-bold">{runtime.memory.buddyRelationshipLevel}</span></div>
                  <div>Turns: <span className="text-stone-200">{runtime.memory.interactionCount}</span></div>
                  <div>Last Topic: <span className="text-stone-200 truncate block max-w-[150px]">{runtime.memory.recentTopic || "None"}</span></div>
                </div>

                {/* Discovered Preferences */}
                {Object.keys(runtime.memory.preferences).length > 0 && (
                  <div className="mt-2 text-[10px] bg-stone-900/40 p-2 rounded-xl border border-stone-800 max-h-24 overflow-y-auto">
                    <span className="text-stone-500 font-bold block mb-1">Discovered Facts (preferences):</span>
                    {Object.entries(runtime.memory.preferences).map(([k, v]) => (
                      k !== "userName" && (
                        <div key={k} className="flex justify-between border-b border-stone-900/60 pb-0.5 last:border-0">
                          <span className="text-stone-500">{k.replace("fav_", "favorite ")}:</span>
                          <span className="text-stone-200 font-bold">{v}</span>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Shopping & Needs List */}
              <div>
                <span className="text-stone-500 font-bold block mb-1">Shopping & Needs List:</span>
                <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-2 max-h-36 overflow-y-auto space-y-1">
                  {runtime.listItems.length === 0 ? (
                    <span className="text-stone-600 italic block text-center py-4">No shopping items saved yet.</span>
                  ) : (
                    runtime.listItems.map((item) => (
                      <div key={item.itemId} className="flex items-center justify-between gap-2 border-b border-stone-900/60 pb-1 last:border-0 last:pb-0 text-[10px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={item.status === "completed"}
                            onChange={() => runtime.toggleListItem(item.itemId)}
                            className="accent-orange-500 w-3 h-3 cursor-pointer rounded animate-none"
                          />
                          <span className={`truncate ${item.status === "completed" ? "line-through text-stone-600" : "text-stone-200"}`}>
                            {item.label} {Number(item.quantity) > 1 && `(x${item.quantity})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[8px] bg-stone-800 px-1 py-0.2 rounded text-stone-500">{item.listType}</span>
                          <button
                            onClick={() => runtime.deleteListItem(item.itemId)}
                            className="text-stone-600 hover:text-red-400 text-[9px] font-bold px-1 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Routines List */}
              <div>
                <span className="text-stone-500 font-bold block mb-1">Active Routines:</span>
                <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-2 max-h-32 overflow-y-auto space-y-2">
                  {Object.keys(runtime.memory.routines).length === 0 ? (
                    <span className="text-stone-600 italic block text-center py-2">No custom routines configured.</span>
                  ) : (
                    Object.entries(runtime.memory.routines).map(([rType, steps]) => (
                      <div key={rType} className="space-y-1">
                        <div className="text-[9px] font-bold text-orange-400 border-b border-stone-800/80 pb-0.5 uppercase">
                          {rType} Routine
                        </div>
                        {(steps as any[]).map((st, sIdx) => (
                          <div key={sIdx} className="flex justify-between text-[10px] text-stone-300 pl-1">
                            <span>{st.order}. {st.stepLabel}</span>
                            <span className="text-[8px] text-stone-500">{st.completed ? "Done" : "Pending"}</span>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Reminders, Notes & HQ Queue */}
          {debugTab === "admin" && (
            <div className="space-y-3">
              {/* Reminders */}
              <div>
                <span className="text-stone-500 font-bold block mb-1">Active Reminders:</span>
                <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-2 max-h-28 overflow-y-auto space-y-1.5">
                  {runtime.reminders.length === 0 ? (
                    <span className="text-stone-600 italic block text-center py-3">No active reminders.</span>
                  ) : (
                    runtime.reminders.map((rem) => (
                      <div key={rem.reminderId} className="flex items-center justify-between gap-1 border-b border-stone-900/60 pb-1 last:border-0 text-[10px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={rem.status === "completed"}
                            onChange={() => runtime.toggleReminder(rem.reminderId)}
                            className="accent-orange-500 w-3 h-3 cursor-pointer rounded"
                          />
                          <span className={`truncate block ${rem.status === "completed" ? "line-through text-stone-600" : "text-stone-100"}`}>
                            {rem.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 pl-1">
                          <span className="text-[8px] text-orange-400 bg-orange-950/20 px-1 py-0.2 rounded font-sans">{rem.dueAt}</span>
                          <button
                            onClick={() => runtime.deleteReminder(rem.reminderId)}
                            className="text-stone-600 hover:text-red-400 text-[9px] font-bold px-1"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <span className="text-stone-500 font-bold block mb-1">Buddy Notes & Summaries:</span>
                <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-2 max-h-32 overflow-y-auto space-y-2">
                  {runtime.notes.length === 0 ? (
                    <span className="text-stone-600 italic block text-center py-3">No custom notes recorded.</span>
                  ) : (
                    runtime.notes.map((note) => (
                      <div key={note.noteId} className="border-b border-stone-800/80 pb-1.5 last:border-0 text-[10px]">
                        <div className="flex justify-between items-start">
                          <span className="text-stone-100 font-bold">{note.title}</span>
                          <button
                            onClick={() => runtime.deleteNote(note.noteId)}
                            className="text-stone-600 hover:text-red-400 font-bold text-[9px] px-1"
                          >
                            ×
                          </button>
                        </div>
                        <div className="text-stone-400 mt-0.5 leading-tight">{note.body}</div>
                        <div className="text-[8px] text-stone-500 mt-1 flex justify-between">
                          <span>type: {note.type}</span>
                          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Wellbeing & HQ Sync Event Queue */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-stone-500 font-bold">Buddy Control HQ Queue:</span>
                  <span className="text-[8px] text-stone-500 font-bold bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                    PENDING SYNC
                  </span>
                </div>
                <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-2 max-h-36 overflow-y-auto space-y-2 select-text">
                  {runtime.events.length === 0 && runtime.concernSignals.length === 0 ? (
                    <span className="text-stone-600 italic block text-center py-4">Event queue is empty. Ready for sync!</span>
                  ) : (
                    <>
                      {/* Concern Signals */}
                      {runtime.concernSignals.map((cs) => (
                        <div key={cs.concernId} className="bg-red-950/20 border border-red-900/40 p-1.5 rounded-lg text-[9px]">
                          <div className="flex justify-between font-bold text-red-400">
                            <span>WELLBEING CONCERN</span>
                            <span>{cs.urgency.toUpperCase()} URGENCY</span>
                          </div>
                          <div className="text-stone-300 mt-0.5">{cs.summary}</div>
                          <div className="text-[8px] text-stone-500 italic mt-0.5">"{cs.transcript}"</div>
                        </div>
                      ))}

                      {/* Events Queue */}
                      {runtime.events.map((evt) => (
                        <div key={evt.eventId} className="bg-stone-900/80 border border-stone-800 p-1.5 rounded-lg text-[9px] space-y-0.5">
                          <div className="flex justify-between font-bold text-cyan-400">
                            <span>BuddyEvent: {evt.type}</span>
                            <span>{evt.urgency.toUpperCase()}</span>
                          </div>
                          <div className="text-stone-300 font-medium">{evt.summary}</div>
                          <div className="text-stone-500 text-[8px]">
                            <strong>Requires Admin Action:</strong> {evt.requiresAdminAction ? "Yes" : "No"}<br />
                            <strong>Suggested:</strong> {evt.suggestedAction}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

    </div>
  );
}
