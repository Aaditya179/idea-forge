"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Problem", href: "#problem" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Capabilities", href: "#features" },
    { name: "Impact Metrics", href: "#impact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#faf6f0]/95 backdrop-blur-md border-b border-[#e6dfd3] py-3.5 shadow-sm"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* Brand Logo & Emblem - matching reference Image 1 & 2 */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none"
        >
          <img
            src="/emblem.png"
            alt="Government of India Emblem"
            className="h-10 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col text-left">
            <span className="text-xl font-bold tracking-tight text-[#1c1917] flex items-center gap-1.5">
              CivicPulse
            </span>
            <span className="text-[10px] text-[#7a6f64] font-medium uppercase tracking-wider block -mt-0.5">
              India&apos;s Civic Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-[#4a423a] hover:text-[#c86d28] transition-colors tracking-wide"
            >
              {item.name}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/signup"
            className="text-sm font-medium text-[#4a423a] hover:text-[#1c1917] px-3.5 py-2 transition-colors"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#c86d28] text-white hover:bg-[#b35c1e] transition-all shadow-sm hover:shadow-orange-900/20 active:scale-95 cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#1c1917] hover:text-[#c86d28] focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#faf6f0] border-b border-[#e6dfd3] px-6 py-6 mt-3.5 flex flex-col gap-5 animate-in fade-in slide-in-from-top duration-200 shadow-lg">
          <nav className="flex flex-col gap-4">
            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-[#4a423a] hover:text-[#c86d28] transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-[#e6dfd3] flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold bg-[#c86d28] text-white hover:bg-[#b35c1e] transition-colors shadow-sm"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full text-sm font-medium text-[#4a423a] border border-[#e6dfd3] hover:bg-white transition-colors"
            >
              Sign Up for Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
