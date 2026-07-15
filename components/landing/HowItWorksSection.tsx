"use client";

import React from "react";
import { motion } from "framer-motion";
import { DM_Serif_Display } from "next/font/google";
import {
  MapPin,
  Cpu,
  Wrench,
  Activity,
  ArrowRight,
  GitCommit,
} from "lucide-react";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
});

const steps = [
  {
    num: "01",
    title: "Citizen Submits",
    desc: "Lodges grievance with location, description, and photos in under 60 seconds.",
    icon: MapPin,
  },
  {
    num: "02",
    title: "AI Understands & Routes",
    desc: "NLP models categorize department, assess urgency, and cluster duplicates instantly.",
    icon: Cpu,
  },
  {
    num: "03",
    title: "Officer Resolves",
    desc: "Designated municipal engineer receives targeted alerts and field verification tools.",
    icon: Wrench,
  },
  {
    num: "04",
    title: "Citizen Tracks",
    desc: "Real-time status tracking and transparent audit trail from submission to completion.",
    icon: Activity,
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="bg-white text-[#0F172A] py-28 lg:py-36 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-[#F59E0B] border border-amber-200/60 text-xs font-semibold uppercase tracking-widest mb-4">
            <GitCommit className="w-3.5 h-3.5" />
            <span>Autonomous Process Architecture</span>
          </div>
          <h2
            className={`${dmSerif.className} text-4xl sm:text-5xl leading-tight tracking-tight text-[#0F172A] mb-4`}
          >
            How it works from submission to resolution.
          </h2>
          <p className="text-lg text-slate-600">
            A continuous, transparent feedback loop powered by artificial intelligence and accountable departmental workflows.
          </p>
        </motion.div>

        {/* Custom Horizontal Step Flow (No Cards) */}
        <div className="relative mt-12">
          
          {/* Desktop Connecting Line across steps */}
          <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-[2px] bg-slate-200 z-0">
            {/* Active flow highlight segment */}
            <div className="absolute top-0 left-0 h-full w-2/3 bg-gradient-to-r from-[#F59E0B] via-[#0F172A] to-slate-200" />
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">
            {steps.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    duration: 0.6,
                    delay: idx * 0.15,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex flex-col items-start relative group"
                >
                  {/* Step Number & Circle Marker on the Line */}
                  <div className="flex items-center justify-between w-full mb-6">
                    <div className="w-20 h-20 rounded-full bg-[#FAF8F5] border-2 border-[#0F172A] group-hover:border-[#F59E0B] flex items-center justify-center text-[#0F172A] transition-colors shadow-sm relative">
                      <IconComponent className="w-8 h-8 stroke-[1.75] text-[#0F172A] group-hover:text-[#F59E0B] transition-colors" />
                      <span className="absolute -top-2 -right-1 px-2 py-0.5 bg-[#0F172A] text-white font-mono text-xs font-bold rounded-full shadow">
                        {step.num}
                      </span>
                    </div>

                    {/* Arrow between steps (except last) on tablet/mobile or subtle indicator */}
                    {idx < steps.length - 1 && (
                      <div className="hidden md:flex lg:hidden items-center text-slate-300 pr-4">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Step Title & Description (No box card around text, pure editorial layout) */}
                  <div className="space-y-2.5 pr-2">
                    <h3 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
                      <span>{step.title}</span>
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                      {step.desc}
                    </p>
                  </div>

                  {/* Mobile vertical connecting line (hidden on lg) */}
                  {idx < steps.length - 1 && (
                    <div className="lg:hidden w-0.5 h-12 bg-slate-200 ml-10 my-4 md:hidden" />
                  )}
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
