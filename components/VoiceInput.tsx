"use client";

import React, { useEffect, useRef } from "react";
import { Mic, MicOff, ChevronDown } from "lucide-react";
import { useSpeechRecognition, SpeechLanguage } from "@/hooks/useSpeechRecognition";

// ---------------------------------------------------------------------------
// Language options shown in the selector
// ---------------------------------------------------------------------------
const LANGUAGE_OPTIONS: { code: SpeechLanguage; label: string }[] = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिंदी" },
  { code: "mr-IN", label: "मराठी" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface VoiceInputProps {
  /** Current textarea value so the component can append to it */
  value: string;
  /** Called whenever the combined (voice + existing) text changes */
  onChange: (value: string) => void;
  /** aria-describedby target for the textarea (forwarded for a11y) */
  textareaId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function VoiceInput({ value, onChange, textareaId }: VoiceInputProps) {
  const baseValueRef = useRef<string>("");
  const [isCleaning, setIsCleaning] = React.useState(false);

  const handleTranscriptUpdate = (transcript: string) => {
    // Append voice transcript to whatever text existed before recording started
    const separator =
      baseValueRef.current && !baseValueRef.current.endsWith(" ")
        ? " "
        : "";
    onChange(baseValueRef.current + separator + transcript);
  };

  const {
    isSupported,
    isListening,
    transcript: voiceTranscript,
    startListening,
    stopListening,
    language,
    setLanguage,
  } = useSpeechRecognition("en-IN", handleTranscriptUpdate);

  // When recording stops, call the server-side Groq transcript cleanup API
  useEffect(() => {
    const cleanTranscription = async () => {
      if (!isListening && voiceTranscript) {
        setIsCleaning(true);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch("/api/clean-transcript", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              rawText: voiceTranscript,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.correctedText) {
              const separator =
                baseValueRef.current && !baseValueRef.current.endsWith(" ")
                  ? " "
                  : "";
              onChange((baseValueRef.current + separator + data.correctedText).trim());
            }
          }
        } catch (err) {
          console.error("Error cleaning transcript:", err);
        } finally {
          setIsCleaning(false);
        }
      }
    };

    cleanTranscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      // Snapshot current textarea content; voice will be appended to this
      baseValueRef.current = value;
      startListening();
    }
  };

  // If the browser doesn't support SpeechRecognition, render a disabled indicator
  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="relative group">
          <button
            type="button"
            disabled
            aria-label="Voice input not supported in this browser"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-200"
          >
            <MicOff className="w-3.5 h-3.5" />
            <span>Voice unavailable</span>
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-20">
            <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
              Voice input not supported in this browser
              <div className="absolute top-full left-4 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2.5 space-y-2">
      {/* Controls row: mic button + language selector + hint text */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mic toggle button */}
        <button
          id="voice-input-mic-btn"
          type="button"
          onClick={handleMicClick}
          disabled={isCleaning}
          aria-label={isListening ? "Stop recording" : "Start voice input"}
          aria-pressed={isListening}
          aria-controls={textareaId}
          className={`
            relative inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold
            transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
            ${
              isListening
                ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200 focus-visible:ring-red-400"
                : "bg-white text-slate-700 border-slate-300 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 focus-visible:ring-primary-400"
            }
          `}
        >
          {/* Pulse ring while listening */}
          {isListening && (
            <span className="absolute inset-0 rounded-lg animate-ping bg-red-400 opacity-30 pointer-events-none" />
          )}
          <Mic
            className={`w-4 h-4 transition-transform ${isListening ? "scale-110" : ""}`}
            aria-hidden="true"
          />
          <span>{isListening ? "Stop" : isCleaning ? "Cleaning..." : "Speak"}</span>
        </button>

        {/* Language selector */}
        <div className="relative">
          <select
            id="voice-language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as SpeechLanguage)}
            disabled={isListening || isCleaning}
            aria-label="Select voice input language"
            className="
              appearance-none pl-3 pr-8 py-2 rounded-lg text-sm border border-slate-300
              bg-white text-slate-700 font-medium
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer hover:border-slate-400 transition-colors
            "
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Inline hint */}
        <p className="text-xs text-text-muted">
          {isListening ? (
            <span className="inline-flex items-center gap-1.5 text-red-600 font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Listening… speak clearly
            </span>
          ) : isCleaning ? (
            <span className="inline-flex items-center gap-1.5 text-[#F59E0B] font-medium">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-transparent border-t-[#F59E0B] animate-spin" />
              AI is correcting speech-to-text transcription...
            </span>
          ) : (
            "Tap the mic and speak in English, Hindi, or Marathi"
          )}
        </p>
      </div>
    </div>
  );
}
