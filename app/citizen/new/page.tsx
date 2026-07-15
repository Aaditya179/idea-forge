"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getDepartmentByName } from "@/lib/queries/departments";
import { createComplaint, createComplaintUpdate, uploadComplaintImage } from "@/lib/queries/complaints";
import { classifyComplaint } from "@/lib/routing/keywordRouter";

export default function NewComplaintPage() {
  const router = useRouter();
  const supabase = createClient();

  const [rawText, setRawText] = useState("");
  const [locationText, setLocationText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setLoading(true);

    try {
      // 1. Get the current user's profile
      const profile = await getCurrentProfile(supabase);
      if (!profile) {
        setError("Unable to load your profile. Please sign in again.");
        setLoading(false);
        return;
      }

      // 2. Classify the complaint using keyword matching
      // TODO: replace with LLM classification agent
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

      // 5. Insert complaint
      const complaint = await createComplaint(supabase, {
        user_id: profile.id,
        raw_text: rawText,
        category,
        department_id: department.id,
        location_text: locationText || null,
        image_url: imageUrl,
      });

      if (!complaint) {
        setError("Failed to submit complaint. Please try again.");
        setLoading(false);
        return;
      }

      // 6. Insert initial complaint update
      await createComplaintUpdate(supabase, {
        complaint_id: complaint.id,
        note: "Complaint submitted",
        status_at_time: "submitted",
        updated_by: profile.id,
      });

      // 7. Redirect to dashboard
      router.push("/citizen");
      router.refresh();
    } catch (err) {
      console.error("Error submitting complaint:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Submit a Complaint</h1>
        <p className="text-sm text-text-secondary mt-1">
          Describe your issue and we&apos;ll route it to the right department
        </p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label htmlFor="complaint-text" className="block text-sm font-semibold text-text-primary mb-2">
              Describe your issue <span className="text-red-500">*</span>
            </label>
            <textarea
              id="complaint-text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="E.g., There is a broken water pipe leaking on Main Street causing road damage and water wastage..."
            />
            <p className="text-xs text-text-muted mt-1.5">
              Be as specific as possible. The system will automatically categorize and route your complaint.
            </p>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="complaint-location" className="block text-sm font-semibold text-text-primary mb-2">
              Location <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <input
              id="complaint-location"
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="E.g., Main Street, near City Hospital"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Attach Image <span className="text-text-muted font-normal">(optional)</span>
            </label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Complaint attachment preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label
                htmlFor="complaint-image"
                className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-border hover:border-primary-300 bg-surface-raised hover:bg-primary-50/30 transition-colors cursor-pointer"
              >
                <svg className="w-8 h-8 text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-text-muted">Click to upload an image</span>
                <span className="text-xs text-text-muted mt-0.5">PNG, JPG, WEBP up to 5MB</span>
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
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !rawText.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary-200 cursor-pointer"
            >
              {loading ? "Submitting..." : "Submit Complaint"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-overlay transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
