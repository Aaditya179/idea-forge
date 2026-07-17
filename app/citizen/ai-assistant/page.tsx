"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getDepartmentByName } from "@/lib/queries/departments";
import { createComplaint, uploadComplaintImage } from "@/lib/queries/complaints";
import { classifyComplaint } from "@/lib/routing/keywordRouter";
import VoiceInput from "@/components/VoiceInput";
import AgentOrchestration from "@/components/citizen/AgentOrchestration";
import type { LocationData } from "@/components/LocationPicker";
import {
  Bot,
  MapPin,
  Navigation,
  Check,
  Loader2,
  X,
  ImagePlus,
  Send,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

// Reuse the exact same Leaflet map component the manual flow uses.
// Client-only import to avoid Next.js SSR errors (Leaflet needs window).
const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-xl bg-[#faf6f0] border border-[#e6dfd3] flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-[#7a6f64] animate-spin" />
    </div>
  ),
});

const MUMBAI_CENTER: [number, number] = [19.076, 72.8777];

// Conversation phases. "transition" renders no interactive area while the
// assistant is typing between steps.
type Phase =
  | "greeting"
  | "location-confirm"
  | "location-denied"
  | "location-map"
  | "problem"
  | "duration"
  | "photo"
  | "review"
  | "transition"
  | "orchestrating";

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
}

interface SubmitResult {
  complaintId: string;
  category: string;
  department: string;
  priority: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function AIAssistantPage() {
  const router = useRouter();
  const supabase = createClient();

  const [phase, setPhase] = useState<Phase>("greeting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // --- Location state ---
  const [detected, setDetected] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locError, setLocError] = useState("");
  const [confirmedLocation, setConfirmedLocation] = useState<LocationData | null>(null);

  // Map picker state
  const [mapCenter, setMapCenter] = useState<[number, number]>(MUMBAI_CENTER);
  const [pendingMarker, setPendingMarker] = useState<[number, number] | null>(null);
  const [pendingAddress, setPendingAddress] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const geocodeAbortRef = useRef<AbortController | null>(null);

  // --- Conversation state ---
  const [problem, setProblem] = useState("");
  const [duration, setDuration] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- Submit state ---
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState("");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const greetedRef = useRef(false);

  const pushMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Type an assistant message with a "thinking" delay, then the bubble.
  const typeAssistant = useCallback(
    async (text: string, thinkMs = 800) => {
      setIsTyping(true);
      await sleep(thinkMs);
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "assistant", text }]);
      await sleep(180);
    },
    []
  );

  // Auto-scroll to newest content
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, phase, result]);

  // --- Reverse geocode (reuses existing API route) ---
  const reverseGeocode = useCallback(
    async (lat: number, lng: number, signal?: AbortSignal): Promise<string> => {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`, { signal });
      if (!res.ok) throw new Error("Failed to reverse geocode");
      const data = await res.json();
      return data.address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    },
    []
  );

  // --- Location acquisition ---
  const requestLocation = useCallback(async () => {
    setLocError("");
    setPhase("transition");

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser. Please select on the map.");
      await typeAssistant("I couldn't access location on this browser. You can pick the spot on the map instead.", 700);
      setPhase("location-denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        let address: string;
        try {
          address = await reverseGeocode(lat, lng);
        } catch {
          address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
        setDetected({ lat, lng, address });
        await typeAssistant(`I found this location:\n\n📍 ${address}\n\nIs the complaint here?`, 700);
        setPhase("location-confirm");
      },
      async (err) => {
        let msg = "Couldn't get your location. Please select on the map instead.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission was denied. No problem — you can pick the spot on the map.";
        }
        setLocError(msg);
        await typeAssistant(msg, 700);
        setPhase("location-denied");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [reverseGeocode, typeAssistant]);

  // --- Greeting sequence (runs once) ---
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    (async () => {
      await typeAssistant("Hello! Welcome to CivicPulse.", 600);
      await typeAssistant("I'll help you register your complaint.", 900);
      await typeAssistant("First, let me check your current location…", 900);
      await requestLocation();
    })();
  }, [typeAssistant, requestLocation]);

  // Cleanup geocode abort on unmount
  useEffect(() => {
    return () => geocodeAbortRef.current?.abort();
  }, []);

  // --- After a location is chosen, move into the conversation ---
  const proceedAfterLocation = useCallback(
    async (loc: LocationData) => {
      setConfirmedLocation(loc);
      setPhase("transition");
      pushMessage({ role: "user", text: `✅ ${loc.locationText}` });
      await typeAssistant("Perfect!", 500);
      await typeAssistant("Please tell me what happened.", 800);
      setPhase("problem");
    },
    [pushMessage, typeAssistant]
  );

  const handleUseDetected = useCallback(() => {
    if (!detected) return;
    proceedAfterLocation({ lat: detected.lat, lng: detected.lng, locationText: detected.address });
  }, [detected, proceedAfterLocation]);

  // --- Map picker handlers (reuse LocationPickerMap) ---
  const openMap = useCallback(() => {
    setPhase("location-map");
    if (detected) {
      setMapCenter([detected.lat, detected.lng]);
      setPendingMarker([detected.lat, detected.lng]);
      setPendingAddress(detected.address);
    }
  }, [detected]);

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      setPendingMarker([lat, lng]);
      setPendingAddress("");
      setGeocoding(true);

      geocodeAbortRef.current?.abort();
      const controller = new AbortController();
      geocodeAbortRef.current = controller;

      try {
        const address = await reverseGeocode(lat, lng, controller.signal);
        setPendingAddress(address);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setPendingAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } finally {
        setGeocoding(false);
      }
    },
    [reverseGeocode]
  );

  const confirmMap = useCallback(() => {
    if (!pendingMarker || !pendingAddress) return;
    proceedAfterLocation({ lat: pendingMarker[0], lng: pendingMarker[1], locationText: pendingAddress });
  }, [pendingMarker, pendingAddress, proceedAfterLocation]);

  // --- Conversation handlers ---
  const submitProblem = useCallback(async () => {
    if (!problem.trim()) return;
    const text = problem.trim();
    setPhase("transition");
    pushMessage({ role: "user", text });
    await typeAssistant("Got it. Since when has this been happening?", 800);
    setPhase("duration");
  }, [problem, pushMessage, typeAssistant]);

  const submitDuration = useCallback(
    async (value: string) => {
      const v = value.trim();
      if (!v) return;
      setDuration(v);
      setPhase("transition");
      pushMessage({ role: "user", text: v });
      await typeAssistant(
        "Would you like to upload a photo? It helps the department verify the complaint faster.",
        800
      );
      setPhase("photo");
    },
    [pushMessage, typeAssistant]
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const goToReview = useCallback(
    async (withPhoto: boolean) => {
      setPhase("transition");
      pushMessage({ role: "user", text: withPhoto ? "📷 Photo attached" : "Skip photo" });
      await typeAssistant("Perfect! Here's what I understood.", 700);
      setPhase("review");
    },
    [pushMessage, typeAssistant]
  );

  // --- Derived review data (reuses keyword classifier for category/department) ---
  const fullText = duration ? `${problem.trim()}\n\n(Issue duration: ${duration})` : problem.trim();
  const { category, departmentName } = classifyComplaint(problem);

  // --- Submit via the EXISTING complaint submission infrastructure ---
  // NOTE: The backend calls below are unchanged. The orchestration modal is a
  // pure visualization that reflects the real `result` / `submitError` set here.
  const handleSubmit = useCallback(async () => {
    if (!confirmedLocation) return;
    setSubmitError("");
    setResult(null);
    setPhase("orchestrating");

    try {
      // 1. Profile
      const profile = await getCurrentProfile(supabase);
      if (!profile) {
        setSubmitError("Unable to load your profile. Please sign in again.");
        return;
      }

      // 2. Resolve department from keyword-classified name (same as manual flow)
      const department = await getDepartmentByName(supabase, departmentName);
      if (!department) {
        setSubmitError("Unable to resolve department. Please try again.");
        return;
      }

      // 3. Upload the optional photo (must happen before insert — image_url is stored on the row)
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadComplaintImage(supabase, imageFile, profile.id);
      }

      // 4. Insert the complaint (identical shape to the manual form)
      const complaint = await createComplaint(supabase, {
        user_id: profile.id,
        raw_text: fullText,
        category,
        department_id: department.id,
        location_text: confirmedLocation.locationText,
        image_url: imageUrl,
        latitude: confirmedLocation.lat,
        longitude: confirmedLocation.lng,
      });

      if (!complaint) {
        setSubmitError("Failed to submit complaint. Please try again.");
        return;
      }

      // 5. AI classification pipeline (sets category/department/priority in DB)
      let finalCategory = category;
      let finalPriority = "medium";
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ complaintId: complaint.id, rawText: fullText }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.category) finalCategory = data.category;
          if (data.priority) finalPriority = data.priority;
        }
      } catch (err) {
        console.warn("[AI Assistant] classification pipeline failed:", err);
      }

      // 6. Duplicate detection (reuses existing API, same as manual flow)
      try {
        const { data: fresh } = await supabase
          .from("complaints")
          .select("department_id, priority")
          .eq("id", complaint.id)
          .single();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 14000);
        await fetch("/api/check-duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            complaintId: complaint.id,
            rawText: fullText,
            lat: confirmedLocation.lat,
            lng: confirmedLocation.lng,
            departmentId: fresh?.department_id || department.id,
            priority: fresh?.priority || finalPriority,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err) {
        console.warn("[AI Assistant] duplicate check failed:", err);
      }

      // 7. Real submission succeeded — hand the true result to the modal.
      setResult({
        complaintId: complaint.id,
        category: finalCategory,
        department: finalCategory,
        priority: finalPriority,
      });
    } catch (err) {
      console.error("[AI Assistant] submission error:", err);
      setSubmitError("An unexpected error occurred. Please try again.");
    }
  }, [confirmedLocation, supabase, departmentName, imageFile, fullText, category]);

  const showComposer = !isTyping;

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-[#c86d28] flex items-center justify-center shrink-0 shadow-sm">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1c1917]">CivicPulse AI Assistant</h1>
          <p className="text-sm text-[#4a423a] mt-0.5 max-w-md">
            I&apos;m here to help you register your complaint. Just answer naturally and I&apos;ll prepare
            everything for you.
          </p>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 space-y-3">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.text}
          </Bubble>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-[#e6dfd3]">
                <span className="w-2 h-2 rounded-full bg-[#c86d28]/70 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#c86d28]/70 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#c86d28]/70 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --------- Interactive assistant widgets (left-aligned like the AI) --------- */}
        {showComposer && (phase === "location-confirm" || phase === "location-denied") && (
          <AssistantWidget>
            {phase === "location-confirm" && detected && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#1c1917]">Is the complaint at this location?</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleUseDetected}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={openMap}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#e6dfd3] bg-white text-sm font-semibold text-[#4a423a] hover:border-[#c86d28]/40 hover:bg-[#faf6f0] transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-[#c86d28]" />
                    Select on Map
                  </button>
                </div>
              </div>
            )}

            {phase === "location-denied" && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={requestLocation}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#e6dfd3] bg-white text-sm font-semibold text-[#4a423a] hover:bg-[#faf6f0] transition-colors cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-[#c86d28]" />
                  Retry location
                </button>
                <button
                  type="button"
                  onClick={openMap}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] transition-colors cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  Select on Map
                </button>
              </div>
            )}
          </AssistantWidget>
        )}

        {/* Map picker */}
        {showComposer && phase === "location-map" && (
          <AssistantWidget>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1c1917]">Tap the map to drop a pin</p>
                <button
                  type="button"
                  onClick={() => setPhase(detected ? "location-confirm" : "location-denied")}
                  className="text-[#7a6f64] hover:text-[#1c1917] transition-colors cursor-pointer"
                  aria-label="Cancel map selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                className="relative z-0 isolate h-72 rounded-xl overflow-hidden border border-[#e6dfd3]"
                style={{ isolation: "isolate", zIndex: 0 }}
              >
                <LocationPickerMap
                  center={mapCenter}
                  marker={pendingMarker}
                  onMapClick={handleMapClick}
                  zoom={14}
                  className="h-full"
                />
              </div>

              <div className="min-h-[2rem]">
                {geocoding && (
                  <div className="flex items-center gap-2 text-xs text-[#7a6f64]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Resolving address…
                  </div>
                )}
                {!geocoding && pendingAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#c86d28] mt-0.5 shrink-0" />
                    <p className="text-xs text-[#4a423a] leading-relaxed">{pendingAddress}</p>
                  </div>
                )}
                {!pendingMarker && !geocoding && (
                  <p className="text-xs text-[#7a6f64]">No pin dropped yet — tap the map above.</p>
                )}
              </div>

              <button
                type="button"
                onClick={confirmMap}
                disabled={!pendingMarker || !pendingAddress || geocoding}
                className="w-full py-2.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Confirm Location
              </button>
            </div>
          </AssistantWidget>
        )}

        {/* Problem (voice-first) */}
        {showComposer && phase === "problem" && (
          <ChatComposer
            value={problem}
            onChange={setProblem}
            onSend={submitProblem}
            textareaId="ai-problem"
            placeholder="Type or tap the mic to describe the issue…"
          />
        )}

        {/* Duration (voice or text + quick chips) */}
        {showComposer && phase === "duration" && (
          <ChatComposer
            value={duration}
            onChange={setDuration}
            onSend={() => submitDuration(duration)}
            textareaId="ai-duration"
            placeholder="e.g., since yesterday, about a week…"
            chips={["Started today", "2–3 days", "About a week", "More than a month"]}
            onChip={(c) => submitDuration(c)}
          />
        )}

        {/* Photo */}
        {showComposer && phase === "photo" && (
          <AssistantWidget>
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-[#e6dfd3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Complaint attachment preview" className="w-full h-52 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#1c1917]/80 text-white flex items-center justify-center hover:bg-[#1c1917] transition-colors cursor-pointer"
                    aria-label="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="ai-image"
                  className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-[#e6dfd3] hover:border-[#c86d28] bg-[#faf6f0] transition-all cursor-pointer"
                >
                  <ImagePlus className="w-7 h-7 text-[#7a6f64] mb-2" />
                  <span className="text-sm font-semibold text-[#4a423a]">Click to attach a photo</span>
                  <span className="text-xs text-[#7a6f64] font-mono mt-0.5">PNG, JPG, WEBP</span>
                  <input id="ai-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goToReview(false)}
                  className="px-5 py-2.5 rounded-full border border-[#e6dfd3] bg-white text-sm font-semibold text-[#4a423a] hover:bg-[#faf6f0] transition-colors cursor-pointer"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => goToReview(!!imageFile)}
                  disabled={!imageFile}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Upload
                </button>
              </div>
            </div>
          </AssistantWidget>
        )}

        {/* Review */}
        {showComposer && phase === "review" && confirmedLocation && (
          <AssistantWidget wide>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReviewField label="Location" value={confirmedLocation.locationText} />
                <ReviewField label="Category" value={category} />
                <ReviewField label="Department" value={departmentName} />
                <ReviewField label="Duration" value={duration || "—"} />
              </div>

              <div>
                <p className="text-xs font-bold text-[#7a6f64] uppercase tracking-wider mb-1.5">Description</p>
                <p className="text-sm text-[#1c1917] leading-relaxed whitespace-pre-wrap p-3 rounded-xl bg-[#faf6f0] border border-[#e6dfd3]">
                  {problem}
                </p>
              </div>

              {imagePreview && (
                <div>
                  <p className="text-xs font-bold text-[#7a6f64] uppercase tracking-wider mb-1.5">Photo</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Complaint attachment" className="rounded-xl border border-[#e6dfd3] max-h-52 object-cover" />
                </div>
              )}

              <div className="flex items-start gap-2 p-3 rounded-xl bg-[#fbefe3]/60 border border-[#f6ddc4]">
                <Sparkles className="w-4 h-4 text-[#c86d28] mt-0.5 shrink-0" />
                <p className="text-xs text-[#4a423a] leading-relaxed">
                  Priority will be determined automatically by AI after submission.
                </p>
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-[#fde8e8] border border-[#9e3333]/20 text-sm font-semibold text-[#9e3333]">
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setPhase("problem")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#e6dfd3] bg-white text-sm font-semibold text-[#4a423a] hover:bg-[#faf6f0] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Submit Complaint
                </button>
              </div>
            </div>
          </AssistantWidget>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Cinematic multi-agent orchestration — FRONTEND VISUALIZATION ONLY.
          It reflects the real backend result/error set by handleSubmit. */}
      {phase === "orchestrating" && (
        <AgentOrchestration
          hasPhoto={!!imageFile}
          result={result}
          error={submitError}
          onViewComplaint={() => {
            if (!result) return;
            router.push(`/citizen/${result.complaintId}`);
            router.refresh();
          }}
          onReturnDashboard={() => {
            router.push("/citizen");
            router.refresh();
          }}
          onDismiss={() => {
            setSubmitError("");
            setPhase("review");
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat bubble
// ---------------------------------------------------------------------------
function Bubble({ role, children }: { role: "assistant" | "user"; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          role === "user"
            ? "bg-[#c86d28] text-white rounded-br-md"
            : "bg-white border border-[#e6dfd3] text-[#1c1917] rounded-bl-md"
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Assistant-side widget container (left aligned card, like an AI message)
// ---------------------------------------------------------------------------
function AssistantWidget({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex justify-start"
    >
      <div
        className={`${wide ? "w-full" : "max-w-[92%]"} bg-white border border-[#e6dfd3] rounded-2xl rounded-bl-md p-4 sm:p-5 shadow-sm`}
      >
        {children}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Voice-first chat composer: large mic (VoiceInput) + text fallback + send
// ---------------------------------------------------------------------------
function ChatComposer({
  value,
  onChange,
  onSend,
  textareaId,
  placeholder,
  chips,
  onChip,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  textareaId: string;
  placeholder: string;
  chips?: string[];
  onChip?: (c: string) => void;
}) {
  return (
    <AssistantWidget wide>
      <div className="space-y-3">
        {/* Voice-first: the mic is the primary interaction */}
        <VoiceInput value={value} onChange={onChange} textareaId={textareaId} />

        {chips && chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChip?.(c)}
                className="px-3.5 py-1.5 rounded-full border border-[#e6dfd3] bg-white text-sm font-medium text-[#4a423a] hover:border-[#c86d28] hover:text-[#c86d28] hover:bg-[#fbefe3]/50 transition-colors cursor-pointer"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Text fallback */}
        <div className="flex items-end gap-2">
          <textarea
            id={textareaId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#e6dfd3] bg-[#faf6f0] text-sm text-[#1c1917] placeholder:text-[#7a6f64] focus:outline-none focus:ring-2 focus:ring-[#c86d28] focus:border-transparent resize-none"
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && value.trim()) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim()}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#c86d28] text-white hover:bg-[#b35c1e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AssistantWidget>
  );
}

// ---------------------------------------------------------------------------
// Review / result field
// ---------------------------------------------------------------------------
function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#7a6f64] uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-sm font-semibold text-[#1c1917] break-words">{value}</p>
    </div>
  );
}
