import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/agrimove";

let isUsingMock = false;

// Mock Store for Fallback
const DATA_FILE = path.resolve("./data_store.json");
let mockStore = {
  users: [],
  requests: [],
  groups: [],
  chats: []
};

// Load existing data if file exists
if (fs.existsSync(DATA_FILE)) {
  try {
    mockStore = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (err) {
    console.error("Error reading data_store.json:", err);
  }
}

export function saveMockData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(mockStore, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to data_store.json:", err);
  }
}

// Connect to MongoDB
export async function connectDB() {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000 // Quick timeout to failover quickly
    });
    console.log("🟢 Connected to MongoDB at", MONGODB_URI);
  } catch (err) {
    console.log("🟡 MongoDB connection failed. Falling back to local data store (data_store.json).");
    isUsingMock = true;
  }
}

// User Schema & Methods
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["farmer", "driver", "admin"], required: true },
  district: { type: String },
  vehicleType: { type: String, enum: ["mini_truck", "medium_truck", "large_truck"] },
  vehicleNumber: { type: String },
  availability: { type: Boolean, default: true },
  latitude: { type: Number, default: 10.787 }, // Default Tamil Nadu coords (e.g. Thanjavur area)
  longitude: { type: Number, default: 79.1378 }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", UserSchema);

// Request Schema
const RequestSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cropType: { type: String, required: true },
  quantity: { type: Number, required: true }, // in kg
  pickupLocation: { type: String, required: true },
  pickupCoords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  destinationLocation: { type: String, required: true },
  destinationCoords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  date: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ["pending", "grouped", "assigned", "in_transit", "delivered", "cancelled"], default: "pending" },
  voiceUrl: { type: String },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "RequestGroup" }
}, { timestamps: true });

export const TransportRequest = mongoose.models.TransportRequest || mongoose.model("TransportRequest", RequestSchema);

// Group Schema
const GroupSchema = new mongoose.Schema({
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "TransportRequest" }],
  destinationLocation: { type: String, required: true },
  destinationCoords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  totalQuantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  sharedPricePerFarmer: { type: Number, required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "assigned", "in_transit", "delivered"], default: "pending" }
}, { timestamps: true });

export const RequestGroup = mongoose.models.RequestGroup || mongoose.model("RequestGroup", GroupSchema);

// Chat Schema
const ChatSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String },
  voiceUrl: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model("ChatMessage", ChatSchema);

// Check if Mocks are enabled
export function useMock() {
  return isUsingMock;
}

export { mockStore };
