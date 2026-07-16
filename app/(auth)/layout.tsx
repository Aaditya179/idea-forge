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
          <div className="w-10 h-10 rounded-full bg-white border-2 border-[#E7E0D8] flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-[#B45309]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-[#1C1917]">CIVIC</span>
              <span className="text-[#B45309]">PULSE</span>
            </span>
            <span className="text-[9px] text-[#A8A29E] font-medium tracking-wide">
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
