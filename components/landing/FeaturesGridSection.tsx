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
      className="bg-[#FAF8F5] text-[#0F172A] py-28 lg:py-36 border-t border-slate-200/80"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 text-[#0F172A] text-xs font-semibold uppercase tracking-widest mb-4">
            <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Platform Capabilities</span>
          </div>
          <h2
            className={`${dmSerif.className} text-4xl sm:text-5xl leading-tight tracking-tight text-[#0F172A] mb-4`}
          >
            Engineered for municipal precision.
          </h2>
          <p className="text-lg text-slate-600">
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
            className="lg:col-span-7 bg-[#0F172A] text-white rounded-2xl p-8 lg:p-10 flex flex-col justify-between border border-slate-800 shadow-xl relative overflow-hidden group"
          >
            {/* Subtle corner glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59E0B]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#F59E0B]/15 transition-all" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F59E0B] text-[#0F172A] text-xs font-bold uppercase tracking-wider mb-6">
                <Cpu className="w-4 h-4 stroke-[2.5]" />
                <span>Core Intelligence</span>
              </div>
              <h3
                className={`${dmSerif.className} text-3xl sm:text-4xl text-white mb-4 tracking-tight`}
              >
                AI Auto-Routing Engine
              </h3>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
                Our fine-tuned natural language processing model extracts exact problem semantics, determines urgency criteria, and assigns grievances to specific department engineers in milliseconds.
              </p>
            </div>

            {/* Simulated Routing Diagram badge inside card */}
            <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Input Text / Photo</span>
                <span className="text-[#F59E0B] font-bold">Semantic Extraction</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Confidence Score</span>
                <span className="text-emerald-400 font-bold">99.4% Verified</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Target Department</span>
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
            className="lg:col-span-5 bg-white text-[#0F172A] rounded-2xl p-8 lg:p-10 flex flex-col justify-between border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#F59E0B] border border-amber-200/60 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <CopyCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-2xl font-bold text-[#0F172A] mb-3 tracking-tight">
                Duplicate Detection
              </h3>
              <p className="text-slate-600 text-base leading-relaxed">
                When multiple citizens report the same fallen tree or broken street light, spatial clustering algorithms automatically group identical reports into a single parent ticket—preventing department queue flooding.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Layers className="w-4 h-4 text-[#F59E0B]" />
              <span>Reduces redundant officer deployments by 64%</span>
            </div>
          </motion.div>

          {/* Card 3: Live Status Tracking (4 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 bg-white text-[#0F172A] rounded-2xl p-8 flex flex-col justify-between border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3 tracking-tight">
                Live Status Tracking
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Complete transparency across every departmental handoff. Citizens view milestone logs, SLA timers, and verification photos immediately upon completion.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 font-medium">
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
            className="lg:col-span-4 bg-white text-[#0F172A] rounded-2xl p-8 flex flex-col justify-between border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 border border-violet-200/60 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3 tracking-tight">
                Officer Dashboard
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                A focused field interface for municipal engineers. Prioritizes tasks based on civic urgency, SLA countdowns, and geo-proximity with one-click resolution uploads.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 font-medium">
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
            className="lg:col-span-4 bg-white text-[#0F172A] rounded-2xl p-8 flex flex-col justify-between border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3 tracking-tight">
                Admin Analytics
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                City-wide infrastructure heatmaps and departmental speed benchmarks. Identify systemic infrastructure bottlenecks and enforce accountability across wards.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ward-level performance breakdown</span>
            </div>
          </motion.div>

          {/* Card 6: Secure Role-Based Access (Span full width 12 columns for striking asymmetric finish) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-12 bg-[#0F172A] text-white rounded-2xl p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border border-slate-800 shadow-md"
          >
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#F59E0B] text-[#0F172A] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Secure Role-Based Access & Isolation
                </h3>
              </div>
              <p className="text-slate-300 text-base leading-relaxed">
                Powered by enterprise-grade Row Level Security (RLS) on Supabase. Citizens only view their personal submissions, field officers only see their department queue, and city administrators get full governance oversight.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <span className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
                Citizen Portal
              </span>
              <span className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-[#F59E0B]">
                Officer Queue
              </span>
              <span className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400">
                Admin Command Center
              </span>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
