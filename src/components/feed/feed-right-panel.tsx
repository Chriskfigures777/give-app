"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, MessageSquare, Bell, Globe } from "lucide-react";
import { PanelPeers } from "./panel-peers";
import { PanelMessages } from "./panel-messages";
import { PanelNotifications } from "./panel-notifications";
import { FeedSidebar } from "./feed-sidebar";
import { useFeedTheme } from "./feed-theme-context";

export type PanelPage = "home" | "peers" | "messages" | "notifications";

const PANEL_TABS: {
  id: PanelPage;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "home",          label: "Network",   icon: Globe         },
  { id: "peers",         label: "Peers",     icon: Users         },
  { id: "messages",      label: "Messages",  icon: MessageSquare },
  { id: "notifications", label: "Activity",  icon: Bell          },
];

export function FeedRightPanel() {
  const [activePage, setActivePage] = useState<PanelPage>("home");
  const { theme } = useFeedTheme();

  return (
    <aside className="hidden w-[296px] shrink-0 lg:block">
      {/* Sticky container */}
      <div className="sticky top-6 space-y-3 max-h-[calc(100vh-3rem)]">

        {/* ── Tab bar ── */}
        <div
          className="rounded-2xl overflow-hidden ft-card-shadow"
          style={{
            background: "var(--feed-card)",
            border: "1px solid var(--feed-border)",
          }}
        >
          <div className="p-1.5">
            <div className="relative flex gap-0.5">
              {PANEL_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activePage === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivePage(tab.id)}
                    className="relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-center text-[9px] font-bold uppercase tracking-wider transition-all duration-200"
                    style={
                      isActive
                        ? {
                            background: "var(--feed-nav-active-bg)",
                            color: "var(--feed-nav-active-text)",
                          }
                        : { color: "var(--feed-text-dim)" }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--feed-text-muted)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--feed-text-dim)";
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    <span>{tab.label}</span>
                    {/* Active underline */}
                    {isActive && (
                      <motion.span
                        layoutId="panel-tab-indicator"
                        className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
                        style={{ background: "var(--feed-gradient)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Panel content ── */}
        <div
          className="rounded-2xl overflow-hidden ft-card-shadow feed-scroll-area"
          style={{
            background: "var(--feed-card)",
            border: "1px solid var(--feed-border)",
            maxHeight: "calc(100vh - 9rem)",
            overflowY: "auto",
          }}
        >
          <AnimatePresence mode="wait">
            {activePage === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
              >
                <FeedSidebar />
              </motion.div>
            )}
            {activePage === "peers" && (
              <motion.div
                key="peers"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
              >
                <PanelPeers />
              </motion.div>
            )}
            {activePage === "messages" && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
              >
                <PanelMessages />
              </motion.div>
            )}
            {activePage === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
              >
                <PanelNotifications />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Live status indicator ── */}
        <div
          className="rounded-xl px-3 py-2 flex items-center gap-2"
          style={{
            background: "var(--feed-input-bg)",
            border: "1px solid var(--feed-border)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--feed-accent)",
              boxShadow: "0 0 6px var(--feed-accent)",
            }}
          />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--feed-text-dim)" }}
          >
            Live updates active
          </span>
        </div>
      </div>
    </aside>
  );
}
