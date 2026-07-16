"use client";

import React from "react";
import Link from "next/link";
import { Scale, GitBranch, ExternalLink, Heart } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="bg-white text-[#78716C] border-t border-[#E7E0D8] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-[#E7E0D8]">
          {/* Brand & Mission */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FAF5EE] border border-[#E7E0D8] flex items-center justify-center">
                <Scale className="w-4 h-4 text-[#B45309]" />
              </div>
              <span className="text-base font-extrabold tracking-tight">
                <span className="text-[#1C1917]">CIVIC</span>
                <span className="text-[#B45309]">PULSE</span>
              </span>
            </Link>
            <p className="text-sm text-[#78716C] leading-relaxed max-w-sm">
              Autonomous AI Civic Grievance Lodging and Tracking System. We bridge the gap between citizens and municipal departments through instant NLP categorization, transparent SLA tracking, and real-time accountability.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
              Navigation
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <a href="#problem" className="hover:text-[#B45309] transition-colors">
                  The Bureaucracy Trap
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#B45309] transition-colors">
                  How Autonomous Routing Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#B45309] transition-colors">
                  Platform Capabilities
                </a>
              </li>
              <li>
                <a href="#impact" className="hover:text-[#B45309] transition-colors">
                  City-Wide Impact Metrics
                </a>
              </li>
            </ul>
          </div>

          {/* Hackathon & Team Details */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
              Project & Team Info
            </h4>
            <div className="bg-[#FAF5EE] border border-[#E7E0D8] rounded-xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between items-center text-[#78716C]">
                <span className="text-[#A8A29E]">Team:</span>
                <span className="font-semibold text-[#1C1917]">Team Idea Forge</span>
              </div>
              <div className="flex justify-between items-center text-[#78716C]">
                <span className="text-[#A8A29E]">Institution:</span>
                <span className="font-medium">College / Hackathon Submission</span>
              </div>
              <div className="flex justify-between items-center text-[#78716C]">
                <span className="text-[#A8A29E]">Event:</span>
                <span className="text-[#B45309] font-semibold">Civic AI Innovation 2026</span>
              </div>
              <div className="pt-2 border-t border-[#E7E0D8] flex items-center justify-between">
                <span className="text-[#A8A29E]">Repository:</span>
                <a
                  href="https://github.com/Aaditya179/idea-forge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#1C1917] hover:text-[#B45309] transition-colors font-medium"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>GitHub Repo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A8A29E] gap-4">
          <p>© {new Date().getFullYear()} CivicPulse AI Platform. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span>Built with precision and</span>
            <Heart className="w-3.5 h-3.5 text-[#B45309] fill-[#B45309]" />
            <span>for better civic infrastructure.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
