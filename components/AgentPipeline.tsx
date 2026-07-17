"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Tag,
  Search,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { getReferenceNumber } from "@/lib/utils/referenceNumber";

// ── Types for the pipeline props ────────────────────────────────────────────

export interface ClassifyResult {
  category: string;
  priority: string;
  summary: string;
  department_id?: string | null;
}

export interface CleanTranscriptResult {
  correctedText: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarCount: number;
  isPrimary: boolean;
  clusterId: string | null;
  matchedComplaints: Array<{
    id: string;
    raw_text: string;
    created_at: string;
    priority: string | null;
  }>;
}

export interface AgentPipelineProps {
  rawText: string;
  complaintId: string;
  classifyResult: ClassifyResult | null;
  cleanResult: CleanTranscriptResult | null;
  duplicateResult: DuplicateCheckResult | null;
  onComplete: () => void;
  onClose?: () => void;
}

// ── Agent step definitions ──────────────────────────────────────────────────

interface AgentStep {
  id: string;
  name: string;
  icon: React.ReactNode;
  thinkingText: string;
  accentColor: string;      // Tailwind bg class for icon container
  accentBorder: string;     // Tailwind border class for the card
  accentText: string;       // Tailwind text class
  railColor: string;        // Tailwind bg class for the progress rail
}

const AGENT_STEPS: AgentStep[] = [
  {
    id: "understanding",
    name: "Understanding Agent",
    icon: <Brain className="w-5 h-5" />,
    thinkingText: "Analyzing language & cleaning transcript…",
    accentColor: "bg-violet-100",
    accentBorder: "border-violet-200",
    accentText: "text-violet-700",
    railColor: "bg-violet-500",
  },
  {
    id: "classification",
    name: "Classification Agent",
    icon: <Tag className="w-5 h-5" />,
    thinkingText: "Categorizing complaint type…",
    accentColor: "bg-blue-100",
    accentBorder: "border-blue-200",
    accentText: "text-blue-700",
    railColor: "bg-blue-500",
  },
  {
    id: "duplicate",
    name: "Duplicate Detection Agent",
    icon: <Search className="w-5 h-5" />,
    thinkingText: "Checking nearby reports…",
    accentColor: "bg-amber-100",
    accentBorder: "border-amber-200",
    accentText: "text-amber-700",
    railColor: "bg-amber-500",
  },
  {
    id: "priority",
    name: "Priority Agent",
    icon: <AlertTriangle className="w-5 h-5" />,
    thinkingText: "Assessing urgency level…",
    accentColor: "bg-rose-100",
    accentBorder: "border-rose-200",
    accentText: "text-rose-700",
    railColor: "bg-rose-500",
  },
  {
    id: "routing",
    name: "Routing Agent",
    icon: <ArrowRightLeft className="w-5 h-5" />,
    thinkingText: "Determining department assignment…",
    accentColor: "bg-emerald-100",
    accentBorder: "border-emerald-200",
    accentText: "text-emerald-700",
    railColor: "bg-emerald-500",
  },
  {
    id: "confirmation",
    name: "Confirmation",
    icon: <CheckCircle2 className="w-5 h-5" />,
    thinkingText: "Finalizing submission…",
    accentColor: "bg-primary-100",
    accentBorder: "border-primary-200",
    accentText: "text-primary-700",
    railColor: "bg-primary-500",
  },
];

const THINKING_DURATION = 500;  // ms before the result fades in
const STEP_GAP = 750;           // ms between one step completing and next starting

// ── Helpers ─────────────────────────────────────────────────────────────────

function getPriorityColor(p: string): string {
  switch (p) {
    case "high": return "bg-red-100 text-red-700 border-red-200";
    case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
    case "low": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getEstimatedTime(p: string): string {
  switch (p) {
    case "high": return "24–48 hours";
    case "medium": return "3–5 days";
    case "low": return "5–7 days";
    default: return "3–5 days";
  }
}

function computeCleanCaption(raw: string, cleaned: string): string {
  if (raw === cleaned) return "Transcript is clean — no corrections needed.";
  // Count word-level differences (very rough)
  const rawWords = raw.toLowerCase().split(/\s+/);
  const cleanedWords = cleaned.toLowerCase().split(/\s+/);
  let diffs = 0;
  const maxLen = Math.max(rawWords.length, cleanedWords.length);
  for (let i = 0; i < maxLen; i++) {
    if (rawWords[i] !== cleanedWords[i]) diffs++;
  }
  if (diffs === 0) return "Transcript is clean — no corrections needed.";
  return `Corrected ${diffs} transcription error${diffs > 1 ? "s" : ""}, cleaned up language for clarity.`;
}

// ── The Component ───────────────────────────────────────────────────────────

export default function AgentPipeline({
  rawText,
  complaintId,
  classifyResult,
  cleanResult,
  duplicateResult,
  onComplete,
  onClose,
}: AgentPipelineProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track which step index is currently active (-1 = not started)
  const [activeStep, setActiveStep] = useState(-1);
  // Track which steps have finished their "thinking" phase and show results
  const [revealedSteps, setRevealedSteps] = useState<Set<number>>(new Set());

  // Step through the pipeline
  const advanceStep = useCallback(
    (nextStep: number) => {
      if (nextStep >= AGENT_STEPS.length) {
        // Pipeline complete
        return;
      }
      setActiveStep(nextStep);

      // After THINKING_DURATION, reveal this step's result
      setTimeout(() => {
        setRevealedSteps((prev) => new Set(prev).add(nextStep));

        // After STEP_GAP, advance to next step
        setTimeout(() => {
          advanceStep(nextStep + 1);
        }, STEP_GAP);
      }, THINKING_DURATION);
    },
    []
  );

  useEffect(() => {
    // Start the first step after a brief initial delay
    const timer = setTimeout(() => advanceStep(0), 400);
    return () => clearTimeout(timer);
  }, [advanceStep]);

  // Build the result content for each step
  const getStepResult = (index: number): React.ReactNode => {
    switch (index) {
      case 0: {
        // Understanding Agent
        const cleaned = cleanResult?.correctedText || rawText;
        const caption = computeCleanCaption(rawText, cleaned);
        return (
          <div className="space-y-2">
            <p className="text-sm text-text-primary leading-relaxed">
              <span className="font-medium text-violet-700">&ldquo;</span>
              {cleaned}
              <span className="font-medium text-violet-700">&rdquo;</span>
            </p>
            <p className="text-xs text-text-muted italic">{caption}</p>
          </div>
        );
      }
      case 1: {
        // Classification Agent
        const category = classifyResult?.category || "Other";
        const summary = classifyResult?.summary || "Civic grievance submitted";
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                {category}
              </span>
              <span className="text-xs text-text-secondary">{summary}</span>
            </div>
            <p className="text-xs text-text-muted italic">
              Matched category based on keyword analysis and context understanding.
            </p>
          </div>
        );
      }
      case 2: {
        // Duplicate Agent
        if (!duplicateResult) {
          return (
            <div className="space-y-1">
              <p className="text-sm text-text-primary">No duplicate check available.</p>
              <p className="text-xs text-text-muted italic">Check skipped — complaint registered as new.</p>
            </div>
          );
        }
        const { similarCount, isDuplicate } = duplicateResult;
        if (similarCount > 0) {
          return (
            <div className="space-y-1">
              <p className="text-sm text-text-primary font-medium text-amber-800">
                🔗 Merged with {similarCount} confirmed similar report{similarCount > 1 ? "s" : ""} nearby
              </p>
              <p className="text-xs text-text-muted italic">
                {isDuplicate
                  ? "Your report has been linked to an existing group for faster resolution."
                  : "Your report is now the primary in this cluster."}
              </p>
            </div>
          );
        }
        return (
          <div className="space-y-1">
            <p className="text-sm text-text-primary font-medium text-emerald-700">
              ✓ No similar reports found — new issue registered
            </p>
            <p className="text-xs text-text-muted italic">
              Scanned nearby complaints for duplicates — this is a unique report.
            </p>
          </div>
        );
      }
      case 3: {
        // Priority Agent
        const priority = classifyResult?.priority || "medium";
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getPriorityColor(priority)}`}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
              </span>
              <span className="text-xs text-text-secondary">
                Est. resolution: {getEstimatedTime(priority)}
              </span>
            </div>
            <p className="text-xs text-text-muted italic">
              {priority === "high"
                ? "Urgent: safety or infrastructure risk detected."
                : priority === "medium"
                ? "Moderate impact — scheduled for prompt attention."
                : "Low impact — queued for standard processing."}
            </p>
          </div>
        );
      }
      case 4: {
        // Routing Agent
        const dept = classifyResult?.category || "Other";
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                📍 {dept} Department
              </span>
            </div>
            <p className="text-xs text-text-muted italic">
              Routed based on category classification and department workload.
            </p>
          </div>
        );
      }
      case 5: {
        // Confirmation
        const priority = classifyResult?.priority || "medium";
        return (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                ✅ Complaint Registered Successfully
              </p>
              <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                <span className="text-xs text-emerald-700 font-medium">Complaint Reference Number</span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-900 font-mono text-xs font-bold shadow-2xs">
                  {getReferenceNumber(complaintId)}
                </span>
              </div>
            </div>
            <p className="text-xs text-text-secondary">Est. resolution: {getEstimatedTime(priority)}</p>
            <button
              onClick={onComplete}
              className="w-full px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              View My Complaint →
            </button>
          </div>
        );
      }
      default: return null;
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  const overlay = (
    <motion.div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      style={{ zIndex: 99999 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-border p-6 sm:p-8"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
            aria-label="Close pipeline view"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-text-primary">AI Agent Pipeline</h2>
          <p className="text-xs text-text-secondary mt-1">
            Processing your complaint through our multi-agent system
          </p>
        </div>

        {/* Pipeline steps */}
        <div className="relative">
          {/* Vertical rail line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-0">
            {AGENT_STEPS.map((step, index) => {
              const isActive = activeStep === index;
              const isRevealed = revealedSteps.has(index);
              const isVisible = index <= activeStep;
              const isPast = index < activeStep;

              return (
                <AnimatePresence key={step.id}>
                  {isVisible && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="relative pb-6 last:pb-0"
                    >
                      {/* Rail segment fill */}
                      {isPast && (
                        <motion.div
                          className={`absolute left-[19px] top-0 w-0.5 ${step.railColor}`}
                          initial={{ height: 0 }}
                          animate={{ height: "100%" }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                      )}

                      <div className="flex items-start gap-4">
                        {/* Step indicator dot */}
                        <div className="relative z-10 shrink-0">
                          <motion.div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                              isRevealed
                                ? `${step.accentColor} ${step.accentBorder} ${step.accentText}`
                                : isActive
                                ? `bg-white border-primary-300 text-primary-500`
                                : `bg-surface-raised border-border text-text-muted`
                            }`}
                          >
                            {isRevealed ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 15 }}
                              >
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              </motion.div>
                            ) : isActive ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              step.icon
                            )}
                          </motion.div>
                        </div>

                        {/* Card */}
                        <div
                          className={`flex-1 min-w-0 rounded-xl border p-4 transition-all duration-300 ${
                            isRevealed
                              ? `bg-white ${step.accentBorder} shadow-sm`
                              : isActive
                              ? "bg-white border-primary-200 shadow-sm"
                              : "bg-surface-raised border-border"
                          }`}
                        >
                          {/* Agent name */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`${step.accentText}`}>
                              {step.icon}
                            </span>
                            <h3 className="text-sm font-bold text-text-primary">
                              {step.name}
                            </h3>
                          </div>

                          {/* Thinking state or result */}
                          <AnimatePresence mode="wait">
                            {!isRevealed && isActive ? (
                              <motion.div
                                key="thinking"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                              >
                                <span className="flex gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </span>
                                <span className="text-xs text-text-muted">
                                  {step.thinkingText}
                                </span>
                              </motion.div>
                            ) : isRevealed ? (
                              <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                {getStepResult(index)}
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(overlay, document.body);
}
