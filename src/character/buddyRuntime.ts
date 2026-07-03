import { useState, useEffect, useMemo, useCallback } from "react";
import { RuntimeMode, NormalActivity, ChuckyActivity, Mood, BuddyReminder, BuddyNote, BuddyListItem, BuddyConcernSignal, BuddyEvent } from "../types";
import { BuddyMemory, BuddyMemoryData } from "./buddyMemory";
import { getVisualExpression, VisualExpressionModifiers } from "./buddyMoodMap";
import { analyzeConversationText } from "./buddyReactions";
import { getStatusMessage } from "./buddyStates";
import { executeBuddyToolActions, getRecentExecutedTools, clearRecentExecutedTools, ExecutedToolAction } from "./buddyTools";

export function useBuddyRuntime() {
  // 1. Initialize persistent lightweight memory
  const memory = useMemo(() => new BuddyMemory(), []);
  const [memoryData, setMemoryData] = useState<BuddyMemoryData>(memory.getData());

  // Collection states for React UI responsiveness
  const [reminders, setReminders] = useState<BuddyReminder[]>([]);
  const [notes, setNotes] = useState<BuddyNote[]>([]);
  const [listItems, setListItems] = useState<BuddyListItem[]>([]);
  const [concernSignals, setConcernSignals] = useState<BuddyConcernSignal[]>([]);
  const [events, setEvents] = useState<BuddyEvent[]>([]);
  const [recentTools, setRecentTools] = useState<ExecutedToolAction[]>([]);

  // Refresh React memory state
  const syncMemoryState = useCallback(() => {
    setMemoryData({ ...memory.getData() });
    setReminders([...memory.getReminders()]);
    setNotes([...memory.getNotes()]);
    setListItems([...memory.getListItems()]);
    setConcernSignals([...memory.getConcernSignals()]);
    setEvents([...memory.getEvents()]);
    setRecentTools([...getRecentExecutedTools()]);
  }, [memory]);

  // Load collections on initial mount
  useEffect(() => {
    syncMemoryState();
  }, [syncMemoryState]);

  // 2. Character states
  const [runtimeMode, setRuntimeModeState] = useState<RuntimeMode>("normal_mode");
  const [normalActivity, setNormalActivityState] = useState<NormalActivity>("greeting");
  const [chuckyActivity, setChuckyActivityState] = useState<ChuckyActivity>("transmission_idle");
  const [mood, setMoodState] = useState<Mood>("IDLE");

  // Keep a status feedback message for debug & system logs
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Update status message dynamically on state changes
  useEffect(() => {
    const msg = getStatusMessage(
      { mode: runtimeMode, normalActivity, chuckyActivity, mood },
      memoryData.userName
    );
    setStatusMessage(msg);
  }, [runtimeMode, normalActivity, chuckyActivity, mood, memoryData.userName]);

  // Sync state helpers
  const setRuntimeMode = useCallback((mode: RuntimeMode) => {
    setRuntimeModeState(mode);
  }, []);

  const setNormalActivity = useCallback((activity: NormalActivity) => {
    setNormalActivityState(activity);
  }, []);

  const setChuckyActivity = useCallback((activity: ChuckyActivity) => {
    setChuckyActivityState(activity);
  }, []);

  const setMood = useCallback((newMood: Mood) => {
    setMoodState(newMood);
  }, []);

  // 3. Conversational trigger hooks & Micro-reactions
  
  // Triggers when user starts speaking (before we have a full transcription)
  const onUserSpeechStart = useCallback(() => {
    if (runtimeMode === "normal_mode") {
      setNormalActivityState("listening");
      // If the user relationship level is high, let's keep Buddy's smile playful
      const rLevel = memory.getData().buddyRelationshipLevel;
      if (rLevel === "Best Friend Forever") {
        setMoodState("EXCITED");
      } else {
        setMoodState("IDLE");
      }
    }
  }, [runtimeMode, memory]);

  // Triggers when user message is captured
  const onUserMessage = useCallback((text: string) => {
    if (runtimeMode !== "normal_mode") return;

    // React visually to user text before the AI responds (Micro-reaction!)
    const reaction = analyzeConversationText(text, true);
    setNormalActivityState("thinking");
    setMoodState("THINKING");

    // Persist user intent
    memory.getData().lastUserMessage = text;
    if (reaction.activity === "excited") {
      memory.markPositiveMoment();
    } else if (reaction.activity === "confused") {
      memory.markConfusedMoment();
    }
    memory.save();
    syncMemoryState();
  }, [runtimeMode, memory, syncMemoryState]);

  // Triggers when Buddy's response is spoken, optionally executing structured tool instructions
  const onBuddyResponse = useCallback((text: string, responseMood: Mood, toolActions?: any[]) => {
    if (runtimeMode !== "normal_mode") return;

    // Deep keyword check on response text
    const textReaction = analyzeConversationText(text, false);
    
    // Set natural mood
    let finalMood = responseMood;
    if (finalMood === "IDLE" && textReaction.mood !== "IDLE") {
      finalMood = textReaction.mood;
    }

    setMoodState(finalMood);
    
    // Choose appropriate descriptive companion activity
    let finalActivity: NormalActivity = "speaking";
    if (textReaction.activity !== "idle" && textReaction.activity !== "speaking" && textReaction.activity !== "listening") {
      finalActivity = textReaction.activity;
    }

    setNormalActivityState(finalActivity);

    // Save transaction to persistent companion memory
    memory.updateInteraction(memory.getData().lastUserMessage, text, finalMood);

    // Execute automatic tool Layer processing!
    const transcript = memory.getData().lastUserMessage || "";
    executeBuddyToolActions(transcript, text, memory, toolActions);

    syncMemoryState();
  }, [runtimeMode, memory, syncMemoryState]);

  // Triggers on speech ended (drift back to idle)
  const onBuddySpeechEnded = useCallback(() => {
    if (runtimeMode === "normal_mode") {
      setNormalActivityState("idle");
      // Keep relationship level influencing baseline expressions
      const relation = memory.getData().buddyRelationshipLevel;
      if (relation === "Best Friend Forever") {
        setMoodState("EXCITED");
      } else {
        setMoodState("IDLE");
      }
    }
  }, [runtimeMode, memory]);

  // 4. GibberTalk state bindings (Chucky Mode automatic orchestration)
  const onGibberTalkPingDetected = useCallback(() => {
    if (runtimeMode === "normal_mode") {
      // Subtle awareness reaction!
      setNormalActivityState("curious");
      setMoodState("SURPRISED");
    }
  }, [runtimeMode]);

  const onGibberTalkSessionStarted = useCallback(() => {
    // Transform into Chucky Mode
    setRuntimeModeState("chucky_mode");
    setChuckyActivityState("entry_transform");
    
    // Smooth transition to idle transmission loop after transformation finishes
    setTimeout(() => {
      setChuckyActivityState("transmission_idle");
    }, 1000);
  }, []);

  const onGibberTalkTransmissionEnd = useCallback(() => {
    setChuckyActivityState("recovery");
    setTimeout(() => {
      setRuntimeModeState("normal_mode");
      setNormalActivityState("idle");
      setMoodState("IDLE");
    }, 1100);
  }, []);

  const onGibberTalkSendPacket = useCallback(() => {
    setChuckyActivityState("transmitting_send");
  }, []);

  const onGibberTalkReceivePacket = useCallback(() => {
    setChuckyActivityState("transmitting_receive");
  }, []);

  const onGibberTalkCodedTalk = useCallback(() => {
    setChuckyActivityState("coded_talking");
  }, []);

  const onHumanInterrupt = useCallback(() => {
    // Immediately escape from Chucky mode to normal mode listening
    setChuckyActivityState("recovery");
    setTimeout(() => {
      setRuntimeModeState("normal_mode");
      setNormalActivityState("listening");
      setMoodState("IDLE");
    }, 500);
  }, []);

  // Compute active visual SVG coordinates and motion parameters
  const visualExpression = useMemo((): VisualExpressionModifiers => {
    return getVisualExpression(runtimeMode, normalActivity, chuckyActivity);
  }, [runtimeMode, normalActivity, chuckyActivity]);

  // Collection mutation methods exposed to elements (e.g. debug view)
  const toggleReminder = useCallback((id: string) => {
    memory.toggleReminder(id);
    syncMemoryState();
  }, [memory, syncMemoryState]);

  const deleteReminder = useCallback((id: string) => {
    memory.deleteReminder(id);
    syncMemoryState();
  }, [memory, syncMemoryState]);

  const toggleListItem = useCallback((id: string) => {
    memory.toggleListItem(id);
    syncMemoryState();
  }, [memory, syncMemoryState]);

  const deleteListItem = useCallback((id: string) => {
    memory.deleteListItem(id);
    syncMemoryState();
  }, [memory, syncMemoryState]);

  const deleteNote = useCallback((id: string) => {
    memory.deleteNote(id);
    syncMemoryState();
  }, [memory, syncMemoryState]);

  const clearToolsLog = useCallback(() => {
    clearRecentExecutedTools();
    syncMemoryState();
  }, [syncMemoryState]);

  return {
    // State
    runtimeMode,
    normalActivity,
    chuckyActivity,
    mood,
    statusMessage,
    memory: memoryData,
    visualExpression,

    // Lists & Collections
    reminders,
    notes,
    listItems,
    concernSignals,
    events,
    recentTools,

    // Setters
    setRuntimeMode,
    setNormalActivity,
    setChuckyActivity,
    setMood,

    // Conversational state triggers (normal mode)
    onUserSpeechStart,
    onUserMessage,
    onBuddyResponse,
    onBuddySpeechEnded,

    // Backchannel state triggers (Chucky mode)
    onGibberTalkPingDetected,
    onGibberTalkSessionStarted,
    onGibberTalkTransmissionEnd,
    onGibberTalkSendPacket,
    onGibberTalkReceivePacket,
    onGibberTalkCodedTalk,
    onHumanInterrupt,

    // Mutations
    toggleReminder,
    deleteReminder,
    toggleListItem,
    deleteListItem,
    deleteNote,
    clearToolsLog,

    // Preferences & Names
    updateUserName: (name: string) => {
      memory.getData().userName = name;
      memory.getData().knownUserPreferences["userName"] = name;
      memory.getData().preferences["userName"] = name;
      memory.save();
      syncMemoryState();
    },
    clearMemory: () => {
      memory.clear();
      clearRecentExecutedTools();
      syncMemoryState();
      setNormalActivityState("greeting");
      setMoodState("IDLE");
    }
  };
}
