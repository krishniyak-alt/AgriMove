import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ChatMessage, useMock, mockStore, saveMockData } from "../db.js";

const router = express.Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve("./public/uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration for audio files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "voice-" + uniqueSuffix + path.extname(file.originalname || ".webm"));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 1. POST: Upload Voice Message
router.post("/upload-voice", upload.single("audio"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // Relative path to serve files statically
    const fileUrl = `/uploads/${req.file.filename}`;

    // Common farming transcribes in Tamil as fallbacks if no client transcript is supplied
    const TAMIL_FALLBACK_TRANSCRIBS = [
      "நான் தஞ்சாவூர்ல இருந்து மார்க்கெட்டுக்கு தக்காளி அனுப்பணும், 500 கிலோ இருக்கு.",
      "மதுரைல இருந்து கோயம்பேடு மார்க்கெட்டுக்கு 100 மூட்டை வெங்காயம் கொண்டு போகணும். வண்டி கிடைக்குமா?",
      "திருச்சில இருந்து தக்காளி ஏத்தணும். என்ன விலை ஆகும்?",
      "வண்டி இப்போ கிளம்புது. இன்னும் 2 மணி நேரத்துல வந்திடுவேன்.",
      "உருளைக்கிழங்கு மூட்டை எல்லாம் தயாரா இருக்கு, சீக்கிரம் வரவும்."
    ];

    const randomFallback = TAMIL_FALLBACK_TRANSCRIBS[Math.floor(Math.random() * TAMIL_FALLBACK_TRANSCRIBS.length)];
    const transcription = req.body.transcription || randomFallback;

    res.json({
      success: true,
      fileUrl,
      transcription
    });
  } catch (err) {
    console.error("Voice upload error:", err);
    res.status(500).json({ error: "Server audio upload failed" });
  }
});

// 2. POST: Send Chat Message
router.post("/send", async (req, res) => {
  try {
    const { senderId, receiverId, text, voiceUrl } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "Sender and receiver required" });
    }

    if (useMock()) {
      const newMessage = {
        _id: "msg_" + Math.random().toString(36).substr(2, 9),
        sender: senderId,
        receiver: receiverId,
        text: text || "",
        voiceUrl: voiceUrl || "",
        timestamp: new Date().toISOString()
      };

      mockStore.chats.push(newMessage);
      saveMockData();

      return res.status(201).json({
        success: true,
        message: newMessage
      });
    } else {
      const newMessage = new ChatMessage({
        sender: senderId,
        receiver: receiverId,
        text: text || "",
        voiceUrl: voiceUrl || ""
      });

      await newMessage.save();

      res.status(201).json({
        success: true,
        message: newMessage
      });
    }
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Server chat sending failed" });
  }
});

// 3. GET: Fetch Chat History between two users
router.get("/history/:userA/:userB", async (req, res) => {
  try {
    const { userA, userB } = req.params;

    if (useMock()) {
      const history = mockStore.chats.filter(c => 
        (c.sender === userA && c.receiver === userB) ||
        (c.sender === userB && c.receiver === userA)
      );
      // Sort chronologically
      history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return res.json(history);
    } else {
      const history = await ChatMessage.find({
        $or: [
          { sender: userA, receiver: userB },
          { sender: userB, receiver: userA }
        ]
      }).sort({ timestamp: 1 });

      res.json(history);
    }
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ error: "Server fetching history failed" });
  }
});

export default router;
