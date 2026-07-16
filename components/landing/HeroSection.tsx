"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#FAF5EE] text-[#1C1917] pt-28 pb-24 lg:pt-36 lg:pb-32 overflow-hidden flex items-center">
      {/* Subtle radial gradient in center */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-[#FED7AA]/30 via-[#FAF5EE]/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Faint watermark emblem */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
        <span className="text-[400px] font-black text-[#B45309] leading-none">⚖</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10 w-full text-center flex flex-col items-center">

        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#E7E0D8] bg-white text-xs font-semibold text-[#B45309] mb-8 shadow-sm"
        >
          <Sparkles className="w-3 h-3" />
          <span>India&apos;s First AI Civic Intelligence Platform</span>
        </motion.div>

        {/* Government Emblem */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-24 h-24 rounded-full bg-white border-2 border-[#E7E0D8] flex items-center justify-center mb-7 shadow-md"
        >
          {/* Ashoka Lion emblem placeholder — using balanced scale icon */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-4xl leading-none select-none">🦁</span>
            <span className="text-[8px] text-[#78716C] font-medium tracking-widest uppercase">सत्यमेव जयते</span>
          </div>
        </motion.div>

        {/* Main wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl sm:text-7xl xl:text-8xl font-black tracking-tight leading-none mb-4"
        >
          <span className="text-[#1C1917]">CIVIC</span>
          <span className="text-[#B45309]">PULSE</span>
        </motion.h1>

        {/* Italic subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl sm:text-2xl text-[#78716C] italic font-light mb-4"
        >
          AI-Powered Civic Helper for India
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg text-[#78716C] leading-relaxed mb-10 max-w-2xl"
        >
          Eliminate bureaucratic delays with autonomous NLP categorization. We
          instantly parse citizen reports, cluster regional duplicates, and route high-
          priority grievances directly to the responsible municipal engineer-in
          under 2 seconds.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-base font-semibold bg-[#B45309] text-white hover:bg-[#92400E] transition-all shadow-lg hover:shadow-[#B45309]/25 active:scale-[0.99] cursor-pointer"
          >
            <span>Submit a Complaint</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-base font-semibold text-[#1C1917] bg-white border border-[#E7E0D8] hover:border-[#B45309] hover:shadow-sm transition-all active:scale-[0.99]"
          >
            <span>Sign Up</span>
          </Link>
        </motion.div>

        {/* Trust metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 pt-10 border-t border-[#E7E0D8] grid grid-cols-3 gap-8 w-full max-w-lg"
        >
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#1C1917] font-mono tracking-tight">
              &lt;2s
            </div>
            <div className="text-xs text-[#A8A29E] mt-1 uppercase tracking-wider">
              AI Triage Speed
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#B45309] font-mono tracking-tight">
              99.4%
            </div>
            <div className="text-xs text-[#A8A29E] mt-1 uppercase tracking-wider">
              Routing Accuracy
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#1C1917] font-mono tracking-tight">
              4.2x
            </div>
            <div className="text-xs text-[#A8A29E] mt-1 uppercase tracking-wider">
              Faster Resolution
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
