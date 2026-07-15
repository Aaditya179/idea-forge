import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profiles";
import Navbar from "@/components/Navbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect(`/${profile.role}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar role="admin" fullName={profile.full_name} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
