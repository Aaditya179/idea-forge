"use client";

import KPICard from "./KPICard";
import type { Complaint, ComplaintStatus } from "@/lib/types";

interface KPIGridProps {
  complaints: Complaint[];
  className?: string;
}

export default function KPIGrid({ complaints, className = "" }: KPIGridProps) {
  // Calculate metrics from complaints data
  const totalComplaints = complaints.length;
  
  const pendingComplaints = complaints.filter(
    (complaint) => complaint.status === "submitted"
  ).length;
  
  const inProgressComplaints = complaints.filter(
    (complaint) => complaint.status === "in_review" || complaint.status === "assigned"
  ).length;
  
  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "resolved"
  ).length;

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      <KPICard
        title="Total Complaints"
        value={totalComplaints}
        color="blue"
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />
      
      <KPICard
        title="Pending"
        value={pendingComplaints}
        color="amber"
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      
      <KPICard
        title="In Progress"
        value={inProgressComplaints}
        color="violet"
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
      
      <KPICard
        title="Resolved"
        value={resolvedComplaints}
        color="emerald"
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
}