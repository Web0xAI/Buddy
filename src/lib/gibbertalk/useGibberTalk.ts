import { useState, useEffect, useRef, useCallback } from "react";
import { RuntimeMode, NormalActivity, ChuckyActivity, Mood } from "../../types";
import { GibberTalkAudio } from "./GibberTalkAudio";
import { GibberTalkPacket, PacketType } from "./packetTypes";
import { DEFAULT_CONFIG, createPacket, generateId } from "./protocol";

interface UseGibberTalkProps {
  onDataReceived?: (sender: string, payload: string) => void;
  onLogMessage?: (log: string) => void;
  isMinimaxConfigured: boolean;
  speakText: (text: string, mood: Mood) => void;
}

export function useGibberTalk({ onDataReceived, onLogMessage, isMinimaxConfigured, speakText }: UseGibberTalkProps) {
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>("normal_mode");
  const [normalActivity, setNormalActivity] = useState<NormalActivity>("idle");
  const [chuckyActivity, setChuckyActivity] = useState<ChuckyActivity>("transmission_idle");
  const [gibbertalkActive, setGibbertalkActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState<string | null>(null);
  const [activeTransmission, setActiveTransmission] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioRef = useRef<GibberTalkAudio | null>(null);
  const senderIdRef = useRef<string>(DEFAULT_CONFIG.senderId);
  const sessionIdRef = useRef<string>("");
  const currentStepRef = useRef<number>(0);
  const isBroadcastingRef = useRef<boolean>(false);
  const cooldownRef = useRef<boolean>(false);

  const log = useCallback((msg: string) => {
    console.log(`[GibberTalk] ${msg}`);
    if (onLogMessage) onLogMessage(msg);
  }, [onLogMessage]);

  // Read real-time audio amplitudes for mouth vibration when chirps play
  useEffect(() => {
    let animationFrameId: number;
    const updateLevels = () => {
      if (audioRef.current && activeTransmission) {
        const analyser = audioRef.current.getAnalyser();
        if (analyser) {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteTimeDomainData(dataArray);

          // Calculate RMS amplitude
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / bufferLength);
          // Scale for mouth visibility
          setAudioLevel(Math.min(1.5, rms * 8));
        }
      } else {
        setAudioLevel(0);
      }
      animationFrameId = requestAnimationFrame(updateLevels);
    };

    updateLevels();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTransmission]);

  const stopActiveChirps = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.stopChirp();
    }
    setActiveTransmission(false);
    isBroadcastingRef.current = false;
  }, []);

  const transmitPacket = useCallback(async (packet: GibberTalkPacket): Promise<boolean> => {
    if (!audioRef.current) return false;
    stopActiveChirps();

    setActiveTransmission(true);
    isBroadcastingRef.current = true;
    
    // Set visual sending state based on packet type
    if (runtimeMode === "chucky_mode") {
      setChuckyActivity("transmitting_send");
    }

    const payloadStr = JSON.stringify(packet);
    log(`TX (${packet.type}): ${payloadStr.substring(0, 80)}...`);
    
    const success = await audioRef.current.playChirp(payloadStr);
    
    setActiveTransmission(false);
    isBroadcastingRef.current = false;

    if (runtimeMode === "chucky_mode" && success) {
      setChuckyActivity("transmission_idle");
    }

    return success;
  }, [log, runtimeMode, stopActiveChirps]);

  const triggerHandshakeStep = useCallback(async (type: PacketType, session: string) => {
    if (cooldownRef.current) return;
    
    const packet = createPacket(senderIdRef.current, type, session, "", true);
    await transmitPacket(packet);
  }, [transmitPacket]);

  // Initiate discovery ping
  const sendPing = useCallback(async () => {
    log("Manually initiating discovery ping...");
    const session = generateId("s_");
    sessionIdRef.current = session;
    setRuntimeMode("chucky_mode");
    setChuckyActivity("entry_transform");

    setTimeout(async () => {
      setChuckyActivity("transmission_idle");
      await triggerHandshakeStep("ping", session);
    }, 900);
  }, [log, triggerHandshakeStep]);

  // Terminate session
  const endSession = useCallback(async () => {
    log("Ending GibberTalk session.");
    if (runtimeMode === "chucky_mode") {
      const packet = createPacket(senderIdRef.current, "end", sessionIdRef.current);
      await transmitPacket(packet);
      
      setChuckyActivity("recovery");
      setTimeout(() => {
        setRuntimeMode("normal_mode");
        setNormalActivity("idle");
        setGibbertalkActive(false);
        sessionIdRef.current = "";
      }, 1100);
    }
  }, [log, transmitPacket, runtimeMode]);

  // Handle human interruption
  const humanInterrupt = useCallback(() => {
    if (runtimeMode === "chucky_mode") {
      log("HUMAN INTERRUPTED: Emergency exit from Chucky Mode!");
      stopActiveChirps();
      
      setChuckyActivity("recovery");
      setTimeout(() => {
        setRuntimeMode("normal_mode");
        setNormalActivity("listening");
        setGibbertalkActive(false);
        sessionIdRef.current = "";
      }, 500);
    }
  }, [log, runtimeMode, stopActiveChirps]);

  // Process received packets
  const handleInboundPacket = useCallback(async (rawText: string) => {
    if (isBroadcastingRef.current) {
      log("Ignoring inbound audio: We are currently broadcasting.");
      return;
    }

    log(`RX raw: "${rawText.substring(0, 100)}..."`);

    let packet: GibberTalkPacket;
    try {
      packet = JSON.parse(rawText);
    } catch (e) {
      // Fallback: raw text from legacy/simplified sender
      log("Raw text received (non-JSON), wrapping into a virtual data packet...");
      packet = {
        v: 1,
        type: "data",
        sender: "unknown_sender",
        session: sessionIdRef.current || "ambient_session",
        packet: "raw_p",
        ttl: 1,
        payload: rawText
      };
    }

    // Ignore packets from ourselves
    if (packet.sender === senderIdRef.current) {
      log("Ignoring packet sent by ourselves.");
      return;
    }

    // Process packet types
    switch (packet.type) {
      case "ping":
        log(`Ping received from ${packet.sender}. Preparing pong response...`);
        sessionIdRef.current = packet.session;
        setRuntimeMode("chucky_mode");
        setChuckyActivity("entry_transform");
        setGibbertalkActive(true);

        setTimeout(async () => {
          setChuckyActivity("transmitting_send");
          const pong = createPacket(senderIdRef.current, "pong", packet.session);
          await transmitPacket(pong);
        }, 900);
        break;

      case "pong":
        log(`Pong received from ${packet.sender}. Establising session Hello...`);
        if (packet.session === sessionIdRef.current) {
          setChuckyActivity("transmitting_send");
          const hello = createPacket(senderIdRef.current, "hello", packet.session);
          await transmitPacket(hello);
        }
        break;

      case "hello":
        log(`Hello received from ${packet.sender}. Sending session Ack...`);
        sessionIdRef.current = packet.session;
        setGibbertalkActive(true);
        setChuckyActivity("transmitting_send");
        const ack = createPacket(senderIdRef.current, "ack", packet.session);
        await transmitPacket(ack);
        break;

      case "ack":
        log(`Ack received from ${packet.sender}. Session fully established!`);
        setGibbertalkActive(true);
        setChuckyActivity("transmission_idle");
        break;

      case "data":
        log(`Data payload received from ${packet.sender}: ${packet.payload}`);
        setChuckyActivity("coded_talking");
        
        // Trigger visual speech-burst mouth movement
        if (onDataReceived) {
          onDataReceived(packet.sender, packet.payload);
        }

        // Auto-ack data packets
        const dataAck = createPacket(senderIdRef.current, "ack", packet.session);
        await transmitPacket(dataAck);
        break;

      case "end":
        log(`Session End command received from ${packet.sender}. Recovering...`);
        setChuckyActivity("recovery");
        setTimeout(() => {
          setRuntimeMode("normal_mode");
          setNormalActivity("idle");
          setGibbertalkActive(false);
          sessionIdRef.current = "";
        }, 1100);
        break;

      case "error":
        log(`Error packet from ${packet.sender}: ${packet.payload}`);
        setChuckyActivity("transmission_error");
        setTimeout(() => {
          setChuckyActivity("transmission_idle");
        }, 3000);
        break;

      default:
        log(`Unknown packet type: ${packet.type}`);
        break;
    }
  }, [log, transmitPacket, onDataReceived]);

  // Setup the GibberTalk audio stream
  const startListening = useCallback(async () => {
    if (!audioRef.current) return false;
    setListeningError(null);
    const success = await audioRef.current.startListening();
    if (success) {
      setIsListening(true);
      log("Acoustic carrier listener is active.");
    } else {
      const errMsg = "Microphone device not found or permission denied.";
      setListeningError(errMsg);
      log(`Failed to start acoustic listener: ${errMsg}`);
    }
    return success;
  }, [log]);

  const stopListening = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.stopListening();
    }
    setIsListening(false);
    setListeningError(null);
    log("Acoustic carrier listener stopped.");
  }, [log]);

  const toggleGibberTalkListening = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Manual simulation injection
  const simulateIncomingPacket = useCallback((payload: string) => {
    log(`[MOCK] Simulated Inbound: "${payload}"`);
    handleInboundPacket(payload);
  }, [log, handleInboundPacket]);

  // Initialize
  useEffect(() => {
    const audio = new GibberTalkAudio();
    audioRef.current = audio;
    audio.onMessage = handleInboundPacket;
    audio.onInterrupted = () => {
      log("Audio stream was physically interrupted.");
    };

    audio.init().catch((err) => {
      console.error("Failed to initialize GibberTalk Audio instance:", err);
    });

    return () => {
      audio.stopListening();
    };
  }, [handleInboundPacket, log]);

  return {
    runtimeMode,
    setRuntimeMode,
    normalActivity,
    setNormalActivity,
    chuckyActivity,
    setChuckyActivity,
    gibbertalkActive,
    isListening,
    listeningError,
    activeTransmission,
    audioLevel,
    sendPing,
    endSession,
    humanInterrupt,
    startListening,
    stopListening,
    toggleGibberTalkListening,
    simulateIncomingPacket,
    audioRef
  };
}
