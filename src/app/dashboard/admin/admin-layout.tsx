"use client";

import { useState } from "react";
import { LayoutDashboard, MessageSquare } from "lucide-react";

type Tab = "overview" | "survey";

type Props = {
  overviewPanel: React.ReactNode;
  surveyPanel: React.ReactNode;
};

export function AdminLayout({ overviewPanel, surveyPanel }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: "survey",
      label: "Survey responses",
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ];

  return (
    <div className="w-full min-w-0">
      {/* Tabs */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ease-out ${
                  isActive
                    ? "bg-white dark:bg-slate-700 text-dashboard-text shadow-sm shadow-black/[0.04] dark:shadow-black/[0.2]"
                    : "text-dashboard-text-muted hover:text-dashboard-text"
                }`}
              >
                <span
                  className={`transition-colors duration-200 ${
                    isActive ? "text-emerald-600 dark:text-emerald-400" : ""
                  }`}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="dashboard-fade-in">{overviewPanel}</div>
      )}
      {activeTab === "survey" && (
        <div className="dashboard-fade-in">{surveyPanel}</div>
      )}
    </div>
  );
}
