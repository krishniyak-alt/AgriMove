import React, { useState } from "react";
import axios from "axios";
import { User, Lock, Phone, UserCheck, Shield, ChevronRight, Truck, Info } from "lucide-react";

interface AuthProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"farmer" | "driver">("farmer");
  
  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [district, setDistrict] = useState("Thanjavur");
  const [vehicleType, setVehicleType] = useState("mini_truck");
  const [vehicleNumber, setVehicleNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const payload = isLogin
        ? { phone, password }
        : {
            name,
            phone,
            password,
            role,
            ...(role === "farmer" ? { district } : { vehicleType, vehicleNumber })
          };

      const res = await axios.post(endpoint, payload);
      const { token, user } = res.data;

      // Store in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      onAuthSuccess(token, user);
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 sm:p-8 rounded-3xl border border-zinc-800 bg-zinc-950/80 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-zinc-500 text-sm mt-2">
          {isLogin ? "Log in to access your AgriMove account" : "Join the smart shared farming transport network"}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-850 mb-6">
        <button
          onClick={() => { setIsLogin(true); setError(""); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
            isLogin ? "bg-emerald-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Login
        </button>
        <button
          onClick={() => { setIsLogin(false); setError(""); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
            !isLogin ? "bg-emerald-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Register
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs sm:text-sm flex items-start gap-2.5">
          <Info className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Signup Role Picker */}
      {!isLogin && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setRole("farmer")}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 ${
              role === "farmer"
                ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                : "border-zinc-850 bg-zinc-900/20 text-zinc-450 hover:text-zinc-350"
            }`}
          >
            <UserCheck className="h-6 w-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Farmer (விவசாயி)</span>
          </button>
          
          <button
            type="button"
            onClick={() => setRole("driver")}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 ${
              role === "driver"
                ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                : "border-zinc-850 bg-zinc-900/20 text-zinc-450 hover:text-zinc-350"
            }`}
          >
            <Truck className="h-6 w-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Driver (ஓட்டுநர்)</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name (Registration Only) */}
        {!isLogin && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-450 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-600" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full h-12 bg-zinc-900/60 border border-zinc-850 focus:border-emerald-500/50 rounded-xl pl-11 pr-4 text-sm text-white focus:outline-none placeholder:text-zinc-650 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-450 uppercase tracking-wider">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-600" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full h-12 bg-zinc-900/60 border border-zinc-850 focus:border-emerald-500/50 rounded-xl pl-11 pr-4 text-sm text-white focus:outline-none placeholder:text-zinc-650 transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-450 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-600" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 bg-zinc-900/60 border border-zinc-850 focus:border-emerald-500/50 rounded-xl pl-11 pr-4 text-sm text-white focus:outline-none placeholder:text-zinc-650 transition-colors"
            />
          </div>
        </div>

        {/* Role-Specific fields */}
        {!isLogin && role === "farmer" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-450 uppercase tracking-wider">Farming District (மாவட்டம்)</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full h-12 bg-zinc-900/60 border border-zinc-850 focus:border-emerald-500/50 rounded-xl px-4 text-sm text-white focus:outline-none"
            >
              <option value="Thanjavur">Thanjavur (தஞ்சாவூர்)</option>
              <option value="Trichy">Trichy (திருச்சி)</option>
              <option value="Madurai">Madurai (மதுரை)</option>
              <option value="Coimbatore">Coimbatore (கோவை)</option>
              <option value="Salem">Salem (சேலம்)</option>
              <option value="Chennai">Chennai (சென்னை)</option>
            </select>
          </div>
        )}

        {!isLogin && role === "driver" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-450 uppercase tracking-wider">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full h-12 bg-zinc-900/60 border border-zinc-850 focus:border-emerald-500/50 rounded-xl px-4 text-sm text-white focus:outline-none"
              >
                <option value="mini_truck">Tata Ace (Mini)</option>
                <option value="medium_truck">Dost (Medium)</option>
                <option value="large_truck">Lorry (Large)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-450 uppercase tracking-wider">Plate Number</label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. TN 49 AB 1234"
                className="w-full h-12 bg-zinc-900/60 border border-zinc-850 focus:border-emerald-500/50 rounded-xl px-4 text-sm text-white focus:outline-none placeholder:text-zinc-650 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 mt-6"
        >
          {loading ? (
            <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <>
              {isLogin ? "Log In" : "Sign Up"}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
export default Auth;
