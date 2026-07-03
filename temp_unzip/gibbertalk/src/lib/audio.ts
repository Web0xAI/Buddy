let sharedAudioCtx: AudioContext | null = null;
let sharedGgwave: any = null;
let sharedGgwaveInstance: any = null;
let sharedAnalyser: AnalyserNode | null = null;
let sharedIsInitialized = false;
let sharedInitPromise: Promise<void> | null = null;

export class GibberLinkAudio {
  private stream: MediaStream | null = null;
  private recorder: ScriptProcessorNode | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private currentChirpResolver: ((success: boolean) => void) | null = null;
  public onMessage: ((message: string) => void) | null = null;
  public onInterrupted: (() => void) | null = null;

  getAnalyser(): AnalyserNode | null {
    return sharedAnalyser;
  }

  stopChirp() {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch (e) {
        // Source might have already stopped
      }
      this.activeSource = null;
    }
    if (this.currentChirpResolver) {
      this.currentChirpResolver(false);
      this.currentChirpResolver = null;
    }
  }

  async init() {
    if (sharedAudioCtx && sharedGgwave && sharedGgwaveInstance) {
      sharedIsInitialized = true;
      return;
    }

    if (sharedInitPromise) {
      try {
        await sharedInitPromise;
      } catch (e) {
        console.warn('Existing initialization promise failed:', e);
      }
      if (sharedAudioCtx && sharedGgwave && sharedGgwaveInstance) {
        sharedIsInitialized = true;
        return;
      }
    }

    sharedInitPromise = (async () => {
      try {
        if (!sharedAudioCtx) {
          try {
            sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 48000 });
          } catch (e) {
            console.warn('Failed to create AudioContext with 48000Hz, trying default sample rate:', e);
            try {
              sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (fallbackErr) {
              console.error('Failed to create any AudioContext:', fallbackErr);
            }
          }
        }

        if (sharedAudioCtx && !sharedAnalyser) {
          sharedAnalyser = sharedAudioCtx.createAnalyser();
          sharedAnalyser.fftSize = 256;
        }

        if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
          try {
            await sharedAudioCtx.resume();
          } catch (e) {
            console.warn('AudioContext resume failed in init:', e);
          }
        }

        if (!sharedGgwave && typeof window !== 'undefined') {
          // If ggwave_factory is not on window, attempt to dynamically inject the script
          if (!(window as any).ggwave_factory) {
            console.log('ggwave_factory not found on window, dynamically appending script tag...');
            const script = document.createElement('script');
            script.src = '/ggwave/ggwave.js';
            script.async = true;
            document.head.appendChild(script);
          }

          let retries = 0;
          while (!(window as any).ggwave_factory && retries < 100) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
          }

          if ((window as any).ggwave_factory) {
            const factory = (window as any).ggwave_factory;
            sharedGgwave = await factory({
              locateFile: (path: string) => `/ggwave/${path}`
            });
            console.log('ggwave library loaded successfully');
          } else {
            console.error('ggwave_factory not found on window after 100 retries');
          }
        }

        if (sharedGgwave && !sharedGgwaveInstance) {
          const parameters = sharedGgwave.getDefaultParameters();
          if (sharedAudioCtx) {
            parameters.sampleRateInp = sharedAudioCtx.sampleRate;
            parameters.sampleRateOut = sharedAudioCtx.sampleRate;
          }
          sharedGgwaveInstance = sharedGgwave.init(parameters);
          console.log('ggwave instance initialized successfully', { instance: sharedGgwaveInstance });
        }

        if (sharedAudioCtx && sharedGgwave && sharedGgwaveInstance) {
          sharedIsInitialized = true;
        } else {
          sharedIsInitialized = false;
        }
      } catch (err) {
        console.error('Error during ggwave init:', err);
        sharedIsInitialized = false;
      } finally {
        if (!sharedIsInitialized) {
          sharedInitPromise = null;
        }
      }
    })();

    return sharedInitPromise;
  }

  async playChirp(payload: string): Promise<boolean> {
    this.stopChirp(); // Stop any active chirp first
    await this.init();
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      try {
        await sharedAudioCtx.resume();
      } catch (e) {
        console.warn('AudioContext resume failed in playChirp:', e);
      }
    }
    if (!sharedAudioCtx || !sharedGgwave || !sharedGgwaveInstance) {
      console.error('Audio context or ggwave not initialized:', {
        hasAudioCtx: !!sharedAudioCtx,
        hasGgwave: !!sharedGgwave,
        hasGgwaveInstance: !!sharedGgwaveInstance,
        audioCtxState: sharedAudioCtx ? sharedAudioCtx.state : 'none'
      });
      return false;
    }

    try {
      // ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST
      const protocolId = sharedGgwave.ProtocolId ? sharedGgwave.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST : 1; 
      const waveform = sharedGgwave.encode(
        sharedGgwaveInstance,
        payload,
        protocolId,
        10
      );

      const buffer = new ArrayBuffer(waveform.byteLength);
      new Uint8Array(buffer).set(waveform);
      const buf = new Float32Array(buffer);

      const audioBuffer = sharedAudioCtx.createBuffer(1, buf.length, sharedAudioCtx.sampleRate);
      audioBuffer.getChannelData(0).set(buf);
      
      const source = sharedAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(sharedAudioCtx.destination);
      if (sharedAnalyser) {
        source.connect(sharedAnalyser);
      }
      
      this.activeSource = source;

      const startTime = sharedAudioCtx.currentTime;
      source.start(startTime);

      return new Promise<boolean>(resolve => {
        this.currentChirpResolver = resolve;
        
        const timeoutId = setTimeout(() => {
          if (this.activeSource === source) {
            this.activeSource = null;
          }
          if (this.currentChirpResolver === resolve) {
            this.currentChirpResolver = null;
            resolve(true);
          }
        }, (audioBuffer.duration) * 1000 + 100);

        source.onended = () => {
          // Source ended, could be naturally or via stop()
          // If the timeout is still scheduled and this was natural, it will resolve.
        };
      });
    } catch (error) {
      console.error('Failed to send audio message:', error);
      return false;
    }
  }

  async startListening(): Promise<boolean> {
    await this.init();
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      try {
        await sharedAudioCtx.resume();
      } catch (e) {
        console.warn('AudioContext resume failed in startListening:', e);
      }
    }
    if (!sharedAudioCtx || !sharedGgwave || !sharedGgwaveInstance) return false;

    if (this.recorder) return true; // Already listening

    try {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false,
          }
        });
      } catch (innerErr) {
        console.warn("Getting microphone with precise constraints failed, retrying with raw audio option:", innerErr);
        // Fallback to simple audio: true if constraints are too strict or device not supported
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      const mediaStreamSource = sharedAudioCtx.createMediaStreamSource(this.stream);

      // Attach track event listeners to detect stream interruption (e.g. noise or physical disconnection)
      this.stream.getAudioTracks().forEach(track => {
        track.onended = () => {
          console.warn("Acoustic listener audio track ended unexpectedly.");
          if (this.onInterrupted) {
            this.onInterrupted();
          }
        };
        track.onmute = () => {
          console.warn("Acoustic listener audio track was muted / interrupted.");
          if (this.onInterrupted) {
            this.onInterrupted();
          }
        };
      });

      const bufferSize = 1024;
      this.recorder = sharedAudioCtx.createScriptProcessor(bufferSize, 1, 1);
      
      this.recorder.onaudioprocess = (e: AudioProcessingEvent) => {
        const sourceBuf = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to Int8Array of raw bytes
        const buffer = new ArrayBuffer(sourceBuf.length * 4);
        new Float32Array(buffer).set(sourceBuf);
        const int8Array = new Int8Array(buffer);
        
        const res = sharedGgwave.decode(sharedGgwaveInstance, int8Array);
        if (res && res.length > 0) {
          const text = new TextDecoder("utf-8").decode(res);
          if (this.onMessage) {
            this.onMessage(text);
          }
        }
      };

      mediaStreamSource.connect(this.recorder);
      if (sharedAnalyser) {
        mediaStreamSource.connect(sharedAnalyser);
      }
      this.recorder.connect(sharedAudioCtx.destination);
      return true;
    } catch (err) {
      console.error("Error starting listener:", err);
      return false;
    }
  }

  stopListening() {
    if (this.recorder) {
      this.recorder.disconnect();
      this.recorder = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}
