import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

// Routes imports
import authRoutes from "./routes/auth.js";
import transportRoutes from "./routes/transport.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON and URL encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static upload directory
const publicDir = path.resolve("./public");
app.use(express.static(publicDir));
app.use("/uploads", express.static(path.join(publicDir, "uploads")));

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/chat", chatRoutes);

// Base health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date() });
});

// Setup DB and start server
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 AgriMove Backend running on http://localhost:${PORT}`);
  });
}

startServer();
