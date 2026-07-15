"use client";

import React from "react";
import { motion } from "framer-motion";
import { DM_Serif_Display } from "next/font/google";
import { AlertCircle, FileX, Clock, EyeOff } from "lucide-react";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
});

export default function ProblemSection() {
  return (
    <section
      id="problem"
      className="bg-[#FAF8F5] text-[#0F172A] py-28 lg:py-36 border-t border-b border-slate-200/80"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start"
        >
          {/* Left Column: Section Tag & Punchy Headline (5 columns) */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 text-[#0F172A] text-xs font-semibold uppercase tracking-widest mb-6">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              <span>The Bureaucracy Trap</span>
            </div>
            <h2
              className={`${dmSerif.className} text-4xl sm:text-5xl leading-[1.12] tracking-tight text-[#0F172A] mb-4`}
            >
              Why civic complaints disappear into the void.
            </h2>
            <div className="w-16 h-1 bg-[#F59E0B] mt-2 rounded-full" />
          </div>

          {/* Right Column: Short, punchy 2-3 lines + 3 contrast pillars (7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-xl sm:text-2xl text-slate-700 font-normal leading-relaxed mb-10">
              Traditional municipal reporting is broken by design. Citizens file complaints into opaque paper trails where <strong className="text-[#0F172A] font-semibold">manual departmental triage takes days</strong>, misrouting is endemic, and resolution progress remains completely hidden until months later.
            </p>

            {/* Subtle 3-item breakdown emphasizing the exact problem points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-300/80">
              <div className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-md bg-red-50 text-red-600 border border-red-200/80 flex items-center justify-center mb-1">
                  <FileX className="w-5 h-5 stroke-[2]" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Manual Misrouting
                </h3>
                <p className="text-sm text-slate-600 leading-snug">
                  Complaints bounce between siloed departments with zero automated ownership or SLA enforcement.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center mb-1">
                  <Clock className="w-5 h-5 stroke-[2]" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Lethargic Response
                </h3>
                <p className="text-sm text-slate-600 leading-snug">
                  Officers drown in unorganized queues of redundant reports instead of fixing physical issues.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-800 border border-slate-300/80 flex items-center justify-center mb-1">
                  <EyeOff className="w-5 h-5 stroke-[2]" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Zero Visibility
                </h3>
                <p className="text-sm text-slate-600 leading-snug">
                  Citizens receive no tracking updates, eroding public trust and driving repeated inquiry calls.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
