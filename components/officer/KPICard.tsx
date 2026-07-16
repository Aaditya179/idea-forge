"use client";

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "amber" | "violet" | "emerald";
  className?: string;
}

const colorConfig = {
  blue: {
    iconBg: "bg-[#e8f1f8] border border-[#b8d4ea]",
    iconColor: "text-[#2f5a82]",
    textColor: "text-[#2f5a82]",
  },
  amber: {
    iconBg: "bg-[#fbefe3] border border-[#f6ddc4]",
    iconColor: "text-[#c86d28]",
    textColor: "text-[#c86d28]",
  },
  violet: {
    iconBg: "bg-[#f3e8f8] border border-[#d4b8ea]",
    iconColor: "text-[#6b2f82]",
    textColor: "text-[#6b2f82]",
  },
  emerald: {
    iconBg: "bg-[#e6f4ea] border border-[#1e6f43]/20",
    iconColor: "text-[#1e6f43]",
    textColor: "text-[#1e6f43]",
  },
};

export default function KPICard({ title, value, icon, color, className = "" }: KPICardProps) {
  const config = colorConfig[color];

  return (
    <div className={`bg-white rounded-2xl border border-[#e6dfd3] p-6 hover:border-[#c86d28] hover:shadow-md transition-all ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider mb-1.5">{title}</p>
          <p className="font-bold tracking-tight text-3xl sm:text-4xl text-[#1c1917]">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
          <div className={`w-6 h-6 ${config.iconColor}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}