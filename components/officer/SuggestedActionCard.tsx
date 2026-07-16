"use client";

interface SuggestedActionCardProps {
  suggestedAction: string;
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
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  medium: {
    color: "text-amber-600",
    bg: "bg-amber-50", 
    border: "border-amber-200",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
  low: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
};

export default function SuggestedActionCard({ 
  suggestedAction, 
  confidence, 
  loading, 
  error, 
  onRetry,
  className = "" 
}: SuggestedActionCardProps) {
  const config = confidenceConfig[confidence] || confidenceConfig.medium;

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-[#e6dfd3] p-6 shadow-sm ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Suggested Action</h3>
            <div className="space-y-2">
              <div className="h-4 bg-surface-raised rounded animate-pulse" />
              <div className="h-4 bg-surface-raised rounded animate-pulse w-4/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl border border-[#e6dfd3] p-6 shadow-sm ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Suggested Action</h3>
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
    <div className={`bg-white rounded-2xl border border-[#e6dfd3] p-6 shadow-sm ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
          <div className={config.color}>
            {config.icon}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Suggested Action</h3>
          <div className={`p-3 rounded-lg ${config.bg} ${config.border} border`}>
            <p className={`text-sm font-medium ${config.color} leading-relaxed`}>{suggestedAction}</p>
          </div>
        </div>
      </div>
    </div>
  );
}