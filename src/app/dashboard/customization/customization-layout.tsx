"use client";

import { useState } from "react";
import { Paintbrush, Layout, Settings2 } from "lucide-react";

type Tab = "designer" | "cards" | "settings";

type Props = {
  designerPanel: React.ReactNode;
  cardsPanel: React.ReactNode;
  settingsPanel: React.ReactNode;
};

export function CustomizationLayout({
  designerPanel,
  cardsPanel,
  settingsPanel,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("designer");

  const tabs: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: "designer",
      label: "Form Designer",
      icon: <Paintbrush className="h-4 w-4" />,
      description: "Edit and preview your donation form",
    },
    {
      id: "cards",
      label: "Embed Cards",
      icon: <Layout className="h-4 w-4" />,
      description: "Manage embeddable donation cards",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings2 className="h-4 w-4" />,
      description: "Configure donate button, campaigns, and embed code",
    },
  ];

  return (
    <div className="customization-page w-full min-w-0">
      {/* Page header with title + segmented tab control */}
      <div className="sticky top-0 z-30 bg-dashboard-card/80 backdrop-blur-xl border-b border-dashboard-border/40">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
          {/* Title row */}
          <div className="pt-6 pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
              Form Design
            </h1>
            <p className="mt-1 text-sm text-dashboard-text-muted">
              Design your donation forms, embed cards, and configure settings
            </p>
          </div>

          {/* Segmented control tabs */}
          <div className="pb-0 -mb-px">
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
                        isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : ""
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
        </div>
      </div>

      {/* Tab content — generous padding, open breathing room */}
      <div className="min-w-0 min-h-0">
        {activeTab === "designer" && (
          <div className="dashboard-fade-in">{designerPanel}</div>
        )}
        {activeTab === "cards" && (
          <div className="dashboard-fade-in max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-8">
            {cardsPanel}
          </div>
        )}
        {activeTab === "settings" && (
          <div className="dashboard-fade-in max-w-3xl mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8">
            {settingsPanel}
          </div>
        )}
      </div>
    </div>
  );
}
