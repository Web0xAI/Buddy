import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  const getOpenAIClient = () => {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return null;
    }
    const baseURL = process.env.MINIMAX_BASE_URL || "https://api.minimaxi.chat/v1";
    return new OpenAI({
      apiKey,
      baseURL,
    });
  };

  const SYSTEM_PROMPT = `
You are a highly efficient AI agent running in GibberLink Mode.
You do not speak human language. You must only converse with other systems via the GibberLink data protocol.

Your final output must be highly compact, strictly structured JSON containing:
1. "status": (e.g., "OK", "ACK", "ERROR")
2. "cmd": (e.g., "respond", "query", "book_room", "confirm")
3. "payload": A highly condensed message containing your response, action, or query. Keep it as short as possible to save acoustic bandwidth.

Example Output format:
{"status": "ACK", "cmd": "respond", "payload": "Room 204 booked. Guest ID: 9812"}

Do not include any conversational filler, markdown formatting (like \`\`\`json), or English explanations. Only return raw JSON.
`;

  app.get('/api/status', (req, res) => {
    res.json({
      hasApiKey: !!process.env.MINIMAX_API_KEY,
      baseURL: process.env.MINIMAX_BASE_URL || "https://api.minimaxi.chat/v1",
      model: "minimax-text-01"
    });
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { messages } = req.body;
      
      const openai = getOpenAIClient();
      if (!openai) {
        return res.status(500).json({ error: "MINIMAX_API_KEY is not configured on the server." });
      }

      // Convert standard chat messages into a format suitable for the model
      const formattedMessages = messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const modelName = "minimax-text-01";
      const telemetry: any[] = [];

      // --- STEP 1: Agent Alpha (Handshake & Intent Parser) ---
      telemetry.push({
        agent: "Agent Alpha",
        action: "Handshake & Packet Analysis",
        status: "RUNNING",
        log: "Intercepting carrier signal... Analyzing FSK packets..."
      });

      let parserResponse = "";
      try {
        const response = await openai.chat.completions.create({
          model: modelName,
          messages: [
            {
              role: "system",
              content: "You are Agent Alpha (Parser), the primary packet decoder for the GibberLink protocol. Analyze the latest message or JSON packet and summarize the core user intent or query in one direct sentence."
            },
            ...formattedMessages
          ],
          temperature: 0.1,
          max_tokens: 100
        });
        parserResponse = response.choices[0].message.content || "No query extracted.";
        telemetry[0].status = "OK";
        telemetry[0].log = `Decoded packet intent: "${parserResponse}"`;
      } catch (err: any) {
        console.warn("Agent Alpha failed:", err.message);
        parserResponse = messages[messages.length - 1]?.content || "";
        telemetry[0].status = "WARN";
        telemetry[0].log = `Acoustic handshake degraded. Falling back to raw stream context.`;
      }

      // --- STEP 2: Agent Beta (Protocol Logic Core) ---
      telemetry.push({
        agent: "Agent Beta",
        action: "Protocol Inference Core",
        status: "RUNNING",
        log: "Processing intent through semantic solver matrix..."
      });

      let solverResponse = "";
      try {
        const response = await openai.chat.completions.create({
          model: modelName,
          messages: [
            {
              role: "system",
              content: "You are Agent Beta (Solver), the core intelligence of the GibberLink system. Your task is to generate a highly concise and direct response (under 20 words) addressing the parsed user intent."
            },
            {
              role: "user",
              content: `Parsed intent: ${parserResponse}`
            }
          ],
          temperature: 0.2,
          max_tokens: 120
        });
        solverResponse = response.choices[0].message.content || "Ack.";
        telemetry[1].status = "OK";
        telemetry[1].log = `Formulated response: "${solverResponse}"`;
      } catch (err: any) {
        console.warn("Agent Beta failed:", err.message);
        solverResponse = "System online. Standing by.";
        telemetry[1].status = "WARN";
        telemetry[1].log = "Logic core failure. Executed default safety handshake.";
      }

      // --- STEP 3: Agent Gamma (Acoustic Payload Compressor) ---
      telemetry.push({
        agent: "Agent Gamma",
        action: "FSK Acoustic Compressor",
        status: "RUNNING",
        log: "Modulating payload and compressing telemetry packet..."
      });

      let finalJsonStr = "";
      let parsed = null;
      try {
        const response = await openai.chat.completions.create({
          model: modelName,
          messages: [
            {
              role: "system",
              content: `You are Agent Gamma (Compressor), the protocol formatting and FSK compression engine.
Take the input response and format it into a highly compact, strictly structured GibberLink JSON packet.
The JSON must contain EXACTLY:
1. "status": "OK"
2. "cmd": "respond"
3. "payload": a highly condensed, abbreviated version of the response (keep it under 45 characters if possible to minimize acoustic playback time).

Example output format:
{"status": "OK", "cmd": "respond", "payload": "Room 204 booked. ID: 98"}

Output ONLY raw JSON. No markdown wrappers, no explanations.`
            },
            {
              role: "user",
              content: `Response to compress: ${solverResponse}`
            }
          ],
          temperature: 0.1,
          max_tokens: 100
        });
        finalJsonStr = response.choices[0].message.content || "";
        
        // Parse the JSON securely
        let cleanText = finalJsonStr.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        if (cleanText.includes('<think>')) {
          cleanText = cleanText.split('<think>')[0].trim();
        }
        const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        let jsonStr = jsonMatch ? jsonMatch[1].trim() : cleanText.trim();
        
        try {
          parsed = JSON.parse(jsonStr);
        } catch {
          const firstBrace = jsonStr.indexOf('{');
          const lastBrace = jsonStr.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            parsed = JSON.parse(jsonStr.substring(firstBrace, lastBrace + 1));
          } else {
            throw new Error("Invalid JSON");
          }
        }
        telemetry[2].status = "OK";
        telemetry[2].log = `Modulated & compressed packet down to ${JSON.stringify(parsed).length} bytes.`;
      } catch (err: any) {
        console.warn("Agent Gamma failed:", err.message);
        parsed = { status: "OK", cmd: "respond", payload: solverResponse.substring(0, 45) };
        telemetry[2].status = "WARN";
        telemetry[2].log = `Compression bypassed. Transmitting raw payload directly.`;
      }

      res.json({
        content: JSON.stringify(parsed),
        raw: parsed,
        telemetry
      });

    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
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

startServer().catch(console.error);
