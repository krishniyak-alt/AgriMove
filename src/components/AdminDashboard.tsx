import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShieldAlert, BarChart3, Users, Truck, ClipboardCheck, DollarSign, Scale, ArrowRight, UserCheck, RefreshCw } from "lucide-react";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [analytics, setAnalytics] = useState<any>({
    totalRequests: 0,
    completedRequests: 0,
    activeRequests: 0,
    pendingRequests: 0,
    totalFarmers: 0,
    totalDrivers: 0,
    groupingEfficiency: 0,
    totalVolumeTons: 0,
    totalSavings: 0,
    bookings: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/transport/admin/analytics");
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error fetching admin analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-emerald-950/20 to-zinc-950 p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-emerald-450" /> System Control Panel (Admin)
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">
            Global monitoring of AgriMove transportation rates, farmer pairings, and logistics activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchAnalytics}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
            title="Refresh logs"
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

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-sm text-zinc-500 mt-3 font-medium">Aggregating global telemetry logs...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-900/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-500 uppercase block">Total Shipments</span>
                <span className="text-2xl font-bold text-white mt-1 block">{analytics.totalRequests}</span>
                <span className="text-[10px] text-zinc-550 block mt-0.5">Active: {analytics.activeRequests} | Pending: {analytics.pendingRequests}</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-400" />
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-900/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-500 uppercase block">Farmer Grouping Ratio</span>
                <span className="text-2xl font-bold text-amber-500 mt-1 block">{analytics.groupingEfficiency}%</span>
                <span className="text-[10px] text-emerald-450 block mt-0.5">Consolidation efficiency rate</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-amber-500" />
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-900/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-500 uppercase block">Volume Shipped</span>
                <span className="text-2xl font-bold text-white mt-1 block">{analytics.totalVolumeTons} Tons</span>
                <span className="text-[10px] text-zinc-550 block mt-0.5">Total weight of agricultural items</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Scale className="h-6 w-6 text-purple-400" />
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-900/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-500 uppercase block">Shared Cost Savings</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">₹{analytics.totalSavings}</span>
                <span className="text-[10px] text-emerald-500 block mt-0.5">Farmer savings via shared transport</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* User breakdown */}
          <div className="grid grid-cols-2 gap-6 max-w-md">
            <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/20 flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <span className="text-zinc-500 text-xs block">Farmers</span>
                <span className="text-lg font-bold text-white block">{analytics.totalFarmers}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/20 flex items-center gap-3">
              <Truck className="h-5 w-5 text-blue-400" />
              <div>
                <span className="text-zinc-500 text-xs block">Drivers</span>
                <span className="text-lg font-bold text-white block">{analytics.totalDrivers}</span>
              </div>
            </div>
          </div>

          {/* Bookings log table */}
          <div className="glass-panel rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-900 bg-zinc-900/40">
              <h3 className="font-bold text-white">Consignment & Routing Logs</h3>
              <p className="text-xs text-zinc-550 mt-1">Audit log of all registered produce request lines.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-zinc-900/60 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-900">
                  <tr>
                    <th className="p-4">Crop</th>
                    <th className="p-4">Weight</th>
                    <th className="p-4">Route Path</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Payer / Farmer</th>
                    <th className="p-4">Transit / Driver</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40 text-zinc-300">
                  {analytics.bookings?.map((book: any) => {
                    const statusStyles = {
                      pending: "text-amber-400 bg-amber-500/5 border-amber-500/10",
                      grouped: "text-orange-400 bg-orange-500/5 border-orange-500/10",
                      assigned: "text-blue-400 bg-blue-500/5 border-blue-500/10",
                      in_transit: "text-purple-400 bg-purple-500/5 border-purple-500/10",
                      delivered: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
                      cancelled: "text-red-400 bg-red-500/5 border-red-500/10"
                    };
                    return (
                      <tr key={book._id || book.id} className="hover:bg-zinc-900/20">
                        <td className="p-4 font-bold text-white">{book.cropType}</td>
                        <td className="p-4">{book.quantity} kg</td>
                        <td className="p-4">
                          <span className="flex items-center gap-1">
                            {book.pickupLocation} <ArrowRight className="h-3 w-3 text-zinc-600" /> {book.destinationLocation}
                          </span>
                        </td>
                        <td className="p-4 font-mono">{book.date}</td>
                        <td className="p-4 font-semibold text-zinc-400">{book.farmerName}</td>
                        <td className="p-4 text-zinc-400">{book.driverName || "---"}</td>
                        <td className="p-4 text-emerald-400 font-bold">₹{book.price}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyles[book.status as keyof typeof statusStyles]}`}>
                            {book.status?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {(!analytics.bookings || analytics.bookings.length === 0) && (
                <div className="py-12 text-center text-zinc-600">
                  No registered bookings found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;
