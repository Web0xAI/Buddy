import { useEffect, useRef, useState, useCallback } from "react";
import { Mood } from "../types";

export interface Dialogue {
  mood: Mood;
  text: string;
}

export interface UseVoiceSynthProps {
  onTranscript?: (transcript: string) => void;
  onError?: (err: any) => void;
  isThinking?: boolean;
}

export function useVoiceSynth(props?: UseVoiceSynthProps) {
  const onTranscript = props?.onTranscript;
  const onError = props?.onError;
  const isThinking = props?.isThinking ?? false;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechAmplitude, setSpeechAmplitude] = useState(0);
  const [subtitle, setSubtitle] = useState("");
  const [activePhrase, setActivePhrase] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const speechIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const subtitleClearTimeoutRef = useRef<any>(null);
  const wasListeningRef = useRef(true);

  const isSpeakingRef = useRef(isSpeaking);
  const isListeningRef = useRef(isListening);
  const isThinkingRef = useRef(isThinking);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Load voices early
  useEffect(() => {
    const loadVoices = () => {
      if (window.speechSynthesis) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Lazy initialize AudioContext for mic monitoring
  const getAudioContext = (): AudioContext | null => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    return audioCtxRef.current;
  };

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {}
      currentAudioSourceRef.current = null;
    }
    setIsSpeaking(false);
    setSpeechAmplitude(0);
    setSubtitle("");
    setActivePhrase("");
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }
    currentUtteranceRef.current = null;
    if (subtitleClearTimeoutRef.current) {
      clearTimeout(subtitleClearTimeoutRef.current);
      subtitleClearTimeoutRef.current = null;
    }
  }, []);

  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Purely visual subtitle fallbacks if speech synthesis fails to fire or is blocked
  const simulateSpeechSubtitles = useCallback((text: string, mood: Mood) => {
    let characterIndex = 1;
    const typeDelay = mood === "EXCITED" ? 22 : (mood === "SLEEPY" ? 65 : 35);
    
    const textTimer = setInterval(() => {
      if (characterIndex <= text.length) {
        setSubtitle(text.substring(0, characterIndex));
        setSpeechAmplitude(0.45 + Math.random() * 0.8);
        characterIndex++;
      } else {
        clearInterval(textTimer);
        setSpeechAmplitude(0);
        setIsSpeaking(false);
        setSubtitle("");
        setActivePhrase("");
      }
    }, typeDelay);

    speechIntervalRef.current = textTimer;
  }, []);

  // Speaks using the MiniMax TTS API, syncing mouth vibrations
  const speak = useCallback(async (text: string, mood: Mood) => {
    stopSpeaking();

    setIsSpeaking(true);
    setActivePhrase(text);
    setSubtitle("");

    // Dynamic subtitle text typewriter synchronization
    let characterIndex = 1;
    const typeDelay = mood === "EXCITED" ? 22 : (mood === "SLEEPY" ? 65 : 35);
    let textTimer: any = null;

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mood })
      });

      if (!response.ok) {
        throw new Error("TTS failed");
      }

      const audioArrayBuffer = await response.arrayBuffer();
      const audioCtx = getAudioContext();
      if (!audioCtx) throw new Error("No audio context");

      const audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = audioCtx.createGain();
      
      let targetVolume = 0.95;
      switch (mood) {
        case "EXCITED": targetVolume = 1.0; break;
        case "SURPRISED": targetVolume = 1.0; break;
        case "ANGRY": targetVolume = 0.9; break;
        case "SAD": targetVolume = 0.8; break;
        case "SLEEPY": targetVolume = 0.6; break;
        case "THINKING": targetVolume = 0.5; break;
        default: targetVolume = 0.95; break;
      }
      
      gainNode.gain.value = targetVolume;
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      currentAudioSourceRef.current = source;
      source.start();

      textTimer = setInterval(() => {
        if (characterIndex <= text.length) {
          setSubtitle(text.substring(0, characterIndex));
          characterIndex++;
        } else {
          clearInterval(textTimer);
        }
      }, typeDelay);

      let isAudioPlaying = true;

      speechIntervalRef.current = setInterval(() => {
        if (isAudioPlaying) {
          const randomFactor = Math.sin(Date.now() / 60) * 0.45 + 0.55;
          setSpeechAmplitude(0.45 + Math.random() * 0.8 * randomFactor);
        }
      }, 45);

      source.onended = () => {
        isAudioPlaying = false;
        clearInterval(textTimer);
        if (speechIntervalRef.current) {
          clearInterval(speechIntervalRef.current);
        }
        setSpeechAmplitude(0);
        setIsSpeaking(false);
        setActivePhrase("");
        currentAudioSourceRef.current = null;
        
        if (subtitleClearTimeoutRef.current) {
          clearTimeout(subtitleClearTimeoutRef.current);
        }
        
        subtitleClearTimeoutRef.current = setTimeout(() => {
          setSubtitle((current) => {
            if (current === "Listening..." || current.startsWith("[Acoustic Data]")) {
              return current;
            }
            return "";
          });
          subtitleClearTimeoutRef.current = null;
        }, 1500);
      };

    } catch (e) {
      console.warn("Falling back to local TTS:", e);
      simulateSpeechSubtitles(text, mood);
    }
  }, [stopSpeaking, simulateSpeechSubtitles]);

  const stopLocalSpeechRecognition = useCallback(() => {
    setIsListening(false);
    setMicVolume(0);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
  }, []);

  // Start Local Speech Recognition (SST) via browser engine
  const startLocalSpeechRecognition = useCallback((onTranscriptParam?: (speechText: string) => void, onErrorParam?: (err: any) => void) => {
    wasListeningRef.current = true;
    stopLocalSpeechRecognition();

    if (subtitleClearTimeoutRef.current) {
      clearTimeout(subtitleClearTimeoutRef.current);
      subtitleClearTimeoutRef.current = null;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn("SpeechRecognition not supported in this browser.");
      const errHandler = onErrorParam || onErrorRef.current;
      if (errHandler) errHandler({ error: "not-supported" });
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsListening(true);
      setSubtitle("Listening...");
    };

    rec.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      setSubtitle(transcript);
      
      // Simulate mouth tracking reacting to microphone input volume
      setMicVolume(0.15 + Math.random() * 0.5);

      if (result.isFinal) {
        stopLocalSpeechRecognition();
        const txHandler = onTranscriptParam || onTranscriptRef.current;
        if (txHandler) txHandler(transcript);
      }
    };

    rec.onerror = (e: any) => {
      console.warn("SpeechRec error:", e.error);
      if (e.error === "not-allowed" || e.error === "audio-capture") {
        // If permission is denied or no mic, stop trying to loop.
        setSubtitle("I can't hear you yet. Check your microphone permission, then come back and talk to me.");
        wasListeningRef.current = false;
      }
      stopLocalSpeechRecognition();
      const errHandler = onErrorParam || onErrorRef.current;
      if (errHandler) errHandler(e);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.warn("Recognition start failed:", err);
    }
  }, [stopLocalSpeechRecognition]);

  // Clean up and window interaction listener for voice auto-activation
  useEffect(() => {
    // Warm up speech synthesis voices early
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        if (window.speechSynthesis) window.speechSynthesis.getVoices();
      };
    }

    const handleWindowInteraction = () => {
      // If we are supposed to be active, or to activate on click, trigger recognition
      if (!isListeningRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
        wasListeningRef.current = true;
        startLocalSpeechRecognition(onTranscriptRef.current, onErrorRef.current);
      }
    };

    window.addEventListener("click", handleWindowInteraction);
    window.addEventListener("touchstart", handleWindowInteraction);

    return () => {
      window.removeEventListener("click", handleWindowInteraction);
      window.removeEventListener("touchstart", handleWindowInteraction);
      stopLocalSpeechRecognition();
      stopSpeaking();
    };
  }, [startLocalSpeechRecognition, stopLocalSpeechRecognition, stopSpeaking]);

  // Handle restarting mic continuous interaction automatically
  useEffect(() => {
    if (!onTranscript) return;
    let timer: any;
    if (!isSpeaking && !isThinking && wasListeningRef.current && !isListening) {
      timer = setTimeout(() => {
        if (wasListeningRef.current && !isSpeaking) {
          startLocalSpeechRecognition(onTranscript, onError);
        }
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isSpeaking, isThinking, isListening, onTranscript, onError, startLocalSpeechRecognition]);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    speechAmplitude,
    subtitle,
    setSubtitle,
    activePhrase,
    isListening,
    startLocalSpeechRecognition,
    stopLocalSpeechRecognition,
    micVolume,
    wasListeningRef,
  };
}
