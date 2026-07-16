export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF5EE] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src="/emblem.png"
            alt="Government of India Emblem"
            className="h-11 sm:h-12 w-auto object-contain shrink-0"
          />
          <div className="flex flex-col text-left">
            <span className="text-xl font-bold tracking-tight text-[#1c1917] flex items-center gap-1.5">
              CivicPulse
            </span>
            <span className="text-[10px] text-[#7a6f64] font-medium uppercase tracking-wider block -mt-0.5">
              India&apos;s Civic Intelligence
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E7E0D8] shadow-xl shadow-[#B45309]/5 p-8">
          {children}
        </div>

        <p className="text-center text-xs text-[#A8A29E] mt-6">
          AI-Powered Civic Grievance Lodging &amp; Tracking
        </p>
      </div>
    </div>
  );
}
