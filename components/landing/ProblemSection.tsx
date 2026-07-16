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
      className="bg-[#faf6f0] text-[#1c1917] py-28 lg:py-36 border-t border-b border-[#e6dfd3]"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fdfbf7] border border-[#e6dfd3] text-[#1c1917] text-xs font-semibold uppercase tracking-widest mb-6 shadow-sm">
              <AlertCircle className="w-3.5 h-3.5 text-[#9e3333]" />
              <span>The Bureaucracy Trap</span>
            </div>
            <h2
              className={`${dmSerif.className} text-4xl sm:text-5xl leading-[1.12] tracking-tight text-[#1c1917] mb-4`}
            >
              Why civic complaints disappear into the void.
            </h2>
            <div className="w-16 h-1 bg-[#c86d28] mt-2 rounded-full" />
          </div>

          {/* Right Column: Short, punchy 2-3 lines + 3 contrast pillars (7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-xl sm:text-2xl text-[#4a423a] font-normal leading-relaxed mb-10">
              Traditional municipal reporting is broken by design. Citizens file complaints into opaque paper trails where <strong className="text-[#1c1917] font-semibold">manual departmental triage takes days</strong>, misrouting is endemic, and resolution progress remains completely hidden until months later.
            </p>

            {/* Subtle 3-item breakdown emphasizing the exact problem points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-[#d1c7b7]">
              <div className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-md bg-[#fce8e8] text-[#9e3333] border border-[#f8b4b4] flex items-center justify-center mb-1 shadow-sm">
                  <FileX className="w-5 h-5 stroke-[2]" />
                </div>
                <h3 className="text-base font-bold text-[#1c1917]">
                  Manual Misrouting
                </h3>
                <p className="text-sm text-[#4a423a] leading-snug">
                  Complaints bounce between siloed departments with zero automated ownership or SLA enforcement.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-md bg-[#fbefe3] text-[#c86d28] border border-[#f6ddc4] flex items-center justify-center mb-1 shadow-sm">
                  <Clock className="w-5 h-5 stroke-[2]" />
                </div>
                <h3 className="text-base font-bold text-[#1c1917]">
                  Lethargic Response
                </h3>
                <p className="text-sm text-[#4a423a] leading-snug">
                  Officers drown in unorganized queues of redundant reports instead of fixing physical issues.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-md bg-[#f4efe6] text-[#4a423a] border border-[#e6dfd3] flex items-center justify-center mb-1 shadow-sm">
                  <EyeOff className="w-5 h-5 stroke-[2]" />
                </div>
                <h3 className="text-base font-bold text-[#1c1917]">
                  Zero Visibility
                </h3>
                <p className="text-sm text-[#4a423a] leading-snug">
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
