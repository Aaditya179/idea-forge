"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createProfile } from "@/lib/queries/profiles";
import { getDepartments } from "@/lib/queries/departments";
import type { Department, UserRole } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("citizen");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch departments for the officer dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      const depts = await getDepartments(supabase);
      setDepartments(depts);
    };
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate officer must select department
    if (role === "officer" && !departmentId) {
      setError("Please select a department for the officer role.");
      setLoading(false);
      return;
    }

    // 1. Create auth user with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          department_id: role === "officer" ? departmentId : null,
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
      department_id: role === "officer" ? departmentId : null,
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

        <div>
          <label htmlFor="signup-role" className="block text-sm font-medium text-text-primary mb-1.5">
            Role
          </label>
          <select
            id="signup-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
          >
            <option value="citizen">Citizen</option>
            <option value="officer">Officer</option>
            <option value="admin">Admin</option>
          </select>
          <p className="text-xs text-text-muted mt-1">
            Demo mode — in production, roles are assigned by administrators.
          </p>
        </div>

        {role === "officer" && (
          <div>
            <label htmlFor="signup-department" className="block text-sm font-medium text-text-primary mb-1.5">
              Department
            </label>
            <select
              id="signup-department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
            >
              <option value="">Select department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary-200 cursor-pointer"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-sm text-text-secondary text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </>
  );
}
