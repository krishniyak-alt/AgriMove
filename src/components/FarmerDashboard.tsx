import React, { useState, useEffect } from "react";
import axios from "axios";
import { Mic, MicOff, Search, Sparkles, MapPin, Scale, Calendar, Landmark, MessageSquare, Compass, Bell, CheckCircle2, RefreshCw } from "lucide-react";
import { CustomMap } from "./CustomMap";
import { Chat } from "./Chat";

interface FarmerDashboardProps {
  user: any;
  onLogout: () => void;
}

interface Request {
  _id: string;
  cropType: string;
  quantity: number;
  pickupLocation: string;
  pickupCoords: { lat: number; lng: number };
  destinationLocation: string;
  destinationCoords: { lat: number; lng: number };
  date: string;
  price: number;
  status: "pending" | "grouped" | "assigned" | "in_transit" | "delivered" | "cancelled";
  voiceUrl?: string;
  driver?: { _id: string; id: string; name: string; phone: string; vehicleNumber?: string } | null;
  group?: { _id: string; totalQuantity: number; totalPrice: number; sharedPricePerFarmer: number } | null;
}

interface NearbyFarmer {
  id: string;
  farmerName: string;
  pickupLocation: string;
  cropType: string;
  quantity: number;
  price: number;
  distanceKm: number;
  potentialSavings: number;
  pickupCoords?: { lat: number; lng: number };
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ user, onLogout }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form input state
  const [nlpText, setNlpText] = useState("நான் தஞ்சாவூர்ல இருந்து மார்க்கெட்டுக்கு தக்காளி அனுப்பணும் 500 கிலோ இருக்கு.");
  const [isRecording, setIsRecording] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  // Editable parsed values
  const [cropType, setCropType] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [pickupLocation, setPickupLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [price, setPrice] = useState(0);

  // Nearby farmers for cost-sharing suggestions
  const [nearbyFarmers, setNearbyFarmers] = useState<NearbyFarmer[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Active chat state
  const [activeChat, setActiveChat] = useState<{ driverId: string; name: string } | null>(null);

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    fetchRequests();
    
    // Setup recognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = "ta-IN";
      rec.onstart = () => setIsRecording(true);
      rec.onresult = (e: any) => {
        setNlpText(e.results[0][0].transcript);
        setIsRecording(false);
      };
      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e.error);
        if (e.error === "not-allowed") {
          alert("Microphone permission denied. Please allow microphone access in your browser settings to record voice.");
        } else {
          alert(`Speech Recognition Error: ${e.error || "unknown error occurred"}`);
        }
        setIsRecording(false);
      };
      rec.onend = () => setIsRecording(false);
      recognitionRef.current = rec;
    }
  }, []);

  const fetchRequests = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`/api/transport/farmer/${user.id || user._id}`);
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching farmer requests:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSpeechRecord = () => {
    if (!SpeechRecognition) {
      alert("Speech Recognition API is not supported in your browser. Please try Google Chrome or Microsoft Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setNlpText("");
      setParsedData(null);
      try {
        if (!recognitionRef.current) {
          const rec = new SpeechRecognition();
          rec.continuous = false;
          rec.lang = "ta-IN";
          rec.onstart = () => setIsRecording(true);
          rec.onresult = (e: any) => {
            setNlpText(e.results[0][0].transcript);
            setIsRecording(false);
          };
          rec.onerror = (err: any) => {
            console.error("Speech Recognition Error:", err.error);
            if (err.error === "not-allowed") {
              alert("Microphone permission denied. Please allow microphone access in your browser settings to record voice.");
            } else {
              alert(`Speech Recognition Error: ${err.error || "unknown"}`);
            }
            setIsRecording(false);
          };
          rec.onend = () => setIsRecording(false);
          recognitionRef.current = rec;
        }
        recognitionRef.current.start();
      } catch (err: any) {
        console.error("Failed to start speech recognition:", err);
        alert("Could not start microphone: " + (err.message || err));
      }
    }
  };

  const handleParseNlp = async () => {
    if (!nlpText.trim()) return;
    setParsing(true);
    setParsedData(null);
    try {
      const res = await axios.post("/api/transport/parse-nlp", { text: nlpText });
      const parsed = res.data.parsed;
      setParsedData(parsed);

      // Populate form fields
      setCropType(parsed.crop);
      setQuantity(parsed.quantity);
      setPickupLocation(parsed.source);
      setDestinationLocation(parsed.destination);
      setPrice(parsed.estimatedPrice);

      // Scan nearby farmers for grouping suggestions based on pickup location
      fetchNearbyFarmers(parsed.pickupCoords);
    } catch (err) {
      console.error("NLP analysis failed:", err);
    } finally {
      setParsing(false);
    }
  };

  const fetchNearbyFarmers = async (coords: { lat: number; lng: number }) => {
    setLoadingNearby(true);
    try {
      const res = await axios.get(`/api/transport/nearby-farmers`, {
        params: { lat: coords.lat, lng: coords.lng, excludeId: user.id }
      });
      setNearbyFarmers(res.data);
    } catch (err) {
      console.error("Error fetching nearby farmers:", err);
    } finally {
      setLoadingNearby(false);
    }
  };

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropType || !quantity || !pickupLocation || !destinationLocation) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await axios.post("/api/transport/request", {
        farmerId: user.id || user._id,
        cropType,
        quantity: Number(quantity),
        pickupLocation,
        pickupCoords: parsedData?.pickupCoords,
        destinationLocation,
        destinationCoords: parsedData?.destinationCoords,
        date,
        price
      });

      // Clear form
      setParsedData(null);
      setNlpText("");
      setNearbyFarmers([]);
      
      // Refresh requests list
      fetchRequests();
      alert("Transport Request Posted! AgriMove is looking for sharing matches and drivers.");
    } catch (err) {
      console.error("Post transport request failed:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-emerald-950/20 to-zinc-950 p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Farmer Panel (விவசாயி பக்கம்)</h2>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">
            Welcome, <span className="text-emerald-400 font-semibold">{user.name}</span> • Region: {user.district || "Tamil Nadu"}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all duration-200"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Create Request (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="glass-panel rounded-2xl p-6 border border-zinc-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" /> Speak / Request transport in Tamil
            </h3>

            {/* Tamil NLP Voice Block */}
            <div className="space-y-4 mb-6">
              <p className="text-xs text-zinc-500">
                You don't need to type. Simply record your voice in Tamil saying what crop you have, where it is, and where it goes.
              </p>
              
              <div className="relative">
                <textarea
                  value={nlpText}
                  onChange={(e) => setNlpText(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900/65 border border-zinc-850 focus:border-emerald-500/50 rounded-xl p-3 pr-14 text-sm text-white focus:outline-none placeholder:text-zinc-650"
                  placeholder="எ.கா: நான் தஞ்சாவூர்ல இருந்து மார்க்கெட்டுக்கு தக்காளி அனுப்பணும்..."
                />
                
                <button
                  onClick={handleSpeechRecord}
                  className={`absolute bottom-3 right-3 h-10 w-10 rounded-full flex items-center justify-center ${
                    isRecording 
                      ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse" 
                      : "bg-zinc-800 border border-zinc-700 hover:border-emerald-500/40 text-zinc-400 hover:text-emerald-400"
                  } transition-all duration-200`}
                >
                  {isRecording ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                </button>
              </div>

              <button
                onClick={handleParseNlp}
                disabled={parsing || !nlpText.trim()}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {parsing ? "Analyzing speech parameters..." : "Parse Tamil Message / பகுப்பாய்வு செய்க"}
              </button>
            </div>

            {/* Structured editable form (only shows when parsed/initialized) */}
            {parsedData && (
              <form onSubmit={handlePostRequest} className="border-t border-zinc-900 pt-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Confirm details & Post Request</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-405">Crop Type</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cropType}
                        onChange={(e) => setCropType(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-405">Quantity (kg)</label>
                    <input
                      type="number"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-405">Pickup Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-405">Destination Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={destinationLocation}
                        onChange={(e) => setDestinationLocation(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-450">Scheduled Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-455 flex items-center justify-between">
                      <span>Transport Cost</span>
                      <span className="text-[10px] text-zinc-500">Auto-calculated</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm font-bold text-emerald-400">₹</span>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-850 rounded-xl pl-8 pr-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Nearby shared clusters suggestions */}
                {nearbyFarmers.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/25 space-y-2">
                    <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Compass className="h-4 w-4 animate-spin-slow" /> AgriMove Shared Transport Opportunities
                    </h5>
                    <p className="text-[11px] text-zinc-400">
                      We detected nearby farmers heading to {destinationLocation}. Joining a shared transport cluster will automatically discount your cost.
                    </p>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto mt-2">
                      {nearbyFarmers.map((f) => (
                        <div key={f.id} className="text-xs flex items-center justify-between bg-black/30 p-2 rounded-lg border border-zinc-900">
                          <span className="text-zinc-350">{f.farmerName} ({f.pickupLocation})</span>
                          <span className="text-emerald-450 font-semibold">Save up to {f.potentialSavings}!</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-transform shadow-lg shadow-emerald-600/20 hover:scale-[1.005]"
                >
                  Submit Request / வண்டி பதிவு செய்யவும்
                </button>
              </form>
            )}
          </div>

          {/* Map Preview of Route */}
          {parsedData && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Estimated Routing Preview</span>
              <CustomMap
                pickupCoords={parsedData.pickupCoords}
                destinationCoords={parsedData.destinationCoords}
                pickupName={pickupLocation}
                destinationName={destinationLocation}
                nearbyFarmers={nearbyFarmers}
              />
            </div>
          )}
        </div>

        {/* Right Column: Track Request & Status (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* active chat panel */}
          {activeChat && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Driver Chat System</span>
                <button
                  onClick={() => setActiveChat(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Close Chat
                </button>
              </div>
              <Chat
                currentUserId={user.id || user._id}
                recipientId={activeChat.driverId}
                recipientName={activeChat.name}
                recipientRole="Driver"
              />
            </div>
          )}

          {/* Booking History & Status Tracking */}
          <div className="glass-panel rounded-2xl p-6 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="font-bold text-white">Your Shipments</h3>
              <button 
                onClick={fetchRequests} 
                className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors"
                title="Refresh history"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <span className="text-xs text-zinc-500 mt-2">Loading shipment history...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-12 text-center text-zinc-550 text-sm">
                <Bell className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
                No active bookings. Submit your first shipment request above!
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {requests.map((req) => {
                  // Determine status style
                  const statusColors = {
                    pending: "bg-amber-500/10 border-amber-500/20 text-amber-400",
                    grouped: "bg-orange-500/10 border-orange-500/20 text-orange-400",
                    assigned: "bg-blue-500/10 border-blue-500/20 text-blue-400",
                    in_transit: "bg-purple-500/10 border-purple-500/20 text-purple-400",
                    delivered: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                    cancelled: "bg-red-500/10 border-red-500/20 text-red-400"
                  };

                  return (
                    <div
                      key={req._id}
                      className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{req.cropType} ({req.quantity} kg)</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[req.status]}`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-650 shrink-0" />
                          <span>{req.pickupLocation} ➔ {req.destinationLocation}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-650 shrink-0" />
                          <span>{req.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Landmark className="h-3.5 w-3.5 text-zinc-650 shrink-0" />
                          <span className="text-emerald-400 font-bold">₹{req.price}</span>
                          {req.group && (
                            <span className="text-[10px] text-amber-500 font-medium bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10 ml-2">
                              Group Shared Cost Saving Active!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Driver info block */}
                      {req.driver ? (
                        <div className="border-t border-zinc-900 pt-2.5 mt-1 flex items-center justify-between">
                          <div className="text-xs">
                            <p className="text-zinc-500">Driver Assigned:</p>
                            <p className="text-zinc-300 font-semibold">{req.driver.name}</p>
                            <p className="text-[10px] text-zinc-500">{req.driver.vehicleNumber || "Tata Ace"}</p>
                          </div>
                          
                          <button
                            onClick={() => setActiveChat({
                              driverId: req.driver!._id || req.driver!.id,
                              name: req.driver!.name
                            })}
                            className="h-8 px-3 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1 hover:bg-emerald-600 hover:text-white transition-all duration-200"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Chat
                          </button>
                        </div>
                      ) : req.status === "grouped" ? (
                        <div className="text-[11px] text-zinc-500 bg-zinc-900/60 p-2 rounded-lg border border-zinc-850 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-orange-400" />
                          <span>Grouped in container heading to {req.destinationLocation}. Awaiting driver assignment.</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                          <span>Searching for cargo groups or nearby logistics drivers...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default FarmerDashboard;
