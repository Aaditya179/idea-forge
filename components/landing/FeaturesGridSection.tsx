"use client";

import React from "react";
import { motion } from "framer-motion";
import { DM_Serif_Display } from "next/font/google";
import {
  Cpu,
  CopyCheck,
  Activity,
  Briefcase,
  BarChart3,
  ShieldCheck,
  Zap,
  CheckCircle,
  Layers,
} from "lucide-react";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
});

export default function FeaturesGridSection() {
  return (
    <section
      id="features"
      className="bg-[#faf6f0] text-[#1c1917] py-28 lg:py-36 border-t border-[#e6dfd3]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fdfbf7] border border-[#e6dfd3] text-[#1c1917] text-xs font-semibold uppercase tracking-widest mb-4 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-[#c86d28]" />
            <span>Platform Capabilities</span>
          </div>
          <h2
            className={`${dmSerif.className} text-4xl sm:text-5xl leading-tight tracking-tight text-[#1c1917] mb-4`}
          >
            Engineered for municipal precision.
          </h2>
          <p className="text-lg text-[#4a423a]">
            Every feature is designed to cut through bureaucratic inertia and deliver rapid, verifiable community improvements.
          </p>
        </motion.div>

        {/* Asymmetric Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Card 1: AI Auto-Routing (Featured Large Card spanning 7 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 bg-[#1c1917] text-white rounded-2xl p-8 lg:p-10 flex flex-col justify-between border border-[#4a423a] shadow-xl relative overflow-hidden group"
          >
            {/* Subtle corner glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#c86d28]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#c86d28]/25 transition-all" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#c86d28] text-white text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                <Cpu className="w-4 h-4 stroke-[2.5]" />
                <span>Core Intelligence</span>
              </div>
              <h3
                className={`${dmSerif.className} text-3xl sm:text-4xl text-white mb-4 tracking-tight`}
              >
                AI Auto-Routing Engine
              </h3>
              <p className="text-[#d1c7b7] text-base sm:text-lg leading-relaxed max-w-xl">
                Our fine-tuned natural language processing model extracts exact problem semantics, determines urgency criteria, and assigns grievances to specific department engineers in milliseconds.
              </p>
            </div>

            {/* Simulated Routing Diagram badge inside card */}
            <div className="mt-8 pt-6 border-t border-[#4a423a]/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-[#2c2622]/90 p-3 rounded-lg border border-[#4a423a]/60">
                <span className="text-[#7a6f64] block mb-1">Input Text / Photo</span>
                <span className="text-[#efa874] font-bold">Semantic Extraction</span>
              </div>
              <div className="bg-[#2c2622]/90 p-3 rounded-lg border border-[#4a423a]/60">
                <span className="text-[#7a6f64] block mb-1">Confidence Score</span>
                <span className="text-[#4ade80] font-bold">99.4% Verified</span>
              </div>
              <div className="bg-[#2c2622]/90 p-3 rounded-lg border border-[#4a423a]/60">
                <span className="text-[#7a6f64] block mb-1">Target Department</span>
                <span className="text-white font-bold">Auto-Assigned</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Duplicate Detection (5 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 bg-white text-[#1c1917] rounded-2xl p-8 lg:p-10 flex flex-col justify-between border border-[#e6dfd3] shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#fbefe3] text-[#c86d28] border border-[#f6ddc4] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <CopyCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1c1917] mb-3 tracking-tight">
                Duplicate Detection
              </h3>
              <p className="text-[#4a423a] text-base leading-relaxed">
                When multiple citizens report the same fallen tree or broken street light, spatial clustering algorithms automatically group identical reports into a single parent ticket—preventing department queue flooding.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#f4efe6] flex items-center gap-2 text-xs font-semibold text-[#7a6f64]">
              <Layers className="w-4 h-4 text-[#c86d28]" />
              <span>Reduces redundant officer deployments by 64%</span>
            </div>
          </motion.div>

          {/* Card 3: Live Status Tracking (4 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 bg-white text-[#1c1917] rounded-2xl p-8 flex flex-col justify-between border border-[#e6dfd3] shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#e8f1f8] text-[#2f5a82] border border-[#b8d4ea] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-[#1c1917] mb-3 tracking-tight">
                Live Status Tracking
              </h3>
              <p className="text-[#4a423a] text-sm leading-relaxed">
                Complete transparency across every departmental handoff. Citizens view milestone logs, SLA timers, and verification photos immediately upon completion.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-[#7a6f64] font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-[#1e6f43]" />
              <span>Real-time citizen notification alerts</span>
            </div>
          </motion.div>

          {/* Card 4: Officer Dashboard (4 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 bg-white text-[#1c1917] rounded-2xl p-8 flex flex-col justify-between border border-[#e6dfd3] shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#f3e8ff] text-[#5b4a8e] border border-[#ddd6fe] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-[#1c1917] mb-3 tracking-tight">
                Officer Dashboard
              </h3>
              <p className="text-[#4a423a] text-sm leading-relaxed">
                A focused field interface for municipal engineers. Prioritizes tasks based on civic urgency, SLA countdowns, and geo-proximity with one-click resolution uploads.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-[#7a6f64] font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-[#1e6f43]" />
              <span>Optimized for mobile field inspection</span>
            </div>
          </motion.div>

          {/* Card 5: Admin Analytics (4 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 bg-white text-[#1c1917] rounded-2xl p-8 flex flex-col justify-between border border-[#e6dfd3] shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#eaf6ee] text-[#1e6f43] border border-[#bce3ca] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-[#1c1917] mb-3 tracking-tight">
                Admin Analytics
              </h3>
              <p className="text-[#4a423a] text-sm leading-relaxed">
                City-wide infrastructure heatmaps and departmental speed benchmarks. Identify systemic infrastructure bottlenecks and enforce accountability across wards.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-[#7a6f64] font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-[#1e6f43]" />
              <span>Ward-level performance breakdown</span>
            </div>
          </motion.div>

          {/* Card 6: Secure Role-Based Access (Span full width 12 columns for striking asymmetric finish) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-12 bg-[#1c1917] text-white rounded-2xl p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border border-[#4a423a] shadow-xl"
          >
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#c86d28] text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Secure Role-Based Access & Isolation
                </h3>
              </div>
              <p className="text-[#d1c7b7] text-base leading-relaxed">
                Powered by enterprise-grade Row Level Security (RLS) on Supabase. Citizens only view their personal submissions, field officers only see their department queue, and city administrators get full governance oversight.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <span className="px-4 py-2 rounded-lg bg-[#2c2622] border border-[#4a423a] text-xs font-semibold text-[#e8f1f8]">
                Citizen Portal
              </span>
              <span className="px-4 py-2 rounded-lg bg-[#2c2622] border border-[#4a423a] text-xs font-semibold text-[#efa874]">
                Officer Queue
              </span>
              <span className="px-4 py-2 rounded-lg bg-[#2c2622] border border-[#4a423a] text-xs font-semibold text-[#4ade80]">
                Admin Command Center
              </span>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
