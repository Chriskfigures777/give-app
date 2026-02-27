"use client";

import React from "react";
import { Barlow } from "next/font/google";

const barlow = Barlow({ subsets: ["latin"], weight: ["600", "700", "800", "900"] });

const LOGOS = [
  {
    id: 1,
    name: "Classic Swoosh",
    desc: "Nike-style. One fluid stroke.",
    render: (className: string) => (
      <span className={`inline-flex items-center gap-3 ${className}`}>
        <svg viewBox="0 0 40 24" fill="none" className="h-6 w-6 shrink-0">
          <path d="M2 22 C12 2 28 2 38 22" stroke="#10b981" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
        <span className="font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>Exchange</span>
      </span>
    ),
  },
  {
    id: 2,
    name: "Wave",
    desc: "Gentle S-curve. Flow, connection.",
    render: (className: string) => (
      <span className={`inline-flex items-center gap-3 ${className}`}>
        <svg viewBox="0 0 64 24" fill="none" className="h-6 w-8 shrink-0">
          <path d="M8 24 Q24 8 40 24 Q56 40 72 24" stroke="#10b981" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
        <span className="font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>Exchange</span>
      </span>
    ),
  },
  {
    id: 3,
    name: "Stripe",
    desc: "Single vertical bar. Adidas-inspired.",
    render: (className: string) => (
      <span className={`inline-flex items-center gap-3 ${className}`}>
        <span className="h-6 w-1.5 shrink-0 rounded-full bg-emerald-500" />
        <span className="font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>Exchange</span>
      </span>
    ),
  },
  {
    id: 4,
    name: "Three Stripes",
    desc: "Adidas. Connection through repetition.",
    render: (className: string) => (
      <span className={`inline-flex items-center gap-3 ${className}`}>
        <span className="flex gap-1">
          <span className="h-6 w-0.5 rounded-full bg-emerald-500" />
          <span className="h-6 w-0.5 rounded-full bg-emerald-500" />
          <span className="h-6 w-0.5 rounded-full bg-emerald-500" />
        </span>
        <span className="font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>Exchange</span>
      </span>
    ),
  },
  {
    id: 5,
    name: "Dot + Swoosh",
    desc: "Node + flow. Connection.",
    render: (className: string) => (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
          <svg viewBox="0 0 40 24" fill="none" className="h-5 w-6 shrink-0">
            <path d="M4 20 C20 8 36 8 40 20" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </span>
        <span className="font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>Exchange</span>
      </span>
    ),
  },
  {
    id: 6,
    name: "Arc",
    desc: "U-shaped arc. Bridge, connection.",
    render: (className: string) => (
      <span className={`inline-flex items-center gap-3 ${className}`}>
        <svg viewBox="0 0 64 24" fill="none" className="h-6 w-8 shrink-0">
          <path d="M8 12 Q32 36 56 12" stroke="#10b981" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
        <span className="font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>Exchange</span>
      </span>
    ),
  },
  {
    id: 7,
    name: "Bold Swoosh",
    desc: "Thicker curve. More presence.",
    render: (className: string) => (
      <span className={`inline-flex items-center gap-3 ${className}`}>
        <svg viewBox="0 0 40 24" fill="none" className="h-7 w-8 shrink-0">
          <path d="M2 22 C12 2 28 2 38 22" stroke="#10b981" strokeWidth="5" strokeLinecap="round" fill="none" />
        </svg>
        <span className="font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>Exchange</span>
      </span>
    ),
  },
  {
    id: 8,
    name: "Linked Dots",
    desc: "Two nodes connected.",
    render: (className: string) => (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
          <span className="h-0.5 w-4 shrink-0 rounded-full bg-emerald-500" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
        </span>
        <span className="font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>Exchange</span>
      </span>
    ),
  },
  {
    id: 9,
    name: "Pure Wordmark",
    desc: '"Exchange" only. Bold Barlow.',
    render: (className: string) => (
      <span className={`font-extrabold tracking-tight text-slate-900 ${className}`} style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>
        Exchange
      </span>
    ),
  },
  {
    id: 10,
    name: "E Accent",
    desc: 'E in emerald + "xchange"',
    render: (className: string) => (
      <span className={`inline-flex items-baseline gap-0.5 ${className}`} style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>
        <span className="font-extrabold tracking-tight text-emerald-600">E</span>
        <span className="font-extrabold tracking-tight text-slate-900">xchange</span>
      </span>
    ),
  },
  {
    id: 11,
    name: "Underscore",
    desc: '"Exchange" + emerald line',
    render: (className: string) => (
      <span className={`inline-flex flex-col ${className}`}>
        <span className="font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>Exchange</span>
        <span className="mt-0.5 h-0.5 w-14 rounded-full bg-emerald-500" />
      </span>
    ),
  },
  {
    id: 12,
    name: "Lowercase",
    desc: '"exchange" — softer, approachable',
    render: (className: string) => (
      <span className={`font-bold tracking-tight lowercase text-slate-900 ${className}`} style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>
        exchange
      </span>
    ),
  },
  {
    id: 13,
    name: "Gradient Swoosh",
    desc: "Swoosh with emerald-to-teal gradient",
    render: (className: string, suffix = "") => (
      <span className={`inline-flex items-center gap-3 ${className}`}>
        <svg viewBox="0 0 40 24" fill="none" className="h-6 w-6 shrink-0">
          <defs>
            <linearGradient id={`grad-13-${suffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
          <path d="M2 22 C12 2 28 2 38 22" stroke={`url(#grad-13-${suffix})`} strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
        <span className="font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>Exchange</span>
      </span>
    ),
  },
  {
    id: 14,
    name: "Rising Arc",
    desc: "Arc that rises left-to-right. Growth.",
    render: (className: string) => (
      <span className={`inline-flex items-center gap-3 ${className}`}>
        <svg viewBox="0 0 64 24" fill="none" className="h-6 w-8 shrink-0">
          <path d="M8 36 Q32 12 56 28" stroke="#10b981" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
        <span className="font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>Exchange</span>
      </span>
    ),
  },
  {
    id: 15,
    name: "Minimal Arrow",
    desc: "Direction, flow.",
    render: (className: string) => (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0">
          <path d="M4 12 L20 12 M14 6 L20 12 L14 18" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>Exchange</span>
      </span>
    ),
  },
];

export default function LogoPreviewPage() {
  return (
    <div className={`min-h-screen bg-slate-50 py-16 ${barlow.className}`}>
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">15 Logo Concepts for The Exchange</h1>
        <p className="mb-12 text-slate-600">Minimal, iconic, Barlow. No X marks. Swoosh and connection-focused.</p>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {LOGOS.map((logo, i) => (
            <div
              key={logo.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex min-h-[64px] items-center justify-center border-b border-slate-100 pb-6">
                {logo.id === 13 ? (logo.render as (c: string, s?: string) => React.ReactElement)("text-xl", `g-${i}`) : logo.render("text-xl")}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{logo.name}</h3>
                <p className="mt-0.5 text-sm text-slate-500">{logo.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-slate-900 p-12">
          <h2 className="mb-8 text-lg font-semibold text-white">Dark background preview</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 5, 6, 8, 13].map((id, i) => {
              const logo = LOGOS.find((l) => l.id === id)!;
              return (
                <div key={id} className="flex min-h-[48px] items-center justify-center rounded-xl bg-slate-800/50 p-6 [&_span]:!text-white [&_path]:!stroke-[#34d399] [&_rect]:!fill-emerald-400 [&_circle]:!fill-emerald-400">
                  {logo.id === 13 ? (logo.render as (c: string, s?: string) => React.ReactElement)("text-lg", `d-${i}`) : logo.render("text-lg")}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
