"use client";

import React from "react";
import { motion } from "framer-motion";
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

export default function FeaturesGridSection() {
  return (
    <section
      id="features"
      className="bg-white text-[#1C1917] py-28 lg:py-36 border-t border-[#E7E0D8]"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5EE] text-[#1C1917] border border-[#E7E0D8] text-xs font-semibold uppercase tracking-widest mb-4">
            <Zap className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-[#1C1917] mb-4">
            Engineered for municipal precision.
          </h2>
          <p className="text-lg text-[#78716C]">
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
            className="lg:col-span-7 bg-[#1C1917] text-white rounded-2xl p-8 lg:p-10 flex flex-col justify-between border border-[#333] shadow-xl relative overflow-hidden group"
          >
            {/* Subtle corner glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#B45309]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#B45309]/20 transition-all" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider mb-6">
                <Cpu className="w-4 h-4 stroke-[2.5]" />
                <span>Core Intelligence</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                AI Auto-Routing Engine
              </h3>
              <p className="text-[#A8A29E] text-base sm:text-lg leading-relaxed max-w-xl">
                Our fine-tuned natural language processing model extracts exact problem semantics, determines urgency criteria, and assigns grievances to specific department engineers in milliseconds.
              </p>
            </div>

            {/* Simulated Routing Diagram badge inside card */}
            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <span className="text-[#A8A29E] block mb-1">Input Text / Photo</span>
                <span className="text-[#D97706] font-bold">Semantic Extraction</span>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <span className="text-[#A8A29E] block mb-1">Confidence Score</span>
                <span className="text-emerald-400 font-bold">99.4% Verified</span>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <span className="text-[#A8A29E] block mb-1">Target Department</span>
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
            className="lg:col-span-5 bg-[#FAF5EE] text-[#1C1917] rounded-2xl p-8 lg:p-10 flex flex-col justify-between border border-[#E7E0D8] shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-white text-[#B45309] border border-[#E7E0D8] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <CopyCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1C1917] mb-3 tracking-tight">
                Duplicate Detection
              </h3>
              <p className="text-[#78716C] text-base leading-relaxed">
                When multiple citizens report the same fallen tree or broken street light, spatial clustering algorithms automatically group identical reports into a single parent ticket—preventing department queue flooding.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#E7E0D8] flex items-center gap-2 text-xs font-semibold text-[#78716C]">
              <Layers className="w-4 h-4 text-[#B45309]" />
              <span>Reduces redundant officer deployments by 64%</span>
            </div>
          </motion.div>

          {/* Card 3: Live Status Tracking (4 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 bg-[#FAF5EE] text-[#1C1917] rounded-2xl p-8 flex flex-col justify-between border border-[#E7E0D8] shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-white text-blue-600 border border-[#E7E0D8] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917] mb-3 tracking-tight">
                Live Status Tracking
              </h3>
              <p className="text-[#78716C] text-sm leading-relaxed">
                Complete transparency across every departmental handoff. Citizens view milestone logs, SLA timers, and verification photos immediately upon completion.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-[#78716C] font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-time citizen notification alerts</span>
            </div>
          </motion.div>

          {/* Card 4: Officer Dashboard (4 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 bg-[#FAF5EE] text-[#1C1917] rounded-2xl p-8 flex flex-col justify-between border border-[#E7E0D8] shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-white text-violet-600 border border-[#E7E0D8] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917] mb-3 tracking-tight">
                Officer Dashboard
              </h3>
              <p className="text-[#78716C] text-sm leading-relaxed">
                A focused field interface for municipal engineers. Prioritizes tasks based on civic urgency, SLA countdowns, and geo-proximity with one-click resolution uploads.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-[#78716C] font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Optimized for mobile field inspection</span>
            </div>
          </motion.div>

          {/* Card 5: Admin Analytics (4 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 bg-[#FAF5EE] text-[#1C1917] rounded-2xl p-8 flex flex-col justify-between border border-[#E7E0D8] shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 border border-[#E7E0D8] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917] mb-3 tracking-tight">
                Admin Analytics
              </h3>
              <p className="text-[#78716C] text-sm leading-relaxed">
                City-wide infrastructure heatmaps and departmental speed benchmarks. Identify systemic infrastructure bottlenecks and enforce accountability across wards.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-[#78716C] font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ward-level performance breakdown</span>
            </div>
          </motion.div>

          {/* Card 6: Secure Role-Based Access (full width) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-12 bg-[#1C1917] text-white rounded-2xl p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border border-[#333] shadow-md"
          >
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#B45309] text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Secure Role-Based Access & Isolation
                </h3>
              </div>
              <p className="text-[#A8A29E] text-base leading-relaxed">
                Powered by enterprise-grade Row Level Security (RLS) on Supabase. Citizens only view their personal submissions, field officers only see their department queue, and city administrators get full governance oversight.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-[#A8A29E]">
                Citizen Portal
              </span>
              <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-[#D97706]">
                Officer Queue
              </span>
              <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-emerald-400">
                Admin Command Center
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
