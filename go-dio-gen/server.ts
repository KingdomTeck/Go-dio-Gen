import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import path from "path";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/elevenlabs/voices", async (req, res) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "ELEVENLABS_API_KEY is not set in environment variables." });
      }

      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": apiKey }
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs API error: ${errText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/elevenlabs/clone", upload.single("file"), async (req, res) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "ELEVENLABS_API_KEY is not set in environment variables." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const name = req.body.name || "Cloned Voice";
      const description = req.body.description || "Voice cloned via AI Studio";

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      
      // Convert buffer to Blob for native fetch FormData
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("files", blob, req.file.originalname);

      const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs API error: ${errText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/elevenlabs/tts", async (req, res) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "ELEVENLABS_API_KEY is not set in environment variables." });
      }

      const { text, voice_id } = req.body;
      if (!text || !voice_id) {
        return res.status(400).json({ error: "Missing text or voice_id" });
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs API error: ${errText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.set("Content-Type", "audio/mpeg");
      res.send(buffer);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
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
