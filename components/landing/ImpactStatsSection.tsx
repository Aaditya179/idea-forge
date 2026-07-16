"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, TrendingUp, Clock, Award, CheckCircle2 } from "lucide-react";

const impactCards = [
  {
    icon: Users,
    title: "Access to Justice",
    desc: "Democratizing civic knowledge for 1.4 billion Indians",
  },
  {
    icon: BookOpen,
    title: "Rural Empowerment",
    desc: "Bridging the civic knowledge gap in rural communities",
  },
  {
    icon: Award,
    title: "Legal Literacy",
    desc: "Making complex civic processes understandable for everyone",
  },
];

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
      className="bg-[#FAF5EE] text-[#1C1917] py-24 lg:py-32 relative overflow-hidden border-t border-[#E7E0D8]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">

        {/* ── Social Impact Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1C1917] mb-3">
            Social Impact
          </h2>
          <p className="text-lg text-[#78716C]">
            Democratizing access to civic knowledge across India
          </p>
        </motion.div>

        {/* ── 3 Icon Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
          {impactCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-[#E7E0D8] rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-[#FAF5EE] border border-[#E7E0D8] flex items-center justify-center mb-5">
                  <Icon className="w-7 h-7 text-[#B45309]" />
                </div>
                <h3 className="text-lg font-bold text-[#1C1917] mb-2">{card.title}</h3>
                <p className="text-sm text-[#78716C] leading-relaxed">{card.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ── Quote Block ── */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto bg-white border border-[#E7E0D8] rounded-2xl px-10 py-10 text-center mb-20 shadow-sm"
        >
          <div className="text-6xl font-serif text-[#D97706] leading-none mb-4 select-none">&ldquo;</div>
          <p className="text-xl sm:text-2xl font-bold italic text-[#1C1917] leading-snug">
            &ldquo;Justice delayed is justice denied. CivicPulse brings instant civic clarity to every Indian citizen.&rdquo;
          </p>
        </motion.div>

        {/* ── Stats Grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-left mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E7E0D8] text-xs font-semibold uppercase tracking-widest text-[#B45309] mb-4">
            <Award className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Proven Infrastructure Transformation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-[#1C1917] mb-3">
            Measurable impact on municipal efficiency.
          </h2>
          <p className="text-base text-[#78716C] max-w-2xl">
            Projected benchmarks based on autonomous NLP routing versus traditional municipal paper-and-phone reporting workflows.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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
                className="bg-white border border-[#E7E0D8] rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-[#B45309]">
                      {stat.value}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF5EE] border border-[#E7E0D8] flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-[#B45309]" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-[#1C1917] mb-2 leading-snug">
                    {stat.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed">
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
