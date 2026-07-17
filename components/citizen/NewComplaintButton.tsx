"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, FileText, X, ArrowRight } from "lucide-react";

interface NewComplaintButtonProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Renders a trigger button that opens the "How would you like to register your
 * complaint?" modal. The modal offers two paths:
 *   - AI Complaint Assistant  → /citizen/ai-assistant
 *   - Manual Form             → /citizen/new  (existing flow, unchanged)
 *
 * This intentionally replaces the direct <Link href="/citizen/new"> CTAs so the
 * citizen chooses a path before the form opens. The manual route is preserved.
 */
export default function NewComplaintButton({ className, children }: NewComplaintButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-complaint-modal-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl border border-[#e6dfd3] shadow-xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#7a6f64] hover:bg-[#faf6f0] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <h2
              id="new-complaint-modal-title"
              className="text-2xl font-bold tracking-tight text-[#1c1917] pr-8"
            >
              How would you like to register your complaint?
            </h2>
            <p className="text-sm text-[#4a423a] mt-1.5 mb-6">
              Choose the fastest way for you to report the issue.
            </p>

            <div className="space-y-3">
              {/* AI Assistant option (recommended) */}
              <button
                type="button"
                onClick={() => router.push("/citizen/ai-assistant")}
                className="group w-full text-left rounded-xl border-2 border-[#c86d28] bg-[#fbefe3]/50 p-5 hover:bg-[#fbefe3] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#c86d28] flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#1c1917]">AI Complaint Assistant</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#c86d28] text-white">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-[#4a423a] mt-1 leading-relaxed">
                      Talk naturally in Hindi, English, or Hinglish. CivicPulse AI will collect the
                      required information and prepare your complaint automatically.
                    </p>
                    <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-[#c86d28]">
                      Start AI Assistant
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </button>

              {/* Manual form option */}
              <button
                type="button"
                onClick={() => router.push("/citizen/new")}
                className="group w-full text-left rounded-xl border border-[#e6dfd3] bg-white p-5 hover:border-[#c86d28]/40 hover:bg-[#faf6f0] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#faf6f0] border border-[#e6dfd3] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#4a423a]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[#1c1917]">Manual Form</h3>
                    <p className="text-sm text-[#4a423a] mt-1 leading-relaxed">
                      Fill the complaint manually using the existing form.
                    </p>
                    <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-[#4a423a]">
                      Continue Manually
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
