"use client";

import { BarChart3, MessageSquare, Clock, CheckCircle, Mail } from "lucide-react";

// Placeholder analytics — will be powered by Convex aggregation queries
const stats = [
  {
    label: "Total Conversations",
    value: "0",
    change: "-",
    icon: MessageSquare,
  },
  {
    label: "Avg. First Response",
    value: "-",
    change: "-",
    icon: Clock,
  },
  {
    label: "Resolved Today",
    value: "0",
    change: "-",
    icon: CheckCircle,
  },
  {
    label: "Email Conversations",
    value: "0",
    change: "-",
    icon: Mail,
  },
];

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center border-b border-border px-6 py-3">
        <h1 className="text-[15px] font-semibold text-text-primary">
          Analytics
        </h1>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-surface p-5"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                      <Icon className="h-4 w-4 text-primary-600" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-text-primary">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-secondary">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Placeholder chart area */}
          <div className="mt-8 rounded-xl border border-border bg-surface p-8">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-text-tertiary" />
              <h3 className="mt-4 text-[14px] font-medium text-text-primary">
                Analytics coming soon
              </h3>
              <p className="mt-1 text-[13px] text-text-secondary">
                Charts and detailed metrics will appear here once
                conversations start flowing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
