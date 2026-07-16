"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DM_Serif_Display } from "next/font/google";
import {
  ArrowRight,
  Sparkles,
  Cpu,
  Clock,
  CheckCircle2,
  MapPin,
  TrendingUp,
} from "lucide-react";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
});

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#faf6f0] text-[#1c1917] pt-32 pb-24 lg:pt-44 lg:pb-32 overflow-hidden flex flex-col items-center justify-center text-center">
      {/* Subtle warm architectural grid or radial background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e6dfd3_1px,transparent_1px),linear-gradient(to_bottom,#e6dfd3_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 lg:px-12 relative z-10 w-full flex flex-col items-center">
        
        {/* Top Pill - matching reference Image 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fbefe3] border border-[#f6ddc4] text-[#c86d28] text-xs sm:text-sm font-semibold mb-8 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-[#c86d28] animate-pulse" />
          <span>India&apos;s First AI Civic Grievance Assistant</span>
        </motion.div>

        {/* Center Circular Medallion with Emblem - matching reference Image 2 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white border border-[#e6dfd3] shadow-md mx-auto flex items-center justify-center p-3 mb-6 relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-tr from-[#c86d28]/15 to-transparent rounded-full blur-xl opacity-70 pointer-events-none" />
          <img
            src="/emblem.png"
            alt="Government of India Emblem"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain relative z-10 group-hover:scale-105 transition-transform"
          />
        </motion.div>

        {/* Large Serif Title: CIVIC PULSE - exactly matching NYAYASHASTRA split typography */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`${dmSerif.className} text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight font-normal mb-4 flex flex-wrap items-center justify-center`}
        >
          <span className="text-[#1c1917]">CIVIC</span>
          <span className="text-[#c86d28]">PULSE</span>
        </motion.h1>

        {/* Italic Serif Subhead - matching reference Image 2 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`${dmSerif.className} italic text-xl sm:text-2xl md:text-3xl text-[#7a6f64] mb-6 font-normal`}
        >
          AI-Powered Civic Grievance System for India
        </motion.p>

        {/* Description Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg md:text-xl text-[#4a423a] max-w-2xl mx-auto leading-relaxed mb-10 font-normal"
        >
          Get instant, accurate, and transparent resolution for roads, water, electricity, and sanitation with verified SLA tracking across all municipal departments.
        </motion.p>

        {/* Two CTAs matching reference Image 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full sm:w-auto"
        >
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold bg-[#c86d28] text-white hover:bg-[#b35c1e] transition-all shadow-md hover:shadow-orange-900/20 active:scale-95 cursor-pointer"
          >
            <span>Start Civic Query</span>
            <ArrowRight className="w-5 h-5 stroke-[2]" />
          </Link>

          <Link
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold bg-white text-[#1c1917] border border-[#e6dfd3] hover:bg-[#fcfaf7] transition-all shadow-sm active:scale-95"
          >
            <span>▷ Watch Demo</span>
          </Link>
        </motion.div>

        {/* Interactive / Preview Card matching Image 1 & 4 white box aesthetic */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl mx-auto bg-white border border-[#e6dfd3] rounded-2xl p-6 sm:p-8 shadow-sm text-left relative"
        >
          {/* Header Bar inside card */}
          <div className="flex items-center justify-between pb-4 border-b border-[#e6dfd3] mb-6">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-[#c86d28]" />
              <span className="text-xs sm:text-sm font-semibold text-[#1c1917] uppercase tracking-wider font-mono">
                Live Auto-Routing Engine
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#1e6f43] border border-[#1e6f43]/20">
              <span className="w-2 h-2 rounded-full bg-[#1e6f43] animate-ping" />
              Active Model v4.2
            </span>
          </div>

          {/* Grievance Preview Item */}
          <div className="bg-[#faf6f0] border border-[#e6dfd3] rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-[#7a6f64]">
                    #GRV-2026-8941
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#fde8e8] text-[#9e3333] border border-[#9e3333]/20">
                    High Priority
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#1c1917]">
                  Severe Road Crater &amp; Water Logging
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#4a423a]">
                <MapPin className="w-4 h-4 text-[#c86d28]" />
                <span>Sector 14 Arterial Road, Mumbai</span>
              </div>
            </div>

            {/* AI Timeline inside Card */}
            <div className="pt-4 border-t border-[#e6dfd3] grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3.5 rounded-lg border border-[#e6dfd3]/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2f5a82]">
                  <span className="w-4 h-4 rounded-full bg-[#2f5a82]/10 flex items-center justify-center text-[10px]">✓</span>
                  <span>NLP Classification</span>
                </div>
                <p className="text-xs text-[#4a423a] leading-relaxed">
                  Categorized as <strong className="text-[#1c1917]">Roads &amp; Traffic</strong> with 99.4% confidence.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-[#e6dfd3]/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c86d28]">
                  <span className="w-4 h-4 rounded-full bg-[#fbefe3] flex items-center justify-center text-[10px]">⚡</span>
                  <span>Autonomous Routing</span>
                </div>
                <p className="text-xs text-[#4a423a] leading-relaxed">
                  Directly assigned to District Engineer <strong className="text-[#1c1917]">R. Sharma (Div 4)</strong>.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-[#e6dfd3]/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1e6f43]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Field Unit Dispatched</span>
                </div>
                <p className="text-xs text-[#4a423a] leading-relaxed">
                  Repair crew en route. Target SLA: <strong className="text-[#1c1917] font-mono">14 hours</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom stats callout inside card */}
          <div className="mt-5 pt-4 border-t border-[#e6dfd3] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7a6f64] gap-2">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#c86d28]" />
              <span>SLA Breaches avoided with AI routing: <strong className="text-[#1c1917]">100%</strong></span>
            </span>
            <span className="font-mono text-[#7a6f64]">
              Updated live in real-time
            </span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
