"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getDepartmentByName } from "@/lib/queries/departments";
import { createComplaint, uploadComplaintImage } from "@/lib/queries/complaints";
import { classifyComplaint } from "@/lib/routing/keywordRouter";
import VoiceInput from "@/components/VoiceInput";
import LocationPicker, { LocationData } from "@/components/LocationPicker";
import AgentPipeline, {
  ClassifyResult,
  CleanTranscriptResult,
  DuplicateCheckResult,
} from "@/components/AgentPipeline";
import { AnimatePresence } from "framer-motion";

export default function NewComplaintPage() {
  const router = useRouter();
  const supabase = createClient();

  const [rawText, setRawText] = useState("");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationValidationError, setLocationValidationError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pipeline state
  const [showPipeline, setShowPipeline] = useState(false);
  const [pipelineData, setPipelineData] = useState<{
    complaintId: string;
    classifyResult: ClassifyResult | null;
    cleanResult: CleanTranscriptResult | null;
    duplicateResult: DuplicateCheckResult | null;
  } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLocationValidationError("");

    // Validate location — required field
    if (!locationData) {
      setLocationValidationError("Please add your location using GPS or the map picker.");
      return;
    }
    setLoading(true);

    try {
      // 1. Get the current user's profile
      const profile = await getCurrentProfile(supabase);
      if (!profile) {
        setError("Unable to load your profile. Please sign in again.");
        setLoading(false);
        return;
      }

      // 2. Classify the complaint using keyword matching (fast local fallback)
      const { category, departmentName } = classifyComplaint(rawText);

      // 3. Resolve department ID from department name
      const department = await getDepartmentByName(supabase, departmentName);
      if (!department) {
        setError("Unable to resolve department. Please try again.");
        setLoading(false);
        return;
      }

      // 4. Upload image if provided
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadComplaintImage(supabase, imageFile, profile.id);
      }

      // 5. Insert complaint into DB
      const complaint = await createComplaint(supabase, {
        user_id: profile.id,
        raw_text: rawText,
        category,
        department_id: department.id,
        location_text: locationData.locationText,
        image_url: imageUrl,
        latitude: locationData.lat,
        longitude: locationData.lng,
      });

      if (!complaint) {
        setError("Failed to submit complaint. Please try again.");
        setLoading(false);
        return;
      }

      // 6. Fire classification and cleanup in parallel
      const [classifyRes, cleanRes] = await Promise.allSettled([
        // 6a. Groq classification
        (async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const response = await fetch("/api/classify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ complaintId: complaint.id, rawText }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`classify: ${response.status}`);
          return (await response.json()) as ClassifyResult;
        })(),

        // 6b. Clean transcript
        (async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const response = await fetch("/api/clean-transcript", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawText }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`clean: ${response.status}`);
          return (await response.json()) as CleanTranscriptResult;
        })(),
      ]);

      const classifyResult = classifyRes.status === "fulfilled" ? classifyRes.value : null;
      const cleanResult = cleanRes.status === "fulfilled" ? cleanRes.value : null;

      // 6c. Duplicate check (run sequentially to safely use AI-classified department_id and priority)
      const dupRes = await (async () => {
        try {
          const deptId = classifyResult?.department_id || department.id;
          const priority = classifyResult?.priority || null;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 14000);
          const response = await fetch("/api/check-duplicates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              complaintId: complaint.id,
              rawText,
              lat: locationData.lat,
              lng: locationData.lng,
              departmentId: deptId,
              priority,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`dup: ${response.status}`);
          return { status: "fulfilled" as const, value: (await response.json()) as DuplicateCheckResult };
        } catch (err) {
          return { status: "rejected" as const, reason: err };
        }
      })();

      const duplicateResult = dupRes.status === "fulfilled" ? dupRes.value : null;

      if (classifyRes.status === "rejected") {
        console.warn("[NewComplaint] AI classification failed:", classifyRes.reason);
      }
      if (cleanRes.status === "rejected") {
        console.warn("[NewComplaint] Transcript cleanup failed:", cleanRes.reason);
      }
      if (dupRes.status === "rejected") {
        console.warn("[NewComplaint] Duplicate check failed:", dupRes.reason);
      }

      // 7. Show the pipeline animation with the pre-fetched results
      setLoading(false);
      setPipelineData({
        complaintId: complaint.id,
        classifyResult,
        cleanResult,
        duplicateResult,
      });
      setShowPipeline(true);
    } catch (err) {
      console.error("Error submitting complaint:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handlePipelineComplete = () => {
    setShowPipeline(false);
    const similarCount = pipelineData?.duplicateResult?.similarCount ?? 0;
    const redirectUrl =
      similarCount > 0 ? `/citizen?similar=${similarCount}` : "/citizen";
    router.push(redirectUrl);
    router.refresh();
  };

  return (
    <>
      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1c1917] tracking-tight">Submit a Complaint</h1>
        <p className="text-base text-[#4a423a] mt-1.5">
          Describe your issue and our AI engine will route it to the exact municipal engineer immediately.
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#e6dfd3] p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label htmlFor="complaint-text" className="block text-sm font-bold text-[#1c1917] mb-2 font-mono uppercase tracking-wider">
              Describe your issue <span className="text-[#9e3333]">*</span>
            </label>
            <textarea
              id="complaint-text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              required
              rows={5}
              className="w-full px-4 py-3.5 rounded-xl border border-[#e6dfd3] bg-[#faf6f0] text-sm sm:text-base text-[#1c1917] placeholder:text-[#7a6f64] focus:outline-none focus:ring-2 focus:ring-[#c86d28] focus:border-transparent resize-none shadow-sm"
              placeholder="E.g., Severe road crater leaking water near Sector 14 market causing traffic disruption and safety hazard..."
            />
            {/* Voice-to-text input */}
            <div className="mt-3">
              <VoiceInput
                value={rawText}
                onChange={setRawText}
                textareaId="complaint-text"
              />
            </div>
            <p className="text-xs text-[#7a6f64] mt-2 leading-relaxed font-normal">
              Be as specific as possible. Our NLP engine will automatically categorize urgency and assign the responsible ward engineer.
            </p>
          </div>

          {/* Location — required */}
          <div className="pt-4 border-t border-[#e6dfd3]">
            <label className="block text-sm font-bold text-[#1c1917] mb-2 font-mono uppercase tracking-wider">
              Location <span className="text-[#9e3333]">*</span>
            </label>
            <LocationPicker onLocationSelected={setLocationData} />
            {locationValidationError && (
              <p className="text-xs text-[#9e3333] mt-2 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9e3333] shrink-0" />
                {locationValidationError}
              </p>
            )}
          </div>

          {/* Image upload */}
          <div className="pt-4 border-t border-[#e6dfd3]">
            <label className="block text-sm font-bold text-[#1c1917] mb-2 font-mono uppercase tracking-wider">
              Attach Photo Evidence <span className="text-[#7a6f64] font-normal lowercase">(optional)</span>
            </label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-[#e6dfd3] shadow-sm">
                <img
                  src={imagePreview}
                  alt="Complaint attachment preview"
                  className="w-full h-56 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#1c1917]/80 text-white flex items-center justify-center hover:bg-[#1c1917] transition-colors cursor-pointer shadow"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label
                htmlFor="complaint-image"
                className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-[#e6dfd3] hover:border-[#c86d28] bg-[#faf6f0] hover:bg-[#fbefe3]/50 transition-all cursor-pointer"
              >
                <svg className="w-8 h-8 text-[#7a6f64] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold text-[#4a423a]">Click to attach verification photo</span>
                <span className="text-xs text-[#7a6f64] font-mono mt-0.5">PNG, JPG, WEBP up to 5MB</span>
                <input
                  id="complaint-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-[#fde8e8] border border-[#9e3333]/20 text-sm font-semibold text-[#9e3333]">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6dfd3]">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-full border border-[#e6dfd3] text-sm font-semibold text-[#4a423a] bg-white hover:bg-[#faf6f0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !rawText.trim() || !locationData}
              className="px-8 py-3 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-orange-900/20 active:scale-95 cursor-pointer"
            >
              {loading ? "Processing AI Routing…" : "Submit Complaint →"}
            </button>
          </div>
        </form>
      </div>

      {/* Agent Pipeline Overlay */}
      <AnimatePresence>
        {showPipeline && pipelineData && (
          <AgentPipeline
            rawText={rawText}
            complaintId={pipelineData.complaintId}
            classifyResult={pipelineData.classifyResult}
            cleanResult={pipelineData.cleanResult}
            duplicateResult={pipelineData.duplicateResult}
            onComplete={handlePipelineComplete}
            onClose={handlePipelineComplete}
          />
        )}
      </AnimatePresence>
    </>
  );
}
