"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export type TypeformStepConfig = {
  label: string;
  name: string;
  type: "text" | "email" | "password" | "textarea";
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
};

type TypeformFormProps = {
  steps: TypeformStepConfig[];
  onSubmit: (data: Record<string, string>) => void | Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
};

export function TypeformForm({
  steps,
  onSubmit,
  submitLabel = "Submit",
  loading = false,
  className = "",
}: TypeformFormProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});

  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  const update = (name: string, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const goNext = () => {
    const value = data[current?.name ?? ""] ?? "";
    if (current?.required && !String(value).trim()) return;
    if (isLast) {
      onSubmit(data);
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (isFirst) return;
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !current?.type.includes("textarea")) {
      e.preventDefault();
      const value = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
      if (current?.required && !value.trim()) return;
      update(current?.name ?? "", value);
      goNext();
    }
  };

  return (
    <div className={className}>
      {/* Progress bar */}
      <div className="mb-8 h-1 overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction >= 0 ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction >= 0 ? -24 : 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-[120px]"
        >
          <label htmlFor={`tf-${current?.name}`} className="block">
            <span className="text-lg font-medium text-slate-500">
              {step + 1} of {steps.length}
            </span>
            <span className="mt-2 block text-2xl font-bold text-slate-900 sm:text-3xl">
              {current?.label}
            </span>
          </label>
          {current?.type === "textarea" ? (
            <textarea
              id={`tf-${current?.name}`}
              name={current?.name}
              value={data[current?.name] ?? ""}
              onChange={(e) => update(current?.name, e.target.value)}
              onKeyDown={handleKeyDown}
              required={current?.required}
              placeholder={current?.placeholder}
              rows={3}
              className="mt-6 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-lg text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          ) : (
            <input
              id={`tf-${current?.name}`}
              type={current?.type}
              name={current?.name}
              value={data[current?.name] ?? ""}
              onChange={(e) => update(current?.name, e.target.value)}
              onKeyDown={handleKeyDown}
              required={current?.required}
              placeholder={current?.placeholder}
              autoComplete={current?.autoComplete}
              className="mt-6 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-lg text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex gap-3">
        {!isFirst && (
          <button
            type="button"
            onClick={goBack}
            className="rounded-xl border-2 border-slate-200 px-5 py-2.5 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={loading && isLast}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70"
        >
          {loading && isLast ? "Sending…" : isLast ? submitLabel : "Next"}
        </button>
      </div>
    </div>
  );
}
