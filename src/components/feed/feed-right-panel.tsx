"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  MessageSquare,
  Bell,
  Globe,
  ChevronLeft,
} from "lucide-react";
import { PanelPeers } from "./panel-peers";
import { PanelMessages } from "./panel-messages";
import { PanelNotifications } from "./panel-notifications";
import { FeedSidebar } from "./feed-sidebar";

export type PanelPage = "home" | "peers" | "messages" | "notifications";

const PANEL_TABS: {
  id: PanelPage;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "home", label: "Network", icon: Globe },
  { id: "peers", label: "Peers", icon: Users },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "notifications", label: "Activity", icon: Bell },
];

export function FeedRightPanel() {
  const [activePage, setActivePage] = useState<PanelPage>("home");

  return (
    <aside className="hidden w-[300px] shrink-0 lg:block">
      <div className="space-y-4">
        {/* Tab bar — minimal */}
        <div className="rounded-xl border border-slate-200 bg-white p-1.5">
          <div className="flex gap-0.5">
            {PANEL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activePage === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePage(tab.id)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-center text-[10px] font-semibold transition-colors ${
                    isActive ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {activePage !== "home" && (
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={() => setActivePage("home")}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-slate-900">
                {PANEL_TABS.find((t) => t.id === activePage)?.label}
              </span>
            </div>
          )}
          <div className="max-h-[600px] overflow-y-auto">
            <AnimatePresence mode="wait">
              {activePage === "home" && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <FeedSidebar />
                </motion.div>
              )}
              {activePage === "peers" && (
                <motion.div
                  key="peers"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <PanelPeers />
                </motion.div>
              )}
              {activePage === "messages" && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <PanelMessages />
                </motion.div>
              )}
              {activePage === "notifications" && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <PanelNotifications />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </aside>
  );
}
