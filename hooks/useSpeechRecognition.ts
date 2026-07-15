"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SpeechLanguage = "en-IN" | "hi-IN" | "mr-IN";

export interface UseSpeechRecognitionReturn {
  /** Whether the browser supports the Web Speech API */
  isSupported: boolean;
  /** True while the mic is actively recording */
  isListening: boolean;
  /** The live-updating transcript (interim + final combined) */
  transcript: string;
  /** Start recording */
  startListening: () => void;
  /** Stop recording */
  stopListening: () => void;
  /** BCP-47 language tag used for recognition */
  language: SpeechLanguage;
  /** Change the locale (takes effect on next startListening call) */
  setLanguage: (lang: SpeechLanguage) => void;
}

// ---------------------------------------------------------------------------
// Minimal Web Speech API interface definitions
// (lib.dom may not expose SpeechRecognition globally depending on TS version)
// ---------------------------------------------------------------------------

interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventData extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventData extends Event {
  readonly error: string;
  readonly message: string;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEventData) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEventData) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => ISpeechRecognition;

// ---------------------------------------------------------------------------
// Browser API detection — safe in SSR (returns null on the server)
// ---------------------------------------------------------------------------

function getSpeechRecognitionClass(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useSpeechRecognition
 *
 * Wraps the browser's native Web Speech API with no external dependencies.
 *
 * @param defaultLanguage - BCP-47 locale, e.g. "en-IN", "hi-IN", "mr-IN".
 *   Defaults to "en-IN". Change locale by calling setLanguage() before startListening().
 *
 * @param onResult - Optional callback fired on every transcript update
 *   (interim or final). Parent components use this to sync textarea state.
 */
export function useSpeechRecognition(
  defaultLanguage: SpeechLanguage = "en-IN",
  onResult?: (transcript: string) => void,
): UseSpeechRecognitionReturn {
  const SpeechRecognitionClass = getSpeechRecognitionClass();
  const isSupported = SpeechRecognitionClass !== null;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguageState] = useState<SpeechLanguage>(defaultLanguage);

  // Stable ref to the active recognition instance for imperative stop/abort
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  // Accumulates all *final* result segments so they survive across interim updates
  const finalTranscriptRef = useRef<string>("");
  // Keep a mutable ref to onResult to avoid stale closure issues
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  // Keep language in a ref so startListening always uses the latest value
  const languageRef = useRef<SpeechLanguage>(language);
  const setLanguage = useCallback((lang: SpeechLanguage) => {
    languageRef.current = lang;
    setLanguageState(lang);
  }, []);

  // ---------------------------------------------------------------------------
  // startListening
  // ---------------------------------------------------------------------------
  const startListening = useCallback(() => {
    if (!SpeechRecognitionClass || isListening) return;

    // Reset the final transcript accumulator for this recording session
    finalTranscriptRef.current = "";

    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;

    recognition.lang = languageRef.current;
    recognition.interimResults = true;  // live partial results for real-time UX
    recognition.maxAlternatives = 1;
    recognition.continuous = true;      // don't auto-stop on silence pauses

    recognition.onstart = () => {
      console.log("[SpeechRecognition] started listening. lang =", recognition.lang);
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEventData) => {
      console.log("[SpeechRecognition] onresult event:", event);
      let interimText = "";
      let newFinalSegment = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          newFinalSegment += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (newFinalSegment) {
        console.log("[SpeechRecognition] final segment received:", newFinalSegment);
        finalTranscriptRef.current += newFinalSegment;
      }

      // Combine all confirmed finals + the current live interim chunk
      const combined = finalTranscriptRef.current + interimText;
      console.log("[SpeechRecognition] current combined transcript:", combined);
      setTranscript(combined);
      onResultRef.current?.(combined);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventData) => {
      // "no-speech" and "aborted" are normal when the user stops voluntarily or pauses speaking.
      // Log them as info to avoid unnecessary Next.js error overlays.
      if (event.error === "no-speech" || event.error === "aborted") {
        console.log("[SpeechRecognition] stopped:", event.error);
      } else {
        console.error(
          "[SpeechRecognition] error occurred:",
          event.error,
          event.message
        );
        console.warn("[SpeechRecognition] warning:", event.error);
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("[SpeechRecognition] stopped listening.");
      setIsListening(false);
    };

    recognition.start();
  }, [SpeechRecognitionClass, isListening]);

  // ---------------------------------------------------------------------------
  // stopListening
  // ---------------------------------------------------------------------------
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    language,
    setLanguage,
  };
}
