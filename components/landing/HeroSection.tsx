"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DM_Serif_Display } from "next/font/google";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Cpu,
  MapPin,
  TrendingUp,
} from "lucide-react";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
});

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#0F172A] text-white pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden flex items-center">
      {/* Subtle architectural grid lines background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center">
          
          {/* Left Column: Asymmetric Hero Copy (7 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col items-start text-left"
          >
            {/* Eyebrow label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold tracking-widest uppercase text-[#F59E0B] mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] animate-pulse" />
              <span>AI Civic Intelligence Platform</span>
            </div>

            {/* Large high-contrast display headline */}
            <h1
              className={`${dmSerif.className} text-5xl sm:text-6xl xl:text-7xl leading-[1.08] tracking-tight text-white mb-6`}
            >
              Complaints that{" "}
              <span className="text-[#F59E0B] underline decoration-[#F59E0B]/40 decoration-wavy decoration-2 underline-offset-8">
                resolve
              </span>{" "}
              themselves.
            </h1>

            {/* Sharp, punchy framing subhead */}
            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed mb-10 max-w-2xl">
              Eliminate bureaucratic delays with autonomous NLP categorization. We instantly parse citizen reports, cluster regional duplicates, and route high-priority grievances directly to the responsible municipal engineer—in under 2 seconds.
            </p>

            {/* Two CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg text-base font-semibold bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] transition-all shadow-lg hover:shadow-amber-500/25 active:scale-[0.99] cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Link>

              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg text-base font-semibold text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all active:scale-[0.99]"
              >
                <span>Sign Up</span>
              </Link>
            </div>

            {/* Quick trust metrics line */}
            <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-6 sm:gap-10 w-full">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
                  &lt;2s
                </div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                  AI Triage Speed
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-[#F59E0B] font-mono tracking-tight">
                  99.4%
                </div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                  Routing Accuracy
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
                  4.2x
                </div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                  Faster Resolution
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Stylized Mockup/Preview (5 columns) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative"
          >
            {/* Background glow accent */}
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#F59E0B]/20 to-transparent rounded-2xl blur-2xl opacity-60 pointer-events-none" />

            {/* Main Mockup Card */}
            <div className="relative bg-[#0B1120] border border-slate-700/80 rounded-xl p-6 shadow-2xl text-left">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                    Live Auto-Routing Engine
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Active Model v4.2
                </span>
              </div>

              {/* Grievance Preview Card */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">
                        #GRV-2026-8941
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/30">
                        High Priority
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white">
                      Severe Road Crater & Water Logging
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sector 14 Arterial Road, Near Transit Hub</span>
                </div>

                {/* AI Timeline / Process Steps inside Card */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        NLP Semantic Extraction
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Categorized as <span className="text-blue-300 font-medium">Public Works / Pothole Repair</span> with 99.4% confidence.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/15 text-[#F59E0B] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ⚡
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Autonomous Department Routing
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Directly assigned to District Engineer <span className="text-slate-300 font-medium">R. Sharma (Div 4)</span>.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ⏳
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <span>Field Unit Dispatched</span>
                        <Clock className="w-3 h-3" />
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Repair crew en route. SLA Resolution target: <span className="text-white font-mono">14 hours</span>.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom stats callout inside mockup */}
              <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>SLA Breaches avoided: <strong>100%</strong></span>
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Updated just now
                </span>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
