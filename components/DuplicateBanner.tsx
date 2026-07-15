"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { X, Users } from "lucide-react";

/**
 * Reads `?similar=N` from the URL and shows a dismissible info banner
 * when the citizen has just submitted a complaint that was clustered with others.
 */
export default function DuplicateBanner() {
  const params = useSearchParams();
  const similarParam = params.get("similar");
  const similarCount = similarParam ? parseInt(similarParam, 10) : 0;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (similarCount > 0) setVisible(true);
  }, [similarCount]);

  if (!visible || similarCount <= 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 mb-6 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
        <Users className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900">Your complaint was grouped with similar reports</p>
        <p className="text-sm text-blue-700 mt-0.5 leading-relaxed">
          {similarCount} similar complaint{similarCount !== 1 ? "s" : ""} already reported nearby — yours has been added
          to that group so officers can act on all of them together.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss notification"
        className="shrink-0 text-blue-400 hover:text-blue-700 transition-colors mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
