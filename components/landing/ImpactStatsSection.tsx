"use client";

import React from "react";
import { motion } from "framer-motion";
import { DM_Serif_Display } from "next/font/google";
import { TrendingUp, Award, Clock, CheckCircle2 } from "lucide-react";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
});

const stats = [
  {
    value: "85%",
    label: "Faster Routing & Categorization",
    desc: "Reduced from an average 3.2 days of manual review to under 2 seconds.",
    icon: TrendingUp,
  },
  {
    value: "4.2x",
    label: "Improvement in Resolution Speed",
    desc: "Direct engineer dispatch eliminates inter-departmental paper delays.",
    icon: Clock,
  },
  {
    value: "1,200+",
    label: "Monthly Officer Hours Saved",
    desc: "Municipal engineers focus 100% on physical repairs instead of triage.",
    icon: Award,
  },
  {
    value: "99.1%",
    label: "Department Assignment Accuracy",
    desc: "Zero misrouted grievances across public works, sanitation, and electrical.",
    icon: CheckCircle2,
  },
];

export default function ImpactStatsSection() {
  return (
    <section
      id="impact"
      className="bg-[#faf6f0] text-[#1c1917] py-28 lg:py-36 border-t border-[#e6dfd3] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-16 text-left"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fbefe3] border border-[#f6ddc4] text-xs font-semibold uppercase tracking-widest text-[#c86d28] mb-4">
            <Award className="w-3.5 h-3.5 text-[#c86d28]" />
            <span>Proven Infrastructure Transformation</span>
          </div>
          <h2
            className={`${dmSerif.className} text-4xl sm:text-5xl leading-tight tracking-tight text-[#1c1917] mb-4`}
          >
            Measurable impact on municipal efficiency.
          </h2>
          <p className="text-lg text-[#4a423a]">
            Projected benchmarks based on autonomous NLP routing versus traditional municipal paper-and-phone reporting workflows.
          </p>
        </motion.div>

        {/* Stats Grid matching Image 3 white card aesthetic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.6,
                  delay: idx * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="bg-white border border-[#e6dfd3] rounded-2xl p-6 flex flex-col justify-between hover:border-[#c86d28] transition-colors shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-[#c86d28]">
                      {stat.value}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#fbefe3] border border-[#f6ddc4] flex items-center justify-center text-[#c86d28]">
                      <IconComponent className="w-5 h-5 text-[#c86d28]" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-[#1c1917] mb-2 leading-snug">
                    {stat.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4a423a] leading-relaxed">
                    {stat.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
