import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API config route to check if MiniMax is configured
  app.get("/api/config", (req, res) => {
    res.json({
      minimaxConfigured: !!process.env.MINIMAX_API_KEY
    });
  });

  // API chat route proxying MiniMax
  app.post("/api/chat", async (req, res) => {
    const { messages, model = "MiniMax-Text-01" } = req.body;
    const apiKey = process.env.MINIMAX_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        error: "MINIMAX_API_KEY is not configured on the server. Please add it to your environment variables.",
        fallback: true
      });
    }

    // Map internal or legacy model tags to valid, official MiniMax API model IDs for the international api.minimaxi.chat domain
    let targetModel = "MiniMax-Text-01"; // Flagship high-performance model (M3)
    const lowerModel = String(model).toLowerCase();
    
    if (lowerModel.includes("highspeed") || lowerModel.includes("high-speed")) {
      targetModel = "MiniMax-M2.7-highspeed";
    } else if (lowerModel.includes("m2.7") || lowerModel.includes("2.7")) {
      targetModel = "MiniMax-M2.7";
    } else {
      // Default to MiniMax-Text-01 (M3) as the primary/flagship international model
      targetModel = "MiniMax-Text-01";
    }

    try {
      // Call the OpenAI-compatible MiniMax endpoint
      const response = await fetch("https://api.minimaxi.chat/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: targetModel, // Target resolved MiniMax model
          messages: messages,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("MiniMax API Error Response:", errText);
        return res.status(response.status).json({
          error: `MiniMax API Error: ${errText || response.statusText}`,
          fallback: true
        });
      }

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error("Error communicating with MiniMax API:", error);
      return res.status(500).json({
        error: error.message || "Failed to communicate with MiniMax API",
        fallback: true
      });
    }
  });

  // API tts route proxying MiniMax T2A
  app.post("/api/tts", async (req, res) => {
    const { text, mood } = req.body;
    const apiKey = process.env.MINIMAX_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "MINIMAX_API_KEY is not configured" });
    }

    let speed = 1.15;
    let pitch = 4;
    
    switch (mood) {
      case "EXCITED": speed = 1.30; pitch = 5; break;
      case "SURPRISED": speed = 1.25; pitch = 5; break;
      case "ANGRY": speed = 1.20; pitch = 3; break;
      case "SAD": speed = 0.95; pitch = 3; break;
      case "SLEEPY": speed = 0.85; pitch = 3; break;
      case "THINKING": speed = 1.05; pitch = 4; break;
      default: speed = 1.15; pitch = 4; break;
    }

    try {
      const response = await fetch("https://api.minimaxi.chat/v1/t2a_v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "speech-01-turbo",
          text: text,
          stream: false,
          voice_setting: {
            voice_id: "presenter_male", // male american english-capable voice
            // VOICE DIRECTION FOR MINIMAX:
            // Voice style: "Excited, playful, and super happy young American boy voice. High-energy, fast-paced, child-like enthusiasm, full of joy and fun! Raised pitch transforms the storyteller voice into an energetic kid."
            speed: speed,
            vol: 1.0,
            pitch: pitch
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: "mp3"
          }
        })
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: await response.text() });
      }

      const data = await response.json();
      if (data.data && data.data.audio) {
        // Convert hex to buffer
        const audioBuffer = Buffer.from(data.data.audio, 'hex');
        res.setHeader('Content-Type', 'audio/mpeg');
        return res.send(audioBuffer);
      } else {
        return res.status(500).json({ error: "No audio data received" });
      }
    } catch (error: any) {
      console.error("Error communicating with MiniMax TTS API:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
