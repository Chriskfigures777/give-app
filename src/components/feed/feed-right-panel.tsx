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
  gradient: string;
}[] = [
  { id: "home", label: "Network", icon: Globe, gradient: "from-emerald-500 to-teal-500" },
  { id: "peers", label: "Peers", icon: Users, gradient: "from-violet-500 to-indigo-500" },
  { id: "messages", label: "Messages", icon: MessageSquare, gradient: "from-amber-500 to-orange-500" },
  { id: "notifications", label: "Activity", icon: Bell, gradient: "from-rose-500 to-pink-500" },
];

export function FeedRightPanel() {
  const [activePage, setActivePage] = useState<PanelPage>("home");

  return (
    <aside className="hidden w-[320px] shrink-0 lg:block">
      <div className="sticky top-24 space-y-3">
        {/* Panel tab bar */}
        <div className="rounded-2xl border border-slate-200/40 bg-white/90 p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] backdrop-blur-xl">
          <div className="flex gap-0.5">
            {PANEL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activePage === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePage(tab.id)}
                  className={`group relative flex flex-1 flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-center transition-all duration-200 ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-br ${tab.gradient} text-white shadow-sm`
                        : "text-slate-400 group-hover:text-slate-500"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span
                    className={`text-[10px] font-semibold leading-none tracking-wide ${
                      isActive ? "text-slate-700" : "text-slate-400 group-hover:text-slate-500"
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="panel-tab-indicator"
                      className="absolute -bottom-0.5 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel content area */}
        <div className="min-h-[400px] max-h-[calc(100vh-220px)] overflow-hidden rounded-2xl border border-slate-200/40 bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] backdrop-blur-xl">
          {/* Panel header for sub-pages */}
          <AnimatePresence mode="wait">
            {activePage !== "home" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-slate-100/60"
              >
                <div className="flex items-center gap-2.5 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setActivePage("home")}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {PANEL_TABS.find((t) => t.id === activePage)?.label}
                  </h3>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: activePage === "home" ? "calc(100vh - 260px)" : "calc(100vh - 310px)" }}>
            <AnimatePresence mode="wait">
              {activePage === "home" && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <FeedSidebar />
                </motion.div>
              )}
              {activePage === "peers" && (
                <motion.div
                  key="peers"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <PanelPeers />
                </motion.div>
              )}
              {activePage === "messages" && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <PanelMessages />
                </motion.div>
              )}
              {activePage === "notifications" && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
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
