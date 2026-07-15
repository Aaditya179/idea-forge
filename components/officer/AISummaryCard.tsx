"use client";

interface AISummaryCardProps {
  summary: string;
  confidence: "high" | "medium" | "low";
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

const confidenceConfig = {
  high: {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "High Confidence",
  },
  medium: {
    color: "text-amber-600",
    bg: "bg-amber-50", 
    border: "border-amber-200",
    label: "Medium Confidence",
  },
  low: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200", 
    label: "Low Confidence",
  },
};

export default function AISummaryCard({ 
  summary, 
  confidence, 
  loading, 
  error, 
  onRetry,
  className = "" 
}: AISummaryCardProps) {
  const config = confidenceConfig[confidence] || confidenceConfig.medium;

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-border p-6 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-violet-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary mb-3">AI Summary</h3>
            <div className="space-y-2">
              <div className="h-4 bg-surface-raised rounded animate-pulse" />
              <div className="h-4 bg-surface-raised rounded animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl border border-border p-6 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary mb-2">AI Summary</h3>
            <p className="text-sm text-red-600 mb-3">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs font-medium text-red-600 hover:text-red-700 underline cursor-pointer"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-border p-6 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">AI Summary</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
              {config.label}
            </span>
          </div>
          <p className="text-sm text-text-primary leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  );
}