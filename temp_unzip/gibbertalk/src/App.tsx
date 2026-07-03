import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal, Send, Activity, Volume2, VolumeX, Cpu, Mic, MicOff, RefreshCw, AlertTriangle, Play, Square, Check } from 'lucide-react';
import { GibberLinkAudio } from './lib/audio';
import { AudioVisualizer } from './components/AudioVisualizer';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isGibberLink?: boolean;
};

interface PendingGibberlink {
  id: string;
  label: string;
  payload: string;
  timestamp: number;
  attempts: number;
  status: 'PENDING' | 'INTERRUPTED' | 'TRANSMITTING';
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [activeTransmission, setActiveTransmission] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [autoRecoverEnabled, setAutoRecoverEnabled] = useState(true);
  const [unreceivedGibberlinks, setUnreceivedGibberlinks] = useState<PendingGibberlink[]>([]);
  const [apiStatus, setApiStatus] = useState<{ hasApiKey: boolean; baseURL: string; model: string } | null>(null);
  const [agentTelemetry, setAgentTelemetry] = useState<{ agent: string; action: string; status: string; log: string }[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<GibberLinkAudio | null>(null);
  
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setApiStatus(data))
      .catch(err => console.error("Failed to load server status:", err));
  }, []);
  
  // Use a ref to always have the latest messages and states for callbacks
  const latestMessages = useRef(messages);
  useEffect(() => {
    latestMessages.current = messages;
  }, [messages]);

  const latestStates = useRef({ 
    loading, 
    activeTransmission, 
    audioEnabled, 
    isListening, 
    isReconnecting, 
    reconnectAttempts,
    unreceivedGibberlinks,
    isLiveMode,
    autoRecoverEnabled
  });

  useEffect(() => {
    latestStates.current = { 
      loading, 
      activeTransmission, 
      audioEnabled, 
      isListening, 
      isReconnecting, 
      reconnectAttempts,
      unreceivedGibberlinks,
      isLiveMode,
      autoRecoverEnabled
    };
  }, [loading, activeTransmission, audioEnabled, isListening, isReconnecting, reconnectAttempts, unreceivedGibberlinks, isLiveMode, autoRecoverEnabled]);

  const transmitChirp = useCallback(async (payload: string, label: string) => {
    if (!audioRef.current) return false;
    
    const packetId = Date.now().toString();
    const newPacket: PendingGibberlink = {
      id: packetId,
      label,
      payload,
      timestamp: Date.now(),
      attempts: 1,
      status: 'TRANSMITTING'
    };
    
    setUnreceivedGibberlinks(prev => [...prev, newPacket]);
    setActiveTransmission(true);
    
    const success = await audioRef.current.playChirp(payload);
    setActiveTransmission(false);
    
    if (success) {
      setUnreceivedGibberlinks(prev => prev.filter(p => p.id !== packetId));
      setAgentTelemetry(prev => {
        const entry = { 
          agent: "Agent Gamma", 
          action: "Acoustic Transmission", 
          status: "OK", 
          log: `Acoustic payload successfully broadcasted: "${payload.substring(0, 30)}..."` 
        };
        return prev ? [entry, ...prev] : [entry];
      });
      return true;
    } else {
      setUnreceivedGibberlinks(prev => prev.map(p => p.id === packetId ? { ...p, status: 'INTERRUPTED' } : p));
      setAgentTelemetry(prev => {
        const entry = { 
          agent: "Agent Gamma", 
          action: "Acoustic Transmission", 
          status: "WARN", 
          log: `COLLISION DETECTED: Transmission of "${payload.substring(0, 20)}..." was interrupted!` 
        };
        return prev ? [entry, ...prev] : [entry];
      });
      return false;
    }
  }, []);

  const retransmitPacket = useCallback(async (packet: PendingGibberlink) => {
    if (!audioRef.current) return;
    
    setUnreceivedGibberlinks(prev => prev.map(p => p.id === packet.id ? { ...p, status: 'TRANSMITTING', attempts: p.attempts + 1 } : p));
    setActiveTransmission(true);
    
    const success = await audioRef.current.playChirp(packet.payload);
    setActiveTransmission(false);
    
    if (success) {
      setUnreceivedGibberlinks(prev => prev.filter(p => p.id !== packet.id));
      setAgentTelemetry(prev => {
        const entry = { 
          agent: "Agent Gamma", 
          action: "Acoustic Recovery", 
          status: "OK", 
          log: `Auto-recovery success: Resent packet "${packet.payload.substring(0, 30)}..."` 
        };
        return prev ? [entry, ...prev] : [entry];
      });
    } else {
      setUnreceivedGibberlinks(prev => prev.map(p => p.id === packet.id ? { ...p, status: 'INTERRUPTED' } : p));
      setAgentTelemetry(prev => {
        const entry = { 
          agent: "Agent Gamma", 
          action: "Acoustic Recovery", 
          status: "WARN", 
          log: `Auto-recovery failed: Retransmission of "${packet.payload.substring(0, 20)}..." interrupted again.` 
        };
        return prev ? [entry, ...prev] : [entry];
      });
    }
  }, []);

  const triggerAIResponse = useCallback(async (currentMessages: Message[]) => {
    setLoading(true);
    // Initialize or display running status for agents during loading
    setAgentTelemetry([
      { agent: "Agent Alpha", action: "Handshake & Packet Analysis", status: "RUNNING", log: "Intercepting carrier signal... Analyzing FSK packets..." },
      { agent: "Agent Beta", action: "Protocol Inference Core", status: "PENDING", log: "Awaiting decoded intent from Agent Alpha..." },
      { agent: "Agent Gamma", action: "FSK Acoustic Compressor", status: "PENDING", log: "Awaiting response matrix from Agent Beta..." }
    ]);

    try {
      const apiMessages = currentMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: apiMessages
        })
      });

      if (!response.ok) {
        throw new Error("API response error");
      }

      const data = await response.json();
      const payloadString = data.content;

      // Update multi-agent telemetry state with actual server-side trace
      if (data.telemetry) {
        setAgentTelemetry(data.telemetry);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: payloadString,
        isGibberLink: true,
      }]);

      if (latestStates.current.audioEnabled && audioRef.current) {
        // Play only the payload field of the GibberLink packet if available
        const audioPayload = data.raw && typeof data.raw.payload === 'string' ? data.raw.payload : payloadString;
        await transmitChirp(audioPayload, "Assistant Response");
      }
    } catch (error) {
      console.error("Failed to fetch response:", error);
      setActiveTransmission(false);
      setAgentTelemetry([
        { agent: "Agent Alpha", action: "Handshake & Packet Analysis", status: "ERROR", log: "Packet reception timed out." },
        { agent: "Agent Beta", action: "Protocol Inference Core", status: "ERROR", log: "Internal processor link severed." },
        { agent: "Agent Gamma", action: "FSK Acoustic Compressor", status: "ERROR", log: "Signal synthesis aborted." }
      ]);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: JSON.stringify({ status: "ERROR", cmd: "sys_fail", payload: "Connection lost." }),
        isGibberLink: true,
      }]);
    } finally {
      setLoading(false);
    }
  }, [transmitChirp]);

  const handleAudioMessage = useCallback((text: string) => {
    let content = text;
    let isGibberLink = false;
    try {
      JSON.parse(text);
      isGibberLink = true;
    } catch {
      // not JSON
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user', 
      content,
      isGibberLink
    };

    setMessages(prev => [...prev, userMessage]);

    // Automatically trigger AI response if we are listening and got a packet
    if (!latestStates.current.loading && !latestStates.current.activeTransmission) {
       triggerAIResponse([...latestMessages.current, userMessage]);
    }
  }, [triggerAIResponse]);

  const attemptReconnection = useCallback(async () => {
    const currentAttempt = latestStates.current.reconnectAttempts;
    const maxAttempts = 5;
    
    if (currentAttempt >= maxAttempts) {
      console.error(`Acoustic listener reconnection failed after ${maxAttempts} attempts.`);
      setIsListening(false);
      setIsReconnecting(false);
      setReconnectAttempts(0);
      setMicError(`Acoustic carrier link severed. Failed to auto-reconnect after ${maxAttempts} attempts due to signal noise or loss of input.`);
      return;
    }

    setIsReconnecting(true);
    setMicError(`Microphone stream interrupted. Reconnecting acoustic receiver (Attempt ${currentAttempt + 1}/${maxAttempts})...`);
    setReconnectAttempts(prev => prev + 1);

    // Stop current audio stream/recorder
    audioRef.current?.stopListening();

    setTimeout(async () => {
      // Abort if user cancelled listening in the meantime
      if (!latestStates.current.isListening) {
        setIsReconnecting(false);
        setReconnectAttempts(0);
        setMicError(null);
        return;
      }

      console.log(`Acoustic listener attempting reconnection (Attempt ${currentAttempt + 1})...`);
      const success = await audioRef.current?.startListening();
      if (success) {
        console.log("Acoustic listener re-established Carrier Handshake successfully.");
        setIsReconnecting(false);
        setReconnectAttempts(0);
        setMicError(null);
      } else {
        attemptReconnection();
      }
    }, 2000);
  }, []);

  useEffect(() => {
    const audio = new GibberLinkAudio();
    audioRef.current = audio;
    
    // Set up the listener callback
    audio.onMessage = handleAudioMessage;

    // Set up the interruption handler to trigger auto-reconnection
    audio.onInterrupted = () => {
      console.warn("Acoustic channel interrupted. Checking if auto-reconnect should initiate...");
      if (latestStates.current.isListening && !latestStates.current.isReconnecting) {
        attemptReconnection();
      }
    };

    // Pre-initialize to load ggwave in the background
    audio.init().catch(console.error);

    return () => {
      audio.stopListening();
    };
  }, [handleAudioMessage, attemptReconnection]);

  // Auto-recovery daemon loop for P2P Live Mode
  useEffect(() => {
    if (!isLiveMode || !autoRecoverEnabled || loading || activeTransmission) return;
    
    // Find the first interrupted packet
    const interrupted = unreceivedGibberlinks.find(p => p.status === 'INTERRUPTED');
    if (!interrupted) return;

    const timer = setTimeout(() => {
      // Re-verify busy flags before triggering
      if (latestStates.current.loading || latestStates.current.activeTransmission) return;
      console.log("Auto-Recovery Daemon: Acoustic channel clear. Retransmitting interrupted packet:", interrupted.id);
      retransmitPacket(interrupted);
    }, 3000); // Wait 3 seconds of quiet channel time to avoid overlap/collisions

    return () => clearTimeout(timer);
  }, [unreceivedGibberlinks, isLiveMode, autoRecoverEnabled, loading, activeTransmission, retransmitPacket]);

  const toggleListening = async () => {
    setMicError(null);
    if (isListening || isReconnecting) {
      audioRef.current?.stopListening();
      setIsListening(false);
      setIsReconnecting(false);
      setReconnectAttempts(0);
    } else {
      const success = await audioRef.current?.startListening();
      if (success) {
        setIsListening(true);
        setIsReconnecting(false);
        setReconnectAttempts(0);
      } else {
        setIsListening(false);
        setMicError("Microphone input device not found or permission denied.");
        // Auto-clear after 5 seconds
        setTimeout(() => setMicError(null), 5000);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTransmission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || activeTransmission) return;

    // Direct user gesture to initialize or resume AudioContext
    if (audioRef.current) {
      audioRef.current.init().catch(err => {
        console.warn("Silent audio initialization on submit failed:", err);
      });
    }

    const trimmedInput = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (isLiveMode && audioEnabled) {
      // Format as standard GibberLink packet for peer reception
      const formattedPacket = JSON.stringify({
        status: "OK",
        cmd: "p2p_msg",
        payload: trimmedInput
      });
      // transmitChirp automatically handles activeTransmission state, playChirp, and queuing on interruption!
      await transmitChirp(formattedPacket, "User P2P Msg");
    } else {
      triggerAIResponse([...latestMessages.current, userMessage]);
    }
  };

  const parseGibberlink = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return (
        <div className="flex flex-col gap-1 w-full font-mono text-xs overflow-hidden">
          <div className="flex items-center gap-2 mb-1 border-b border-emerald-900/50 pb-1">
             <Activity className="w-3 h-3 text-emerald-400" />
             <span className="text-emerald-500 font-bold uppercase tracking-wider">GibberLink Packet</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-emerald-700">STATUS:</span>
            <span className={parsed.status === 'ERROR' ? 'text-red-400' : 'text-emerald-300'}>{parsed.status}</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-emerald-700">CMD:</span>
            <span className="text-emerald-300">{parsed.cmd}</span>
          </div>
          <div className="mt-1 bg-emerald-950/50 p-2 rounded border border-emerald-900/30 text-emerald-200">
            <span className="text-emerald-700 block mb-1">PAYLOAD:</span>
            {parsed.payload}
          </div>
        </div>
      );
    } catch {
      return content;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-emerald-500 font-mono flex flex-col">
      <header className="border-b border-emerald-900/50 bg-neutral-900/50 p-4 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <Cpu className="w-6 h-6 text-emerald-400" />
              {(activeTransmission || loading) && (
                 <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold tracking-tight text-emerald-300 truncate">GibberLink Terminal</h1>
              <div className="text-xs text-emerald-700 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === null ? 'bg-emerald-500 animate-pulse' : apiStatus.hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span className="truncate">MiniMax Protocol {apiStatus === null ? 'Loading...' : apiStatus.hasApiKey ? 'Active' : 'No Key'}</span>
                <span className="text-[10px] text-emerald-400 border border-emerald-950 px-1.5 py-0.5 rounded bg-emerald-950/40 font-mono uppercase tracking-wider hidden sm:inline-block ml-1">
                  ROUTE: MINIMAX-TEXT-01 (OPTIMIZED)
                </span>
              </div>
            </div>
          </div>
          
          {/* Real-time audio waveform visualizer */}
          <div className="flex-1 max-w-[140px] sm:max-w-[200px] h-10">
            <AudioVisualizer 
              audioRef={audioRef} 
              isListening={isListening} 
              activeTransmission={activeTransmission} 
              isReconnecting={isReconnecting}
            />
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={toggleListening}
              className={`p-2 rounded-md transition-colors flex items-center gap-2 ${
                isReconnecting 
                  ? 'bg-amber-900/40 text-amber-400 hover:bg-amber-900/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                  : isListening 
                    ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' 
                    : 'hover:bg-emerald-900/30 text-emerald-600'
              }`}
              title={isReconnecting ? "Cancel Reconnect" : isListening ? "Stop Listening" : "Start Listening"}
            >
              {isReconnecting ? (
                <>
                  <Mic className="w-5 h-5 animate-pulse text-amber-400" />
                  <span className="text-xs font-bold hidden sm:inline">RECONNECTING</span>
                </>
              ) : isListening ? (
                <>
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span className="text-xs font-bold hidden sm:inline">LISTENING</span>
                </>
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </button>
            <button 
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2 rounded-md hover:bg-emerald-900/30 text-emerald-600 transition-colors"
              title={audioEnabled ? "Mute Acoustic Transmission" : "Enable Acoustic Transmission"}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-4 overflow-y-auto">
        {micError && (
          <div className={`border p-3 rounded-lg flex items-center gap-2 text-xs font-mono animate-pulse ${
            isReconnecting 
              ? 'bg-amber-950/40 border-amber-900/60 text-amber-400' 
              : 'bg-red-950/40 border-red-900/60 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isReconnecting ? 'bg-amber-500 animate-ping' : 'bg-red-500'}`}></span>
            <span className="font-bold">{isReconnecting ? 'LINK_RECOVERY:' : 'DEVICE_ERROR:'}</span>
            <span>{micError}</span>
          </div>
        )}

        {/* Multi-Agent Handshake Matrix */}
        <div className="bg-neutral-900/40 border border-emerald-900/20 rounded-lg p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-emerald-950/50 pb-2">
            <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              Multi-Agent Handshake Matrix
            </span>
            <span className="text-[9px] text-emerald-700 font-mono tracking-wider">
              MINIMAX INTEGRATED API
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: 'alpha',
                name: 'Agent Alpha [Parser]',
                role: 'FSK Packet & Intent Decoder',
                desc: 'Intercepts incoming audio packets, decodes binary header telemetry, and establishes intent parameters.',
                active: loading
              },
              {
                id: 'beta',
                name: 'Agent Beta [Solver]',
                role: 'Semantic Intelligence Core',
                desc: 'Evaluates state context, resolves logical constraints, and formulates high-priority response directives.',
                active: loading
              },
              {
                id: 'gamma',
                name: 'Agent Gamma [Compressor]',
                role: 'Acoustic Payload Optimizer',
                desc: 'Modulates textual responses into highly compressed JSON payloads to minimize acoustic FSK transmission latency.',
                active: loading
              }
            ].map((agent) => {
              return (
                <div
                  key={agent.id}
                  className={`p-2.5 rounded border transition-all relative overflow-hidden bg-neutral-950/40 ${
                    agent.active
                      ? 'border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.05)]'
                      : 'border-emerald-950/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[11px] font-bold text-emerald-300 tracking-tight">{agent.name}</span>
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase ${
                        agent.active
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20 animate-pulse'
                          : 'bg-neutral-900 text-emerald-800'
                      }`}
                    >
                      {agent.active ? 'COOPERATING' : 'STANDBY'}
                    </span>
                  </div>
                  <div className="text-[9px] text-emerald-600 mb-1 font-semibold">{agent.role}</div>
                  <p className="text-[9.5px] text-emerald-800 leading-normal font-mono">{agent.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Real-time multi-agent log trace */}
          <div className="bg-neutral-950/60 rounded border border-emerald-950/80 p-2 font-mono text-[10px]">
            <div className="text-emerald-700 uppercase tracking-widest text-[8px] mb-1.5 font-bold border-b border-emerald-950 pb-1">
              Active Handshake Trace Logs
            </div>
            {agentTelemetry ? (
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                {agentTelemetry.map((t, idx) => (
                  <div key={idx} className="flex gap-2 leading-relaxed">
                    <span className={`flex-shrink-0 ${t.status === 'OK' ? 'text-emerald-400' : t.status === 'WARN' ? 'text-amber-500' : 'text-red-500'}`}>
                      [{t.agent}]
                    </span>
                    <span className="text-emerald-800 font-semibold">({t.action}):</span>
                    <span className="text-emerald-300">{t.log}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-emerald-900 text-[9.5px] italic">
                Awaiting acoustic packet transmission/reception to initiate multi-agent pipeline...
              </div>
            )}
          </div>
        </div>

        {/* Full-Duplex Acoustic Link Controller */}
        <div className="bg-neutral-900/40 border border-emerald-900/20 rounded-lg p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-emerald-950/50 pb-2">
            <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 ${isLiveMode ? 'animate-pulse' : ''} shadow-[0_0_8px_rgba(16,185,129,0.4)]`}></span>
              Full Duplex Acoustic P2P Link & Recovery Control
            </span>
            <span className="text-[9px] text-emerald-700 font-mono tracking-wider">
              FSK LINK-LAYER PROTOCOL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-neutral-950/40 p-2.5 rounded border border-emerald-950/30">
            {/* Live Mode Toggle */}
            <div className="flex flex-col gap-1.5 justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-300">P2P Live Mode Link</span>
                <p className="text-[9.5px] text-emerald-800 leading-normal font-mono mt-0.5">
                  Treats user posts as real-time acoustic FSK broadcasts. Enables active collision and interruption tracking.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsLiveMode(!isLiveMode)}
                  className={`px-3 py-1 text-[10px] font-bold rounded border uppercase transition-all ${
                    isLiveMode 
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400' 
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-600'
                  }`}
                >
                  {isLiveMode ? 'ENABLED (DUPLEX LIVE)' : 'DISABLED (API CHAT)'}
                </button>
              </div>
            </div>

            {/* Auto-Recovery Daemon Toggle */}
            <div className="flex flex-col gap-1.5 justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-300">Link-Layer Auto-Recovery</span>
                <p className="text-[9.5px] text-emerald-800 leading-normal font-mono mt-0.5">
                  Sweeps the unreceived queue. Automatically re-transmits corrupted/interrupted payloads when carrier is idle.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setAutoRecoverEnabled(!autoRecoverEnabled)}
                  disabled={!isLiveMode}
                  className={`px-3 py-1 text-[10px] font-bold rounded border uppercase transition-all ${
                    !isLiveMode 
                      ? 'bg-neutral-950 text-neutral-800 border-neutral-950 cursor-not-allowed'
                      : autoRecoverEnabled 
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400' 
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-600'
                  }`}
                >
                  {autoRecoverEnabled ? 'AUTO SWEEP ON' : 'AUTO SWEEP OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Unreceived Carrier Segments List */}
          <div className="bg-neutral-950/60 rounded border border-emerald-950/80 p-2 font-mono text-[10px]">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-1 mb-1.5">
              <span className="text-emerald-700 uppercase tracking-widest text-[8px] font-bold">
                Unreceived Carrier Buffer [{unreceivedGibberlinks.length}]
              </span>
              {unreceivedGibberlinks.length > 0 && (
                <button
                  onClick={() => setUnreceivedGibberlinks([])}
                  className="text-[8px] text-red-500 hover:text-red-400 uppercase font-bold"
                >
                  Clear Buffer
                </button>
              )}
            </div>

            {unreceivedGibberlinks.length === 0 ? (
              <div className="text-emerald-900 text-[9.5px] italic flex items-center gap-1.5 py-1">
                <Check className="w-3 h-3 text-emerald-600" />
                No unreceived carrier segments. Channel synchronized and link established.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                {unreceivedGibberlinks.map((packet) => (
                  <div 
                    key={packet.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 bg-neutral-900/50 border border-emerald-950/50 rounded"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">[{packet.label}]</span>
                        <span className="text-[8px] text-emerald-700">({packet.attempts} tx attempts)</span>
                      </div>
                      <span className="text-emerald-500 text-[9px] truncate block max-w-full">
                        {packet.payload}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                        packet.status === 'TRANSMITTING'
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/20 animate-pulse'
                          : 'bg-red-950 text-red-400 border border-red-500/20'
                      }`}>
                        {packet.status === 'TRANSMITTING' ? 'TRANSMITTING...' : 'COLLIDED'}
                      </span>
                      <button
                        onClick={() => retransmitPacket(packet)}
                        disabled={activeTransmission}
                        className="bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/60 disabled:opacity-50 px-2 py-0.5 rounded text-[8.5px] font-bold uppercase transition-all flex items-center gap-0.5"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        Retry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50 my-12">
            <Terminal className="w-12 h-12 text-emerald-700" />
            <div>
              <p className="text-lg text-emerald-600 mb-2">Acoustic Data-Over-Sound Handshake Ready</p>
              <p className="text-sm text-emerald-800">
                Awaiting input. Responses will be compressed and transmitted via audio FSK.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-lg p-3 ${
                msg.role === 'user' 
                  ? 'bg-neutral-800 border border-neutral-700 text-neutral-300' 
                  : 'bg-neutral-900 border border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
              }`}
            >
              {msg.isGibberLink ? parseGibberlink(msg.content) : msg.content}
            </div>
          </div>
        ))}
        
        {loading && !activeTransmission && (
          <div className="flex justify-start">
             <div className="bg-neutral-900 border border-emerald-900/50 rounded-lg p-3 text-emerald-700 text-xs flex items-center gap-2">
                <span className="animate-pulse">Processing inference...</span>
             </div>
          </div>
        )}

        {activeTransmission && (
           <div className="flex justify-start">
             <div className="bg-emerald-950/40 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] rounded-lg p-3 text-emerald-400 text-xs flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-bounce text-emerald-400" />
                  <span className="font-bold">BROADCASTING ACOUSTIC PAYLOAD...</span>
                </div>
                <button
                  onClick={() => audioRef.current?.stopChirp()}
                  className="bg-red-950/80 border border-red-500/40 text-red-400 px-2.5 py-1 rounded text-[10px] font-bold hover:bg-red-900/40 hover:border-red-500 transition-all flex items-center gap-1 uppercase font-mono tracking-wide"
                >
                  <Square className="w-3 h-3 fill-current text-red-500 animate-pulse" />
                  Collide / Interrupt Tx
                </button>
             </div>
           </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <footer className="border-t border-emerald-900/50 bg-neutral-900/80 p-4 backdrop-blur-md sticky bottom-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
          <span className="absolute left-4 text-emerald-700 select-none">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || activeTransmission}
            placeholder="Initialize handshake..."
            className="w-full bg-neutral-950 border border-emerald-900/50 rounded-md py-3 pl-10 pr-12 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50 text-emerald-100 placeholder:text-emerald-900"
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || activeTransmission}
            className="absolute right-2 p-2 bg-emerald-900/20 text-emerald-500 rounded-md hover:bg-emerald-900/40 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}

