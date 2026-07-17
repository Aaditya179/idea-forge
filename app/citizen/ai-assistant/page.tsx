"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getDepartmentByName } from "@/lib/queries/departments";
import { createComplaint, uploadComplaintImage } from "@/lib/queries/complaints";
import { classifyComplaint } from "@/lib/routing/keywordRouter";
import VoiceInput from "@/components/VoiceInput";
import type { LocationData } from "@/components/LocationPicker";
import type { Priority } from "@/lib/types";
import {
  Bot,
  MapPin,
  Navigation,
  Check,
  Loader2,
  X,
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  CheckCircle2,
  Circle,
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

// Conversation steps (Photo is optional, Review is terminal)
type Step = "location" | "problem" | "duration" | "photo" | "review";

const STEPS: { key: Step; label: string; optional?: boolean }[] = [
  { key: "location", label: "Location" },
  { key: "problem", label: "Problem" },
  { key: "duration", label: "Duration" },
  { key: "photo", label: "Photo", optional: true },
  { key: "review", label: "Review" },
];

type LocStatus = "requesting" | "found" | "denied" | "map";

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
}

// Lightweight local urgency heuristic for the review preview.
// The authoritative priority is still assigned by /api/classify on submit.
function estimatePriority(text: string): Priority {
  const t = text.toLowerCase();
  const high = [
    "leak", "burst", "fire", "accident", "danger", "shock", "electrocut",
    "overflow", "no water", "outage", "collapse", "flood", "sewage", "gas",
    "injury", "urgent", "emergency",
  ];
  const low = ["minor", "small", "slightly", "cosmetic", "sometimes", "occasionally"];
  if (high.some((w) => t.includes(w))) return "high";
  if (low.some((w) => t.includes(w))) return "low";
  return "medium";
}

export default function AIAssistantPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("location");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // --- Location state ---
  const [locStatus, setLocStatus] = useState<LocStatus>("requesting");
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const pushMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Auto-scroll the transcript
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step, locStatus]);

  // --- Reverse geocode (reuses existing API route) ---
  const reverseGeocode = useCallback(async (lat: number, lng: number, signal?: AbortSignal): Promise<string> => {
    const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`, { signal });
    if (!res.ok) throw new Error("Failed to reverse geocode");
    const data = await res.json();
    return data.address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }, []);

  // --- Immediately request browser location on entering the location step ---
  const requestLocation = useCallback(() => {
    setLocStatus("requesting");
    setLocError("");

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocStatus("denied");
      setLocError("Geolocation is not supported by your browser. Please select on the map.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const address = await reverseGeocode(lat, lng);
          setDetected({ lat, lng, address });
        } catch {
          setDetected({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        }
        setLocStatus("found");
      },
      (err) => {
        let msg = "Couldn't get your location. Please select on the map instead.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. Please select on the map instead.";
        }
        setLocError(msg);
        setLocStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [reverseGeocode]);

  // Kick off geolocation once on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Cleanup geocode abort on unmount
  useEffect(() => {
    return () => geocodeAbortRef.current?.abort();
  }, []);

  // --- Advance from location to the conversation ---
  const confirmLocationAndBegin = useCallback(
    (loc: LocationData) => {
      setConfirmedLocation(loc);
      setMessages([
        { role: "assistant", text: "Great — I've noted your location." },
        { role: "user", text: `📍 ${loc.locationText}` },
        { role: "assistant", text: "What problem are you facing? You can type or speak in English, Hindi, or Hinglish." },
      ]);
      setStep("problem");
    },
    []
  );

  const handleUseDetected = useCallback(() => {
    if (!detected) return;
    confirmLocationAndBegin({
      lat: detected.lat,
      lng: detected.lng,
      locationText: detected.address,
    });
  }, [detected, confirmLocationAndBegin]);

  // --- Map picker handlers (reuse LocationPickerMap) ---
  const openMap = useCallback(() => {
    setLocStatus("map");
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
    confirmLocationAndBegin({
      lat: pendingMarker[0],
      lng: pendingMarker[1],
      locationText: pendingAddress,
    });
  }, [pendingMarker, pendingAddress, confirmLocationAndBegin]);

  // --- Conversation handlers ---
  const submitProblem = useCallback(() => {
    if (!problem.trim()) return;
    pushMessage({ role: "user", text: problem.trim() });
    pushMessage({ role: "assistant", text: "How long has this issue existed?" });
    setStep("duration");
  }, [problem, pushMessage]);

  const submitDuration = useCallback(
    (value: string) => {
      const v = value.trim();
      if (!v) return;
      setDuration(v);
      pushMessage({ role: "user", text: v });
      pushMessage({
        role: "assistant",
        text: "Would you like to upload a photo of the issue? This is optional.",
      });
      setStep("photo");
    },
    [pushMessage]
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
    (withPhoto: boolean) => {
      pushMessage({
        role: "user",
        text: withPhoto ? "📷 Photo attached" : "Skipped photo",
      });
      pushMessage({
        role: "assistant",
        text: "Thanks! I've prepared your complaint. Please review the details before submitting.",
      });
      setStep("review");
    },
    [pushMessage]
  );

  // --- Derived review data (reuses keyword classifier for category/department) ---
  const fullText = duration
    ? `${problem.trim()}\n\n(Issue duration: ${duration})`
    : problem.trim();
  const { category, departmentName } = classifyComplaint(problem);
  const previewPriority = estimatePriority(fullText);

  // --- Submit via the EXISTING complaint submission infrastructure ---
  const handleSubmit = useCallback(async () => {
    if (!confirmedLocation) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      // 1. Current user's profile
      const profile = await getCurrentProfile(supabase);
      if (!profile) {
        setSubmitError("Unable to load your profile. Please sign in again.");
        setSubmitting(false);
        return;
      }

      // 2. Resolve department from the keyword-classified name (same as manual flow)
      const department = await getDepartmentByName(supabase, departmentName);
      if (!department) {
        setSubmitError("Unable to resolve department. Please try again.");
        setSubmitting(false);
        return;
      }

      // 3. Upload the optional photo
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
        setSubmitting(false);
        return;
      }

      // 5. Run the existing AI classification pipeline (sets category/department/priority in DB)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ complaintId: complaint.id, rawText: fullText }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err) {
        // Non-fatal: the complaint is already stored with keyword classification.
        console.warn("[AI Assistant] classification pipeline failed:", err);
      }

      // 6. Done — return to the citizen dashboard
      router.push("/citizen");
      router.refresh();
    } catch (err) {
      console.error("[AI Assistant] submission error:", err);
      setSubmitError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  }, [confirmedLocation, supabase, departmentName, imageFile, fullText, category, router]);

  const activeStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-[#c86d28] flex items-center justify-center shrink-0 shadow-sm">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1c1917]">
            CivicPulse AI Complaint Assistant
          </h1>
          <p className="text-sm text-[#4a423a] mt-1">
            I&apos;ll collect the required details and prepare your complaint for review.
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 p-4 rounded-xl bg-white border border-[#e6dfd3] shadow-sm">
        {STEPS.map((s, i) => {
          const done = i < activeStepIndex;
          const current = i === activeStepIndex;
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-[#c86d28]" />
              ) : (
                <Circle className={`w-4 h-4 ${current ? "text-[#c86d28]" : "text-[#c9bfb2]"}`} />
              )}
              <span
                className={`text-sm ${
                  current
                    ? "font-bold text-[#1c1917]"
                    : done
                    ? "font-medium text-[#4a423a]"
                    : "text-[#7a6f64]"
                }`}
              >
                {s.label}
                {s.optional && <span className="text-[#7a6f64] font-normal"> (Optional)</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* Conversation transcript */}
      {messages.length > 0 && (
        <div className="space-y-3 mb-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[#c86d28] text-white rounded-br-md"
                    : "bg-white border border-[#e6dfd3] text-[#1c1917] rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active step card */}
      <div className="bg-white rounded-2xl border border-[#e6dfd3] p-6 shadow-sm">
        {/* ---------------- LOCATION STEP ---------------- */}
        {step === "location" && (
          <div className="space-y-4">
            {locStatus === "requesting" && (
              <div className="flex items-center gap-3 text-[#4a423a]">
                <Loader2 className="w-5 h-5 animate-spin text-[#c86d28]" />
                <p className="text-sm font-medium">Requesting your location…</p>
              </div>
            )}

            {locStatus === "found" && detected && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#fbefe3]/60 border border-[#f6ddc4]">
                  <MapPin className="w-5 h-5 text-[#c86d28] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1c1917]">I found your current location</p>
                    <p className="text-sm text-[#4a423a] mt-0.5 break-words">{detected.address}</p>
                    <p className="text-[11px] text-[#7a6f64] font-mono mt-1">
                      {detected.lat.toFixed(5)}, {detected.lng.toFixed(5)}
                    </p>
                  </div>
                </div>
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

            {locStatus === "denied" && (
              <div className="space-y-4">
                <p className="text-sm text-[#9e3333] font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9e3333] shrink-0" />
                  {locError}
                </p>
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
              </div>
            )}

            {locStatus === "map" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#1c1917]">
                    Tap anywhere on the map to drop a pin
                  </p>
                  <button
                    type="button"
                    onClick={() => setLocStatus(detected ? "found" : "denied")}
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

                <div className="min-h-[2.5rem]">
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

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={confirmMap}
                    disabled={!pendingMarker || !pendingAddress || geocoding}
                    className="flex-1 py-2.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Confirm Location
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocStatus(detected ? "found" : "denied")}
                    className="px-5 py-2.5 rounded-full border border-[#e6dfd3] bg-white text-sm font-semibold text-[#4a423a] hover:bg-[#faf6f0] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- PROBLEM STEP ---------------- */}
        {step === "problem" && (
          <div className="space-y-3">
            <label htmlFor="ai-problem" className="block text-sm font-bold text-[#1c1917]">
              Describe the problem
            </label>
            <textarea
              id="ai-problem"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={4}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-[#e6dfd3] bg-[#faf6f0] text-sm text-[#1c1917] placeholder:text-[#7a6f64] focus:outline-none focus:ring-2 focus:ring-[#c86d28] focus:border-transparent resize-none"
              placeholder="E.g., Water pipe burst near Sector 14 market flooding the road…"
            />
            <VoiceInput value={problem} onChange={setProblem} textareaId="ai-problem" />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={submitProblem}
                disabled={!problem.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ---------------- DURATION STEP ---------------- */}
        {step === "duration" && (
          <DurationInput onSubmit={submitDuration} />
        )}

        {/* ---------------- PHOTO STEP ---------------- */}
        {step === "photo" && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-[#1c1917]">Attach a photo (optional)</p>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-[#e6dfd3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Complaint attachment preview" className="w-full h-56 object-cover" />
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
                className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-[#e6dfd3] hover:border-[#c86d28] bg-[#faf6f0] transition-all cursor-pointer"
              >
                <ImagePlus className="w-7 h-7 text-[#7a6f64] mb-2" />
                <span className="text-sm font-semibold text-[#4a423a]">Click to attach a photo</span>
                <span className="text-xs text-[#7a6f64] font-mono mt-0.5">PNG, JPG, WEBP</span>
                <input id="ai-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
            <div className="flex justify-between">
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
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] transition-colors cursor-pointer"
              >
                Continue to review
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ---------------- REVIEW STEP ---------------- */}
        {step === "review" && confirmedLocation && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#1c1917]">Review your complaint</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReviewField label="Category" value={category} />
              <ReviewField label="Department" value={departmentName} />
              <ReviewField
                label="Priority"
                value={previewPriority.charAt(0).toUpperCase() + previewPriority.slice(1)}
                hint="AI confirms final priority on submission"
              />
              <ReviewField label="Duration" value={duration || "—"} />
            </div>

            <ReviewField label="Location" value={confirmedLocation.locationText} />

            <div>
              <p className="text-xs font-bold text-[#7a6f64] uppercase tracking-wider mb-1.5">
                Complaint Description
              </p>
              <p className="text-sm text-[#1c1917] leading-relaxed whitespace-pre-wrap p-3 rounded-xl bg-[#faf6f0] border border-[#e6dfd3]">
                {problem}
              </p>
            </div>

            {imagePreview && (
              <div>
                <p className="text-xs font-bold text-[#7a6f64] uppercase tracking-wider mb-1.5">Photo</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Complaint attachment"
                  className="rounded-xl border border-[#e6dfd3] max-h-56 object-cover"
                />
              </div>
            )}

            {submitError && (
              <div className="p-4 rounded-xl bg-[#fde8e8] border border-[#9e3333]/20 text-sm font-semibold text-[#9e3333]">
                {submitError}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#e6dfd3]">
              <button
                type="button"
                onClick={() => setStep("problem")}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#e6dfd3] bg-white text-sm font-semibold text-[#4a423a] hover:bg-[#faf6f0] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Submit Complaint
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div ref={chatEndRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Duration sub-input: quick-select chips + free text (kept local to this page)
// ---------------------------------------------------------------------------
function DurationInput({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState("");
  const QUICK = ["Started today", "2–3 days", "About a week", "More than a month"];

  return (
    <div className="space-y-3">
      <label htmlFor="ai-duration" className="block text-sm font-bold text-[#1c1917]">
        How long has this issue existed?
      </label>
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSubmit(q)}
            className="px-3.5 py-1.5 rounded-full border border-[#e6dfd3] bg-white text-sm font-medium text-[#4a423a] hover:border-[#c86d28] hover:text-[#c86d28] hover:bg-[#fbefe3]/50 transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <input
          id="ai-duration"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) onSubmit(value);
          }}
          className="flex-1 px-4 py-2.5 rounded-xl border border-[#e6dfd3] bg-[#faf6f0] text-sm text-[#1c1917] placeholder:text-[#7a6f64] focus:outline-none focus:ring-2 focus:ring-[#c86d28] focus:border-transparent"
          placeholder="Or type a duration…"
        />
        <button
          type="button"
          onClick={() => value.trim() && onSubmit(value)}
          disabled={!value.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review field
// ---------------------------------------------------------------------------
function ReviewField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#7a6f64] uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-sm font-semibold text-[#1c1917] break-words">{value}</p>
      {hint && <p className="text-[11px] text-[#7a6f64] mt-0.5">{hint}</p>}
    </div>
  );
}
