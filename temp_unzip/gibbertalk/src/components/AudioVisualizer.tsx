import React, { useEffect, useRef } from 'react';
import { GibberLinkAudio } from '../lib/audio';

interface AudioVisualizerProps {
  audioRef: React.RefObject<GibberLinkAudio | null>;
  isListening: boolean;
  activeTransmission: boolean;
  isReconnecting?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioRef,
  isListening,
  activeTransmission,
  isReconnecting = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateDpr = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    updateDpr();

    // Setup buffer for audio data
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array = new Uint8Array(0);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      if (!analyser && audioRef.current) {
        analyser = audioRef.current.getAnalyser();
        if (analyser) {
          dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
      }

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear the canvas
      ctx.clearRect(0, 0, width, height);

      // Draw cybernetic scanline grid background (amber color if reconnecting)
      ctx.strokeStyle = isReconnecting ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, height / 4);
      ctx.lineTo(width, height / 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, (3 * height) / 4);
      ctx.lineTo(width, (3 * height) / 4);
      ctx.stroke();

      // Vertical grid lines
      for (let x = 15; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const isActive = (isListening && !isReconnecting) || activeTransmission;

      // Draw the waveform
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isReconnecting ? '#f59e0b' : '#10b981'; // Tailwind amber-500 or emerald-500
      ctx.shadowBlur = 8;
      ctx.shadowColor = isReconnecting ? 'rgba(245, 158, 11, 0.8)' : 'rgba(16, 185, 129, 0.8)';

      if (isActive && analyser && dataArray.length > 0) {
        analyser.getByteTimeDomainData(dataArray);

        const sliceWidth = width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          // Normalize to range [-1.0, 1.0]
          const v = dataArray[i] / 128.0;
          let y = (v * height) / 2;

          // If broadcasting, make the amplitude more visually dramatic/pronounced
          if (activeTransmission) {
            const offset = (v - 1.0) * 1.8;
            y = ((1.0 + offset) * height) / 2;
          }

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }
      } else {
        // Flatline / Ambient terminal static standby wave
        const sliceWidth = width / 128;
        let x = 0;
        const time = Date.now() * 0.005;

        for (let i = 0; i < 128; i++) {
          // Ambient idle wave - very subtle organic oscillation (slightly erratic if reconnecting)
          const multiplier = isReconnecting ? 1.8 : 1.2;
          const noise = Math.sin(i * 0.12 + time) * Math.cos(i * 0.04 - time * 0.3) * multiplier;
          const y = height / 2 + noise;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
      }

      ctx.stroke();
      // Reset shadow for subsequent draws
      ctx.shadowBlur = 0;
    };

    draw();

    const handleResize = () => {
      updateDpr();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [audioRef, isListening, activeTransmission, isReconnecting]);

  return (
    <div className={`relative w-full h-10 border rounded bg-neutral-950/80 overflow-hidden flex items-center justify-center transition-colors ${
      isReconnecting ? 'border-amber-950/80' : 'border-emerald-950/80'
    }`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-85"
        id="audio-visualizer-canvas"
      />
      {/* Glow overlays and scanlines styling */}
      <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent pointer-events-none ${
        isReconnecting ? 'to-amber-950/10' : 'to-emerald-950/10'
      }`} />
      <span className={`absolute top-1 left-1.5 text-[6.5px] font-mono tracking-widest pointer-events-none select-none uppercase ${
        isReconnecting ? 'text-amber-800' : 'text-emerald-800'
      }`}>
        {activeTransmission ? 'SYS_TX' : isReconnecting ? 'SYS_RECON' : isListening ? 'SYS_RX' : 'SYS_STBY'}
      </span>
      <span className={`absolute bottom-1 right-1.5 text-[6.5px] font-mono tracking-wider pointer-events-none select-none uppercase ${
        isReconnecting ? 'text-amber-800/80' : 'text-emerald-800/80'
      }`}>
        {activeTransmission ? 'Broadcasting' : isReconnecting ? 'Recovery' : isListening ? 'Listening' : 'Ready'}
      </span>
    </div>
  );
};
