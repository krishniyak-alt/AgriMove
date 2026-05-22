import { useState, useEffect } from "react";
import axios from "axios";
import { Leaf, Lock, MapPin, Sparkles, MessageSquare, Truck, Shield, ShieldAlert, UserCheck } from "lucide-react";
import { HeroSection } from "@/components/ui/hero-section";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { TamilVoiceDemo } from "@/components/TamilVoiceDemo";
import { Auth } from "@/components/Auth";
import { FarmerDashboard } from "@/components/FarmerDashboard";
import { DriverDashboard } from "@/components/DriverDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";

// Configure base URL for backend APIs depending on environment
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"landing" | "auth" | "dashboard">("landing");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser && savedUser !== "undefined" && savedUser !== "null") {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && typeof parsedUser === "object") {
          setToken(savedToken);
          setUser(parsedUser);
          setCurrentView("dashboard");
          axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
        }
      } catch {
        // Clear corrupted localStorage data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setCheckingAuth(false);
  }, []);

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    setCurrentView("landing");
  };

  // Demo Login Helper
  const handleQuickDemoLogin = async (role: "farmer" | "driver" | "admin") => {
    setCheckingAuth(true);
    try {
      // In mock DB, we will look for a demo user or sign one up
      const demoDetails = {
        farmer: { phone: "9876543210", name: "Ramesh Thanjavur (Demo Farmer)", role: "farmer", district: "Thanjavur" },
        driver: { phone: "9876543211", name: "Selvam Lorry (Demo Driver)", role: "driver", vehicleType: "medium_truck", vehicleNumber: "TN 49 AB 5678" },
        admin: { phone: "9876543212", name: "System Admin (Demo Control)", role: "admin" }
      };

      const selected = demoDetails[role];
      const res = await axios.post("/api/auth/signup", {
        password: "demopassword123",
        ...selected
      }).catch(async (err) => {
        // If already registered, login
        return await axios.post("/api/auth/login", {
          phone: selected.phone,
          password: "demopassword123"
        });
      });

      const { token: demoToken, user: demoUser } = res.data;
      handleAuthSuccess(demoToken, demoUser);
    } catch (err) {
      console.error("Demo login failed:", err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        <span className="text-sm text-zinc-500 mt-4 font-mono">Initializing AgriMove telemetry...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-zinc-100 overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 glass-panel bg-[#0c0c0e]/75 border-b border-zinc-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            onClick={() => setCurrentView(user ? "dashboard" : "landing")}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-wide">AgriMove</span>
              <span className="hidden sm:inline-block text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/10 font-bold ml-2">Smart Log</span>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            {currentView === "landing" && (
              <>
                <button 
                  onClick={() => scrollToSection("voice-demo")}
                  className="hidden md:inline-block text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Tamil NLP Sandbox
                </button>
                <button 
                  onClick={() => scrollToSection("features")}
                  className="hidden md:inline-block text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Core Features
                </button>
              </>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden md:inline-block text-xs text-zinc-450">
                  Logged in: <strong className="text-emerald-400">{user.name}</strong> ({user.role.toUpperCase()})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-xs font-semibold text-zinc-350 hover:text-white transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView("auth")}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 text-zinc-350 hover:text-white transition-all"
                >
                  Login / Register
                </button>
                <button
                  onClick={() => handleQuickDemoLogin("farmer")}
                  className="hidden sm:inline-block px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-emerald-600/10"
                >
                  Farmer Demo
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {currentView === "landing" && (
          <div className="space-y-24 pb-24">
            {/* Hero Section */}
            <HeroSection
              onGetStarted={() => setCurrentView("auth")}
              onTryVoiceInput={() => scrollToSection("voice-demo")}
              onLearnMore={() => scrollToSection("features")}
            />

            {/* Tamil Speech NLP Demo Sandbox */}
            <section id="voice-demo" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Live NLP Tamil Voice Parsing</h2>
                <p className="text-zinc-500 max-w-xl mx-auto text-sm mt-2">
                  Test our voice intent extraction engine. Hold down the microphone, speak in Tamil, and watch the system translate and parse crop values, towns, weight, and distance!
                </p>
              </div>
              <TamilVoiceDemo />
            </section>

            {/* Quick Demo Access Bar */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-zinc-950/40 p-8 rounded-3xl border border-zinc-900">
              <h3 className="font-bold text-white text-lg mb-2">Evaluate AgriMove Roles Immediately</h3>
              <p className="text-xs text-zinc-500 mb-6">
                Click any profile below to bypass signups and immediately access the role-specific control dashboards.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleQuickDemoLogin("farmer")}
                  className="p-3 bg-zinc-900/60 hover:bg-emerald-600/10 border border-zinc-850 hover:border-emerald-500/30 rounded-xl flex flex-col items-center gap-1.5 transition-all text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  <UserCheck className="h-5 w-5 text-emerald-400" />
                  Farmer Dashboard
                </button>
                <button
                  onClick={() => handleQuickDemoLogin("driver")}
                  className="p-3 bg-zinc-900/60 hover:bg-emerald-600/10 border border-zinc-850 hover:border-emerald-500/30 rounded-xl flex flex-col items-center gap-1.5 transition-all text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  <Truck className="h-5 w-5 text-blue-400" />
                  Driver Dashboard
                </button>
                <button
                  onClick={() => handleQuickDemoLogin("admin")}
                  className="p-3 bg-zinc-900/60 hover:bg-emerald-600/10 border border-zinc-850 hover:border-emerald-500/30 rounded-xl flex flex-col items-center gap-1.5 transition-all text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  <ShieldAlert className="h-5 w-5 text-purple-400" />
                  Admin Dashboard
                </button>
              </div>
            </section>

            {/* Features Spotlight Section */}
            <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Platform Capabilities</h2>
                <p className="text-zinc-500 max-w-xl mx-auto text-sm mt-2">
                  Built to bridge rural farmers and local truck operators with cutting-edge software integration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.18)">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <Truck className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Smart Grouping Engine</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Auto-clusters different farmers' loads going to identical market hubs. Reduces fuel emission and saves up to 45% in expenses.
                  </p>
                </SpotlightCard>

                <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.18)">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                    <MessageSquare className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Voice & Tamil Native STT</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    No literacy block. Speech-to-text algorithm accepts colloquial Tamil speech messages and maps routing immediately.
                  </p>
                </SpotlightCard>

                <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.18)">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                    <Shield className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Consolidated Dispatch</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Fair, transparent billing formulas based on weight proportion and transit distance. Safe deposit guarantees for drivers.
                  </p>
                </SpotlightCard>
              </div>
            </section>
          </div>
        )}

        {currentView === "auth" && (
          <div className="py-20 px-4 sm:px-6">
            <Auth onAuthSuccess={handleAuthSuccess} />
          </div>
        )}

        {currentView === "dashboard" && user && (
          <div className="animate-in fade-in duration-300">
            {user.role === "farmer" && <FarmerDashboard user={user} onLogout={handleLogout} />}
            {user.role === "driver" && <DriverDashboard user={user} onLogout={handleLogout} />}
            {user.role === "admin" && <AdminDashboard onLogout={handleLogout} />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-950 bg-[#070708] py-8 text-center text-xs text-zinc-650">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Leaf className="h-4 w-4 text-emerald-500" />
            <span className="font-bold text-zinc-300">AgriMove smart logistics Inc.</span>
          </div>
          <p className="text-zinc-500">© 2026 AgriMove. Providing low-cost transport for agricultural produce.</p>
        </div>
      </footer>
    </div>
  );
}
