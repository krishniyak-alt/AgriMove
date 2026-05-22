import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MeshGradient } from "@paper-design/shaders-react";
import { ArrowRight, Leaf, Shield, Truck, Sparkles, MessageSquareCode } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
  onTryVoiceInput: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStarted,
  onLearnMore,
  onTryVoiceInput,
}) => {
  const [shaderLoaded, setShaderLoaded] = useState(false);

  useEffect(() => {
    // Flag to ensure client-side rendering is ready
    setShaderLoaded(true);
  }, []);

  return (
    <div className="relative min-h-[92vh] flex items-center justify-center overflow-hidden py-16 sm:py-24">
      {/* Background GPU Shader Container */}
      <div className="absolute inset-0 z-0">
        {shaderLoaded ? (
          <MeshGradient
            colors={["#064e3b", "#022c22", "#059669", "#111827", "#1e1e24"]}
            speed={0.15}
            distortion={0.45}
            swirl={0.3}
            grainMixer={0.1}
            grainOverlay={0.05}
            style={{ width: "100%", height: "100%", opacity: 0.55 }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-zinc-950 to-zinc-950 opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370b_1px,transparent_1px),linear-gradient(to_bottom,#1f29370b_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Banner Announcement */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-xs sm:text-sm font-medium mb-8 backdrop-blur-md"
        >
          <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>குறைந்த செலவில் விவசாயப் போக்குவரத்து • Low-Cost Shared Transit</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6"
        >
          <span className="text-white">Connecting Farmers to Markets with </span>
          <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-amber-300 bg-clip-text text-transparent">
            AgriMove Smart Logistics
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-400 mb-10 leading-relaxed font-light"
        >
          An AI-powered shared transport platform enabling rural farmers to automatically group shipments, optimize routing, and save up to 45% on transport costs using natural voice commands in Tamil.
        </motion.p>

        {/* Interactive Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/35 transition-all duration-200 transform hover:-translate-y-0.5 group"
          >
            Get Started / தொடங்கவும்
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
          
          <button
            onClick={onTryVoiceInput}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white font-medium transition-all duration-200 backdrop-blur-sm group"
          >
            <MessageSquareCode className="mr-2 h-5 w-5 text-emerald-400" />
            Tamil Voice Demo (குரல் பதிவு)
          </button>

          <button
            onClick={onLearnMore}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl bg-transparent border border-transparent hover:border-zinc-800/80 text-zinc-400 hover:text-zinc-200 font-medium transition-all duration-200"
          >
            Learn More
          </button>
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          <div className="flex flex-col items-center p-6 rounded-2xl border border-zinc-800/40 bg-zinc-950/40 backdrop-blur-md">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Truck className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Automated Clustering</h3>
            <p className="text-zinc-400 text-sm text-center">
              We group shipments heading in the same direction to fill transport trucks, dividing costs fairly.
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-2xl border border-zinc-800/40 bg-zinc-950/40 backdrop-blur-md">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Leaf className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Tamil NLP & Voice</h3>
            <p className="text-zinc-400 text-sm text-center">
              No typing needed. Speak in Tamil, and our speech-to-text NLP extracts details automatically.
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-2xl border border-zinc-800/40 bg-zinc-950/40 backdrop-blur-md">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Fair Pricing & Escrow</h3>
            <p className="text-zinc-400 text-sm text-center">
              Transparent cost calculation depending on weight and distance. Zero hidden agent fees.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default HeroSection;
