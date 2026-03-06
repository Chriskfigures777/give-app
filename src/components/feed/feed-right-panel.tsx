"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, MessageSquare, Bell, Globe } from "lucide-react";
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
  { id: "home",          label: "Network",  icon: Globe         },
  { id: "peers",         label: "Peers",    icon: Users         },
  { id: "messages",      label: "Messages", icon: MessageSquare },
  { id: "notifications", label: "Activity", icon: Bell          },
];

export function FeedRightPanel() {
  const [activePage, setActivePage] = useState<PanelPage>("home");

  return (
    <aside className="hidden w-[280px] shrink-0 lg:block">
      <div className="sticky top-[4.5rem] space-y-2.5">

        {/* ── Tab bar ── */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "var(--feed-card)",
            border: "1px solid var(--feed-border-strong)",
            boxShadow: "var(--feed-card-shadow)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--feed-text-dim)" }}
            >
              Connections
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full ft-live-dot"
                style={{ background: "#059669" }}
              />
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "#059669" }}
              >
                Live
              </span>
            </div>
          </div>

          {/* Pill tabs */}
          <div className="flex gap-1 px-2 pb-2.5">
            {PANEL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activePage === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePage(tab.id)}
                  className="relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
                  style={
                    isActive
                      ? { background: "var(--feed-nav-active-bg)", color: "var(--feed-nav-active-text)" }
                      : { color: "var(--feed-text-dim)" }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "var(--feed-input-bg)";
                      (e.currentTarget as HTMLElement).style.color = "var(--feed-text-muted)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--feed-text-dim)";
                    }
                  }}
                >
                  <Icon
                    className="h-[15px] w-[15px] shrink-0"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="panel-tab-indicator"
                      className="absolute bottom-0 inset-x-2 h-0.5 rounded-full"
                      style={{ background: "var(--feed-accent-dark)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Panel content ── */}
        <div
          className="rounded-2xl overflow-hidden feed-scroll-area"
          style={{
            background: "var(--feed-card)",
            border: "1px solid var(--feed-border-strong)",
            maxHeight: "calc(100vh - 9.5rem)",
            overflowY: "auto",
            boxShadow: "var(--feed-card-shadow)",
          }}
        >
          <AnimatePresence mode="wait">
            {activePage === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
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
                transition={{ duration: 0.18, ease: "easeInOut" }}
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
                transition={{ duration: 0.18, ease: "easeInOut" }}
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
                transition={{ duration: 0.18, ease: "easeInOut" }}
              >
                <PanelNotifications />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Live status ── */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{
            background: "var(--feed-card)",
            border: "1px solid var(--feed-border-strong)",
            boxShadow: "var(--feed-card-shadow)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0 ft-live-dot"
            style={{ background: "#059669" }}
          />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--feed-text-muted)" }}
          >
            Live updates active
          </span>
        </div>
      </div>
    </aside>
  );
}
