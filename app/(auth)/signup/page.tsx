"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createProfile } from "@/lib/queries/profiles";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const role = "citizen";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1. Create auth user with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          department_id: null,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Signup succeeded but no user returned. Try logging in.");
      setLoading(false);
      return;
    }

    // 2. Create profile row (this will run if email confirmation is disabled and we have an active session)
    // If email confirmation is enabled, this client-side insert will fail because auth.uid() is null.
    // However, the database trigger (if set up) will handle it automatically.
    const profile = await createProfile(supabase, {
      id: authData.user.id,
      full_name: fullName,
      role,
      department_id: null,
    });

    if (!profile) {
      // Check if session exists (email confirmation might be enabled)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Account created! Please check your email to confirm your account, or disable 'Confirm Email' in Supabase Authentication settings.");
        setLoading(false);
        return;
      }
      
      setError("Account created but profile setup failed. Please contact support.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <>
      <h2 className="text-xl font-bold text-text-primary mb-1">Create account</h2>
      <p className="text-sm text-text-secondary mb-6">
        Join CivicPulse to start reporting civic issues
      </p>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-text-primary mb-1.5">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-text-primary mb-1.5">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-text-primary mb-1.5">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Min. 6 characters"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-full bg-[#B45309] text-white text-sm font-semibold hover:bg-[#92400E] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#B45309]/20 cursor-pointer"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-sm text-text-secondary text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-[#B45309] font-semibold hover:text-[#92400E]">
          Sign in
        </Link>
      </p>
    </>
  );
}
