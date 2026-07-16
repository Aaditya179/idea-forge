"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface QueueItem {
  id: string;
  raw_text: string;
  category: string | null;
  status: string;
  priority: string | null;
  location_text: string | null;
  created_at: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface OfficerChatBotProps {
  queue: QueueItem[];
  departmentName: string;
}

// ── Quick action chips ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { emoji: "📊", label: "Summarize my high-priority queue" },
  { emoji: "🚨", label: "Which tasks should I execute first and why?" },
  { emoji: "🛠️", label: "Give me a standard action plan for the top complaint" },
  { emoji: "📅", label: "Which complaints are overdue by more than 2 days?" },
];

// ── Markdown-lite renderer ────────────────────────────────────────────────────
function boldify(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderMessage(text: string) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
              <span dangerouslySetInnerHTML={{ __html: boldify(line.replace(/^[-•]\s/, "")) }} />
            </div>
          );
        }
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^(\d+)/)?.[1];
          const content = line.replace(/^\d+\.\s/, "");
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="shrink-0 font-bold opacity-60">{num}.</span>
              <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
            </div>
          );
        }
        if (line === "") return <div key={i} className="h-1" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
      })}
    </div>
  );
}

// ── Recording wave animation ──────────────────────────────────────────────────
function RecordingWaves() {
  return (
    <div className="flex items-center gap-[3px] h-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-rose-500 animate-bounce"
          style={{
            height: `${8 + (i % 3) * 4}px`,
            animationDelay: `${i * 80}ms`,
            animationDuration: "600ms",
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OfficerChatBot({ queue, departmentName }: OfficerChatBotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        queue.length === 0
          ? "Your queue is clear! No active operational anomalies require remediation plans right now. I'm here if you need general guidance."
          : `Hello! I'm your CivicPulse Copilot. I have full context of your **${queue.length} active complaint${queue.length !== 1 ? "s" : ""}** in the **${departmentName}** queue.\n\nAsk me to prioritise your workload, draft an action plan, or advise on any case. You can also 🎤 speak your question!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Voice recording state ─────────────────────────────────────────────────
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages, loading]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = { role: "user", content: trimmed };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/officer/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            current_queue: queue,
            department_name: departmentName,
          }),
        });
        const data = await res.json();
        const reply = data.reply ?? data.error ?? "Something went wrong.";
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Connection error. Please try again." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, queue, departmentName]
  );

  // ── Start recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeBlob(blob);
      };

      mr.start();
      setRecording(true);
    } catch (err) {
      setVoiceError("Microphone access denied. Please allow microphone permissions.");
      console.error("Mic error:", err);
    }
  };

  // ── Stop recording ────────────────────────────────────────────────────────
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // ── Transcribe via Groq Whisper ───────────────────────────────────────────
  const transcribeBlob = async (blob: Blob) => {
    setTranscribing(true);
    setVoiceError(null);

    try {
      const fd = new FormData();
      fd.append("audio", blob, "recording.webm");

      const res = await fetch("/api/officer/transcribe", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setVoiceError(data.error ?? "Transcription failed.");
        setTranscribing(false);
        return;
      }

      const transcript: string = data.transcript ?? "";
      if (!transcript.trim()) {
        setVoiceError("No speech detected. Please try speaking more clearly.");
        setTranscribing(false);
        return;
      }

      // Auto-fire the transcribed text as a message
      setTranscribing(false);
      sendMessage(transcript);
    } catch {
      setVoiceError("Transcription error. Please try again.");
      setTranscribing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isBusy = loading || transcribing;

  return (
    <>
      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <button
        id="officer-copilot-toggle"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-300/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        aria-label="Toggle Officer Copilot"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
        )}
      </button>

      {/* ── Chat panel ───────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[388px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/30 transition-all duration-300 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        style={{ maxHeight: "min(620px, calc(100vh - 140px))" }}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-indigo-700 rounded-t-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Officer Copilot</p>
            <p className="text-[10px] text-violet-200 truncate">{departmentName} · {queue.length} active case{queue.length !== 1 ? "s" : ""} · EN / HI / Hinglish</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-violet-200 font-medium">Live</span>
          </div>
        </div>

        {/* Quick chips */}
        <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/70 flex gap-2 overflow-x-auto scrollbar-none">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => sendMessage(a.label)}
              disabled={isBusy}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            >
              <span>{a.emoji}</span>
              <span className="max-w-[110px] truncate">{a.label.split(" ").slice(0, 4).join(" ")}…</span>
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${msg.role === "user" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                {msg.role === "user" ? "O" : "AI"}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-violet-600 text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm"}`}>
                {msg.role === "assistant" ? renderMessage(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {/* Transcribing indicator */}
          {transcribing && (
            <div className="flex gap-2.5 flex-row">
              <div className="shrink-0 w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-xs font-bold text-rose-600">🎤</div>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-rose-600 font-medium">Transcribing your voice…</span>
              </div>
            </div>
          )}

          {/* AI typing indicator */}
          {loading && !transcribing && (
            <div className="flex gap-2.5 flex-row">
              <div className="shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">AI</div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-3.5 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Voice error */}
        {voiceError && (
          <div className="mx-3 mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 flex items-center justify-between gap-2">
            <p className="text-xs text-rose-600">{voiceError}</p>
            <button onClick={() => setVoiceError(null)} className="text-rose-400 hover:text-rose-600 shrink-0 text-sm cursor-pointer">✕</button>
          </div>
        )}

        {/* Input row */}
        <div className="p-3 border-t border-slate-100 bg-white rounded-b-2xl">
          <div className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={recording ? "Recording… release to send" : "Ask in English, Hindi, or Hinglish…"}
              disabled={isBusy || recording}
              className="flex-1 resize-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 max-h-24 overflow-y-auto"
              style={{ minHeight: "20px" }}
            />

            {/* Recording waves (shown while recording) */}
            {recording && (
              <div className="shrink-0 flex items-center pr-1">
                <RecordingWaves />
              </div>
            )}

            {/* Mic button */}
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
              disabled={isBusy && !recording}
              title="Hold to record (English / Hindi / Hinglish)"
              className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                recording
                  ? "bg-rose-500 text-white scale-110 shadow-md shadow-rose-300/40"
                  : "bg-slate-200 text-slate-600 hover:bg-violet-100 hover:text-violet-700 disabled:opacity-30 disabled:cursor-not-allowed"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={recording ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* Send button */}
            <button
              onClick={() => sendMessage(input)}
              disabled={isBusy || !input.trim()}
              className="shrink-0 w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">⏎ Send · Shift+⏎ New line · 🎤 Hold mic to speak</p>
        </div>
      </div>
    </>
  );
}
