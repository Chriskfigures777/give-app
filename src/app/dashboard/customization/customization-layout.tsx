"use client";

import { useState } from "react";
import { Zap, Code2, Settings2 } from "lucide-react";

type Tab = "theme" | "custom" | "settings";

type Props = {
  themePanel: React.ReactNode;
  customPanel: React.ReactNode;
  settingsPanel: React.ReactNode;
};

export function CustomizationLayout({
  themePanel,
  customPanel,
  settingsPanel,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("theme");

  const tabs: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: "theme",
      label: "Website form",
      icon: <Zap className="h-4 w-4" />,
      description: "Edit the form already in your website templates",
    },
    {
      id: "custom",
      label: "Custom forms",
      icon: <Code2 className="h-4 w-4" />,
      description: "Build forms to share with others or embed elsewhere",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings2 className="h-4 w-4" />,
      description: "Donate button, campaigns",
    },
  ];

  return (
    <div className="customization-page w-full min-w-0">
      <div className="sticky top-0 z-30 bg-dashboard-card/80 backdrop-blur-xl border-b border-dashboard-border/40">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
          <div className="pt-6 pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
              Forms
            </h1>
            <p className="mt-1 text-sm text-dashboard-text-muted">
              <strong>Website form</strong> — One form for your website templates. Edit the basics here. <strong>Custom forms</strong> — Create as many forms as you need. Each form has its own embed code and splits. Share with partners or embed elsewhere.
            </p>
          </div>

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
                    <span className={isActive ? "text-emerald-600 dark:text-emerald-400" : ""}>
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

      <div className="min-w-0 min-h-0">
        {activeTab === "theme" && (
          <div className="dashboard-fade-in max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-8">
            {themePanel}
          </div>
        )}
        {activeTab === "custom" && (
          <div className="dashboard-fade-in max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-8">
            {customPanel}
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
