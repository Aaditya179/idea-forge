import React from "react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesGridSection from "@/components/landing/FeaturesGridSection";
import ImpactStatsSection from "@/components/landing/ImpactStatsSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#0F172A] selection:bg-[#F59E0B] selection:text-[#0F172A]">
      <LandingNavbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesGridSection />
      <ImpactStatsSection />
      <LandingFooter />
    </main>
  );
}
