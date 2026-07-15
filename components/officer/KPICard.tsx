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
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    textColor: "text-blue-600",
  },
  amber: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    textColor: "text-amber-600",
  },
  violet: {
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
    textColor: "text-violet-600",
  },
  emerald: {
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    textColor: "text-emerald-600",
  },
};

export default function KPICard({ title, value, icon, color, className = "" }: KPICardProps) {
  const config = colorConfig[color];

  return (
    <div className={`bg-white rounded-xl border border-border p-6 hover:shadow-sm transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center`}>
          <div className={`w-6 h-6 ${config.iconColor}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}