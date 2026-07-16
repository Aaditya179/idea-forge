"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Globe, Scale } from "lucide-react";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Problem", href: "#problem" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Capabilities", href: "#features" },
    { name: "Impact", href: "#impact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E7E0D8] py-3"
          : "bg-white border-b border-[#E7E0D8] py-3.5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group focus:outline-none shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#FAF5EE] border border-[#E7E0D8] flex items-center justify-center">
            <Scale className="w-5 h-5 text-[#B45309]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-extrabold tracking-tight">
              <span className="text-[#1C1917]">CIVIC</span>
              <span className="text-[#B45309]">PULSE</span>
            </span>
            <span className="text-[9px] text-[#78716C] font-medium tracking-wide">
              India&apos;s Civic Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-[#78716C] hover:text-[#1C1917] transition-colors"
            >
              {item.name}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {/* Language toggle */}
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E7E0D8] text-sm font-medium text-[#1C1917] hover:border-[#B45309] transition-colors bg-white">
            <Globe className="w-3.5 h-3.5 text-[#78716C]" />
            <span>EN</span>
          </button>
          {/* Currency / Hindi toggle icon */}
          <button className="w-8 h-8 rounded-full border border-[#E7E0D8] flex items-center justify-center text-sm font-bold text-[#1C1917] hover:border-[#B45309] transition-colors bg-white">
            ₹
          </button>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[#B45309] text-white hover:bg-[#92400E] transition-all shadow-sm cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#78716C] hover:text-[#1C1917] focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#E7E0D8] px-6 py-5 flex flex-col gap-4">
          <nav className="flex flex-col gap-3">
            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-[#78716C] hover:text-[#1C1917] transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-[#E7E0D8] flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold bg-[#B45309] text-white hover:bg-[#92400E] transition-colors"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full text-sm font-medium text-[#78716C] border border-[#E7E0D8] hover:bg-[#FAF5EE] transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
