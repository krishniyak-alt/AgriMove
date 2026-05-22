import React, { useState, useEffect } from "react";
import axios from "axios";
import { Truck, Landmark, ClipboardList, MapPin, Navigation, Calendar, MessageSquare, AlertCircle, TrendingUp, DollarSign, CheckCircle, RefreshCw } from "lucide-react";
import { CustomMap } from "./CustomMap";
import { Chat } from "./Chat";

interface DriverDashboardProps {
  user: any;
  onLogout: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ user, onLogout }) => {
  // Earnings & Trips stats
  const [stats, setStats] = useState({ totalEarnings: 0, tripsCompleted: 0, recentTrips: [] });
  const [statsLoading, setStatsLoading] = useState(false);

  // Job Board
  const [availableJobs, setAvailableJobs] = useState<{ singles: any[]; groups: any[] }>({ singles: [], groups: [] });
  const [jobsLoading, setJobsLoading] = useState(false);

  // Active Jobs
  const [activeJobs, setActiveJobs] = useState<{ singles: any[]; groups: any[] }>({ singles: [], groups: [] });
  const [activeLoading, setActiveLoading] = useState(false);

  // Selected Chat Farmer
  const [activeChat, setActiveChat] = useState<{ farmerId: string; name: string } | null>(null);

  useEffect(() => {
    fetchStats();
    fetchAvailableJobs();
    fetchActiveJobs();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await axios.get(`/api/transport/driver/earnings/${user.id || user._id}`);
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching driver stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAvailableJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await axios.get("/api/transport/driver/available-jobs");
      setAvailableJobs(res.data);
    } catch (err) {
      console.error("Error fetching available jobs:", err);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchActiveJobs = async () => {
    setActiveLoading(true);
    try {
      const res = await axios.get(`/api/transport/driver/active-jobs/${user.id || user._id}`);
      setActiveJobs(res.data);
    } catch (err) {
      console.error("Error fetching active jobs:", err);
    } finally {
      setActiveLoading(false);
    }
  };

  const handleAcceptJob = async (jobId: string, jobType: "single" | "group") => {
    try {
      await axios.post("/api/transport/driver/accept-job", {
        driverId: user.id || user._id,
        jobId,
        jobType
      });
      alert("Job Accepted! Head to the active trip panel to begin routing.");
      
      // Refresh state
      fetchAvailableJobs();
      fetchActiveJobs();
    } catch (err) {
      console.error("Error accepting job:", err);
      alert("Could not accept job. It might have been assigned already.");
    }
  };

  const handleUpdateStatus = async (jobId: string, jobType: "single" | "group", status: "in_transit" | "delivered") => {
    try {
      await axios.post("/api/transport/driver/update-status", {
        jobId,
        jobType,
        status
      });
      alert(`Trip marked as: ${status.replace("_", " ").toUpperCase()}`);
      
      // Refresh state
      fetchActiveJobs();
      fetchStats();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const refreshAll = () => {
    fetchStats();
    fetchAvailableJobs();
    fetchActiveJobs();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-emerald-950/20 to-zinc-950 p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Driver Panel (ஓட்டுநர் பக்கம்)</h2>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">
            Welcome, <span className="text-emerald-400 font-semibold">{user.name}</span> • Vehicle: {user.vehicleType?.replace("_", " ").toUpperCase()} ({user.vehicleNumber})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
            title="Refresh dashboard"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Total Earnings</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">₹{stats.totalEarnings}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Landmark className="h-6 w-6 text-emerald-400" />
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Trips Completed</span>
            <span className="text-2xl font-bold text-white mt-1 block">{stats.tripsCompleted}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Truck className="h-6 w-6 text-blue-400" />
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Active Loads</span>
            <span className="text-2xl font-bold text-amber-500 mt-1 block">
              {(activeJobs.singles?.length || 0) + (activeJobs.groups?.length || 0)}
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Available Jobs Board (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="glass-panel rounded-2xl p-6 border border-zinc-800">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-450" /> Available Cargo Listings
            </h3>

            {jobsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <span className="text-xs text-zinc-500 mt-2">Scanning available produce listings...</span>
              </div>
            ) : availableJobs.singles.length === 0 && availableJobs.groups.length === 0 ? (
              <div className="py-12 text-center text-zinc-550 text-sm">
                <AlertCircle className="h-8 w-8 text-zinc-700 mx-auto mb-2 animate-pulse" />
                No pending crop transport requests listed right now. Check back shortly!
              </div>
            ) : (
              <div className="space-y-6">
                {/* Grouped Shipments (Auto-Clustered for Max driver capacity and savings) */}
                {availableJobs.groups.map((grp) => (
                  <div key={grp._id} className="p-5 rounded-2xl border border-amber-500/35 bg-amber-500/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        📦 Grouped Shared Truckload
                      </span>
                      <span className="text-sm font-bold text-emerald-400">Payout: ₹{grp.totalPrice}</span>
                    </div>

                    <div className="text-xs space-y-2 text-zinc-350">
                      <p className="font-semibold text-white">Consolidated Destination: {grp.destinationLocation}</p>
                      <p>Total Group Load: <strong className="text-white">{grp.totalQuantity} kg</strong> ({grp.requests.length} Farmers consolidated)</p>
                      
                      <div className="border-t border-zinc-800/60 pt-2 mt-2 space-y-1">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Pickups included:</p>
                        {grp.requests.map((r: any) => (
                          <div key={r._id} className="flex justify-between text-[11px] text-zinc-400 pl-2">
                            <span>• {r.farmer?.name || "Farmer"} ({r.pickupLocation})</span>
                            <span className="text-zinc-500">{r.cropType} - {r.quantity}kg</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptJob(grp._id, "group")}
                      className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      Accept Group Shipment (ஏற்கவும்)
                    </button>
                  </div>
                ))}

                {/* Single Shipments */}
                {availableJobs.singles.map((single) => (
                  <div key={single._id} className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{single.cropType} ({single.quantity} kg)</span>
                        <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          SINGLE LOAD
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-zinc-550" />
                        {single.pickupLocation} ➔ {single.destinationLocation}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Farmer: {single.farmer?.name || "Farmer"} • Date: {single.date}
                      </p>
                    </div>

                    <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-zinc-900 pt-3 sm:pt-0">
                      <span className="text-sm font-bold text-emerald-400">Payout: ₹{single.price}</span>
                      <button
                        onClick={() => handleAcceptJob(single._id, "single")}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                      >
                        Accept Cargo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Jobs Tracking & Routing Map (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Chat Popup */}
          {activeChat && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Farmer Chat System</span>
                <button
                  onClick={() => setActiveChat(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Close Chat
                </button>
              </div>
              <Chat
                currentUserId={user.id || user._id}
                recipientId={activeChat.farmerId}
                recipientName={activeChat.name}
                recipientRole="Farmer"
              />
            </div>
          )}

          {/* Active Job Tracker */}
          <div className="glass-panel rounded-2xl p-6 border border-zinc-800 space-y-4">
            <div className="border-b border-zinc-900 pb-3">
              <h3 className="font-bold text-white">Active Consignment Trips</h3>
            </div>

            {activeLoading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              </div>
            ) : activeJobs.singles?.length === 0 && activeJobs.groups?.length === 0 ? (
              <div className="py-12 text-center text-zinc-550 text-xs">
                No active consignment tasks assigned. Pick up some jobs from the left board to begin!
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Group Jobs */}
                {activeJobs.groups?.map((grp) => (
                  <div key={grp._id} className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/40 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                        Active Group Shipment
                      </span>
                      <span className="text-xs font-bold text-emerald-400">Total: ₹{grp.totalPrice}</span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-white">To: {grp.destinationLocation}</p>
                      <p className="text-zinc-400">Total: {grp.totalQuantity} kg ({grp.requests?.length} Farmers)</p>
                    </div>

                    {/* Routing Map */}
                    <CustomMap
                      pickupCoords={grp.requests[0]?.pickupCoords}
                      destinationCoords={grp.destinationCoords}
                      pickupName={grp.requests[0]?.pickupLocation + " Cluster"}
                      destinationName={grp.destinationLocation}
                      isTransit={grp.status === "in_transit"}
                    />

                    {/* Status updates & chats */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-zinc-850/60">
                      <div className="grid grid-cols-2 gap-2">
                        {grp.requests.map((r: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setActiveChat({
                              farmerId: r.farmer?._id || r.farmer?.id,
                              name: r.farmer?.name || "Farmer"
                            })}
                            className="h-8 px-2 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-350 text-[10px] flex items-center justify-center gap-1"
                          >
                            <MessageSquare className="h-3 w-3 text-emerald-450" /> Farmer {idx + 1}
                          </button>
                        ))}
                      </div>

                      {grp.status === "assigned" ? (
                        <button
                          onClick={() => handleUpdateStatus(grp._id, "group", "in_transit")}
                          className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        >
                          Start Transit (பயணத்தை தொடங்கு)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(grp._id, "group", "delivered")}
                          className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                        >
                          Mark Delivered (சேர்க்கப்பட்டது)
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Active Single Jobs */}
                {activeJobs.singles?.map((single) => (
                  <div key={single._id} className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/40 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                        Active Single Shipment
                      </span>
                      <span className="text-xs font-bold text-emerald-400">Payout: ₹{single.price}</span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-white">{single.cropType} ({single.quantity} kg)</p>
                      <p className="text-zinc-400">Pickup: {single.pickupLocation} ➔ {single.destinationLocation}</p>
                    </div>

                    {/* Routing Map */}
                    <CustomMap
                      pickupCoords={single.pickupCoords}
                      destinationCoords={single.destinationCoords}
                      pickupName={single.pickupLocation}
                      destinationName={single.destinationLocation}
                      isTransit={single.status === "in_transit"}
                    />

                    {/* Status updates & chats */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-zinc-850/60">
                      <button
                        onClick={() => setActiveChat({
                          farmerId: single.farmer?._id || single.farmer?.id,
                          name: single.farmer?.name || "Farmer"
                        })}
                        className="w-full h-8 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-350 text-xs flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="h-4 w-4 text-emerald-450" /> Chat with Farmer ({single.farmer?.name})
                      </button>

                      {single.status === "assigned" ? (
                        <button
                          onClick={() => handleUpdateStatus(single._id, "single", "in_transit")}
                          className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        >
                          Start Transit (பயணத்தை தொடங்கு)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(single._id, "single", "delivered")}
                          className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                        >
                          Mark Delivered (சேர்க்கப்பட்டது)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DriverDashboard;
