"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Inbox,
  ScanSearch,
  Route,
  Gauge,
  Search,
  Image as ImageIcon,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { getReferenceNumber } from "@/lib/utils/referenceNumber";

// ── Public contract ─────────────────────────────────────────────────────────
// This component is a PURE FRONTEND VISUALIZATION. It performs no network,
// database, or business logic. It animates a deterministic pipeline and then
// reflects the REAL backend outcome passed in via `result` / `error`.

export interface OrchestrationResult {
  complaintId: string;
  category: string;
  department: string;
  priority: string;
}

interface AgentOrchestrationProps {
  /** Whether an Evidence Processing Agent stage should be shown */
  hasPhoto: boolean;
  /** Real backend result — null until the actual submission succeeds */
  result: OrchestrationResult | null;
  /** Real backend error message — empty until an actual failure occurs */
  error: string;
  onViewComplaint: () => void;
  onReturnDashboard: () => void;
  /** Dismiss the modal (used on the error screen to return to review) */
  onDismiss: () => void;
}

interface AgentDef {
  id: string;
  name: string;
  caption: string;
  icon: React.ReactNode;
}

const PROCESS_MS = 780; // per-agent processing dwell before completing

function buildAgents(hasPhoto: boolean): AgentDef[] {
  const agents: AgentDef[] = [
    { id: "intake", name: "Complaint Intake Agent", caption: "Capturing complaint details…", icon: <Inbox className="w-4 h-4" /> },
    { id: "review", name: "Review Agent", caption: "Reviewing and cleaning the input…", icon: <ScanSearch className="w-4 h-4" /> },
    { id: "routing", name: "Routing Agent", caption: "Determining the right department…", icon: <Route className="w-4 h-4" /> },
    { id: "priority", name: "Priority Assessment Agent", caption: "Assessing urgency level…", icon: <Gauge className="w-4 h-4" /> },
    { id: "duplicate", name: "Duplicate Detection Agent", caption: "Scanning for similar reports nearby…", icon: <Search className="w-4 h-4" /> },
  ];
  if (hasPhoto) {
    agents.push({ id: "evidence", name: "Evidence Processing Agent", caption: "Analyzing the attached photo…", icon: <ImageIcon className="w-4 h-4" /> });
  }
  agents.push({ id: "confirmation", name: "Confirmation Agent", caption: "Finalizing and registering complaint…", icon: <BadgeCheck className="w-4 h-4" /> });
  return agents;
}

function priorityPill(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high": return "bg-red-50 text-red-700 border-red-200";
    case "medium": return "bg-amber-50 text-amber-700 border-amber-200";
    case "low": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default: return "bg-[#faf6f0] text-[#4a423a] border-[#e6dfd3]";
  }
}

export default function AgentOrchestration({
  hasPhoto,
  result,
  error,
  onViewComplaint,
  onReturnDashboard,
  onDismiss,
}: AgentOrchestrationProps) {
  const agents = useMemo(() => buildAgents(hasPhoto), [hasPhoto]);
  const lastIndex = agents.length - 1;

  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [view, setView] = useState<"pipeline" | "success" | "error">("pipeline");

  useEffect(() => setMounted(true), []);

  // A real backend failure stops the visualization immediately.
  useEffect(() => {
    if (error) setView("error");
  }, [error]);

  // Advance through every non-final agent on a fixed timer (deterministic —
  // does not depend on the network).
  useEffect(() => {
    if (view !== "pipeline") return;
    if (activeIndex >= lastIndex) return;
    const t = setTimeout(() => {
      setCompleted(activeIndex + 1);
      setActiveIndex((i) => i + 1);
    }, PROCESS_MS);
    return () => clearTimeout(t);
  }, [activeIndex, view, lastIndex]);

  // Final Confirmation Agent: only completes when the REAL result arrives.
  // If the backend is slower than the animation, it stays in "Processing…".
  useEffect(() => {
    if (view !== "pipeline") return;
    if (activeIndex !== lastIndex) return;
    if (error) {
      setView("error");
      return;
    }
    if (result) {
      const t = setTimeout(() => {
        setCompleted(agents.length);
        setView("success");
      }, 520);
      return () => clearTimeout(t);
    }
    // else: remain in processing until result/error changes (effect re-runs)
  }, [activeIndex, view, lastIndex, result, error, agents.length]);

  if (!mounted || typeof document === "undefined") return null;

  const overlay = (
    <motion.div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#1c1917]/60 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#e6dfd3]"
        initial={{ scale: 0.94, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
      >
        {/* Cinematic header */}
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-[#c86d28] to-[#9c4e17] px-6 py-5">
          {/* soft animated glow */}
          <motion.div
            aria-hidden
            className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl"
            animate={{ opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>🤖</span> CivicPulse Multi-Agent Processing
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                {view === "success"
                  ? "All agents completed successfully"
                  : view === "error"
                  ? "Processing halted"
                  : "Orchestrating your complaint through our agent pipeline"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* ───────────── PIPELINE ───────────── */}
            {view === "pipeline" && (
              <motion.div
                key="pipeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                className="relative"
              >
                {/* vertical rail */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-[#efe7db]" />

                <div className="space-y-0">
                  {agents.map((agent, index) => {
                    const isCompleted = index < completed;
                    const isProcessing = index === activeIndex && !isCompleted;
                    const isPending = index > activeIndex;

                    return (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                        className="relative pb-5 last:pb-0"
                      >
                        <div className="flex items-start gap-4">
                          {/* Node */}
                          <div className="relative z-10 shrink-0">
                            <motion.div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                                isCompleted
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                  : isProcessing
                                  ? "bg-[#fbefe3] border-[#e7b98c] text-[#c86d28]"
                                  : "bg-[#faf6f0] border-[#e6dfd3] text-[#b7ab9c]"
                              }`}
                            >
                              {isCompleted ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 14 }}>
                                  <CheckCircle2 className="w-5 h-5" />
                                </motion.div>
                              ) : isProcessing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                agent.icon
                              )}
                            </motion.div>
                            {/* processing pulse ring */}
                            {isProcessing && (
                              <motion.span
                                className="absolute inset-0 rounded-full border-2 border-[#c86d28]"
                                initial={{ opacity: 0.5, scale: 1 }}
                                animate={{ opacity: 0, scale: 1.5 }}
                                transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
                              />
                            )}
                          </div>

                          {/* Card */}
                          <div
                            className={`flex-1 min-w-0 rounded-xl border px-4 py-3 transition-all duration-300 ${
                              isProcessing
                                ? "bg-white border-[#e7b98c] shadow-sm"
                                : isCompleted
                                ? "bg-white border-emerald-100"
                                : "bg-[#faf6f0] border-[#e6dfd3]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-bold text-[#1c1917] truncate">{agent.name}</h3>
                              <StatusPill state={isCompleted ? "completed" : isProcessing ? "processing" : "pending"} />
                            </div>
                            <AnimatePresence mode="wait">
                              {isProcessing && (
                                <motion.p
                                  key="cap"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="text-xs text-[#7a6f64] mt-1"
                                >
                                  {agent.caption}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ───────────── SUCCESS ───────────── */}
            {view === "success" && result && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, delay: 0.05 }}
                    className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-[#1c1917]">🎉 Complaint Registered Successfully</h3>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#faf6f0] border border-[#e6dfd3]">
                  <span className="text-xs font-semibold text-[#7a6f64] uppercase tracking-wider">Reference Number</span>
                  <span className="px-2.5 py-1 rounded-md bg-white border border-[#f3ded0] text-[#c86d28] font-mono text-sm font-bold">
                    {getReferenceNumber(result.complaintId)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <ResultField label="Category" value={result.category} />
                  <ResultField label="Department" value={result.department} />
                  <div>
                    <p className="text-xs font-bold text-[#7a6f64] uppercase tracking-wider mb-1.5">Priority</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${priorityPill(result.priority)}`}>
                      {result.priority.charAt(0).toUpperCase() + result.priority.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onViewComplaint}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] transition-colors cursor-pointer"
                  >
                    View Complaint
                  </button>
                  <button
                    type="button"
                    onClick={onReturnDashboard}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#e6dfd3] bg-white text-sm font-semibold text-[#4a423a] hover:bg-[#faf6f0] transition-colors cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </motion.div>
            )}

            {/* ───────────── ERROR ───────────── */}
            {view === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1c1917]">Submission Failed</h3>
                  <p className="text-sm text-[#9e3333] mt-1.5">{error || "An unexpected error occurred. Please try again."}</p>
                </div>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] transition-colors cursor-pointer"
                >
                  Go Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(overlay, document.body);
}

function StatusPill({ state }: { state: "pending" | "processing" | "completed" }) {
  if (state === "completed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }
  if (state === "processing") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fbefe3] text-[#c86d28] border border-[#e7b98c] shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c86d28] animate-pulse" />
        Processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f1ece3] text-[#7a6f64] border border-[#e6dfd3] shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-[#b7ab9c]" />
      Pending
    </span>
  );
}

function ResultField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#7a6f64] uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-sm font-semibold text-[#1c1917] break-words">{value}</p>
    </div>
  );
}
