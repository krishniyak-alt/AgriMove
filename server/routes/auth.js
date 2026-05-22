import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, useMock, mockStore, saveMockData } from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "agrimove_super_secret_key";

// Helper to generate JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user._id || user.id, role: user.role, name: user.name, phone: user.phone },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// REGISTER ENDPOINT
router.post("/signup", async (req, res) => {
  try {
    const { name, phone, password, role, district, vehicleType, vehicleNumber } = req.body;

    if (!name || !phone || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (useMock()) {
      // Check if user exists
      const existingUser = mockStore.users.find(u => u.phone === phone);
      if (existingUser) {
        return res.status(400).json({ error: "Phone number already registered" });
      }

      const newUser = {
        id: "usr_" + Math.random().toString(36).substr(2, 9),
        name,
        phone,
        password: hashedPassword,
        role,
        district: district || "",
        vehicleType: vehicleType || "",
        vehicleNumber: vehicleNumber || "",
        availability: true,
        latitude: 10.787 + (Math.random() - 0.5) * 0.1, // Jitter coordinate for map demos
        longitude: 79.1378 + (Math.random() - 0.5) * 0.1,
        createdAt: new Date().toISOString()
      };

      mockStore.users.push(newUser);
      saveMockData();

      const token = generateToken(newUser);
      const { password: _, ...userWithoutPassword } = newUser;
      
      return res.status(201).json({
        message: "Signup successful (local store)",
        token,
        user: userWithoutPassword
      });
    } else {
      // MongoDB Flow
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ error: "Phone number already registered" });
      }

      const newUser = new User({
        name,
        phone,
        password: hashedPassword,
        role,
        district,
        vehicleType,
        vehicleNumber,
        latitude: 10.787 + (Math.random() - 0.5) * 0.1,
        longitude: 79.1378 + (Math.random() - 0.5) * 0.1
      });

      await newUser.save();
      const token = generateToken(newUser);
      
      return res.status(201).json({
        message: "Signup successful",
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          district: newUser.district,
          vehicleType: newUser.vehicleType,
          vehicleNumber: newUser.vehicleNumber
        }
      });
    }
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server registration error" });
  }
});

// LOGIN ENDPOINT
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password required" });
    }

    if (useMock()) {
      const user = mockStore.users.find(u => u.phone === phone);
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        message: "Login successful (local store)",
        token,
        user: userWithoutPassword
      });
    } else {
      // MongoDB flow
      const user = await User.findOne({ phone });
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user);

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          district: user.district,
          vehicleType: user.vehicleType,
          vehicleNumber: user.vehicleNumber
        }
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server login error" });
  }
});

// GET PROFILE
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (useMock()) {
      const user = mockStore.users.find(u => u.id === decoded.id || u._id === decoded.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json({ user: userWithoutPassword });
    } else {
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.status(200).json({ user });
    }
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
