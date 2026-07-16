"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";


export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <>
      <h2 className="text-xl font-bold text-text-primary mb-1">Welcome back</h2>
      <p className="text-sm text-text-secondary mb-6">
        Sign in to access your dashboard
      </p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-text-primary mb-1.5">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0D8] bg-[#FAF5EE] text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B45309]/30 focus:border-[#B45309] transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-text-primary mb-1.5">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0D8] bg-[#FAF5EE] text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B45309]/30 focus:border-[#B45309] transition-colors"
            placeholder="••••••••"
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
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-sm text-text-secondary text-center mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#B45309] font-semibold hover:text-[#92400E]">
          Sign up
        </Link>
      </p>
    </>
  );
}
