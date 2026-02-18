"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

export type TypeformStepOption = { value: string; label: string };

export type TypeformStepConfig = {
  label: string;
  sublabel?: string;
  name: string;
  type: "text" | "email" | "password" | "textarea" | "select" | "radio" | "checkbox" | "checkboxGroup" | "info";
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  options?: TypeformStepOption[];
  showWhen?: (data: Record<string, string>) => boolean;
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

  const filteredSteps = useMemo(() => {
    return steps.filter((s) => (s.showWhen ? s.showWhen(data) : true));
  }, [steps, data]);

  const safeStep = Math.min(step, Math.max(0, filteredSteps.length - 1));
  const current = filteredSteps[safeStep];
  const isFirst = safeStep === 0;
  const isLast = safeStep === filteredSteps.length - 1;
  const progress = filteredSteps.length > 0 ? ((safeStep + 1) / filteredSteps.length) * 100 : 0;

  const update = (name: string, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCheckboxGroup = (name: string, value: string) => {
    setData((prev) => {
      const currentVal = prev[name] ?? "";
      const values = currentVal ? currentVal.split(",").filter(Boolean) : [];
      const idx = values.indexOf(value);
      const next = idx >= 0 ? values.filter((_, i) => i !== idx) : [...values, value];
      return { ...prev, [name]: next.join(",") };
    });
  };

  const getValueForStep = (s: TypeformStepConfig): string => {
    const val = data[s.name] ?? "";
    if (s.type === "checkbox") return val;
    if (s.type === "checkboxGroup") return val;
    return val;
  };

  const isStepValid = (s: TypeformStepConfig): boolean => {
    if (s.type === "info") return true;
    const value = getValueForStep(s);
    if (!s.required) return true;
    if (s.type === "checkbox") return value === "true";
    if (s.type === "checkboxGroup") return value.trim().length > 0;
    return String(value).trim().length > 0;
  };

  const goNext = () => {
    if (current && !isStepValid(current)) return;
    if (isLast) {
      onSubmit(data);
      return;
    }
    setDirection(1);
    setStep(safeStep + 1);
  };

  const goBack = () => {
    if (isFirst) return;
    setDirection(-1);
    setStep(safeStep - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const skipKey = ["select", "radio", "checkbox", "checkboxGroup", "info"].includes(current?.type ?? "");
    if (e.key === "Enter" && !skipKey && !current?.type.includes("textarea")) {
      e.preventDefault();
      const el = e.target as HTMLInputElement | HTMLTextAreaElement;
      const value = el instanceof HTMLInputElement && el.type === "checkbox" ? (el.checked ? "true" : "") : el.value;
      if (current?.required && !String(value).trim() && current?.type !== "checkbox") return;
      if (current?.type === "checkbox") update(current?.name ?? "", value);
      else update(current?.name ?? "", value);
      goNext();
    }
  };

  const inputBaseClass =
    "modern-input mt-6 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";

  const renderField = () => {
    if (!current) return null;

    if (current.type === "info") {
      return (
        <p className="mt-4 text-lg text-slate-600">
          {current.sublabel}
        </p>
      );
    }

    if (current.type === "textarea") {
      return (
        <textarea
          id={`tf-${current.name}`}
          name={current.name}
          value={data[current.name] ?? ""}
          onChange={(e) => update(current.name, e.target.value)}
          onKeyDown={handleKeyDown}
          required={current.required}
          placeholder={current.placeholder}
          rows={3}
          className={`${inputBaseClass} resize-none`}
        />
      );
    }

    if (current.type === "select") {
      return (
        <select
          id={`tf-${current.name}`}
          name={current.name}
          value={data[current.name] ?? ""}
          onChange={(e) => update(current.name, e.target.value)}
          className={inputBaseClass}
        >
          <option value="">Select an option</option>
          {(current.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (current.type === "radio") {
      return (
        <div className="mt-6 flex flex-col gap-3">
          {(current.options ?? []).map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 transition hover:border-emerald-300 has-[:checked]:border-emerald-500 has-[:checked]:ring-2 has-[:checked]:ring-emerald-500/20"
            >
              <input
                type="radio"
                name={current.name}
                value={opt.value}
                checked={(data[current.name] ?? "") === opt.value}
                onChange={() => update(current.name, opt.value)}
                className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-lg text-slate-900">{opt.label}</span>
            </label>
          ))}
        </div>
      );
    }

    if (current.type === "checkbox") {
      return (
        <label className="mt-6 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            id={`tf-${current.name}`}
            name={current.name}
            checked={(data[current.name] ?? "") === "true"}
            onChange={(e) => update(current.name, e.target.checked ? "true" : "")}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-lg text-slate-600">Yes, I'd like to receive updates</span>
        </label>
      );
    }

    if (current.type === "checkboxGroup") {
      const selected = (data[current.name] ?? "").split(",").filter(Boolean);
      return (
        <div className="mt-6 flex flex-col gap-2">
          {(current.options ?? []).map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition hover:border-emerald-300 has-[:checked]:border-emerald-500 has-[:checked]:ring-2 has-[:checked]:ring-emerald-500/20"
            >
              <input
                type="checkbox"
                name={`${current.name}-${opt.value}`}
                value={opt.value}
                checked={selected.includes(opt.value)}
                onChange={() => toggleCheckboxGroup(current.name, opt.value)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-900">{opt.label}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <input
        id={`tf-${current.name}`}
        type={current.type}
        name={current.name}
        value={data[current.name] ?? ""}
        onChange={(e) => update(current.name, e.target.value)}
        onKeyDown={handleKeyDown}
        required={current.required}
        placeholder={current.placeholder}
        autoComplete={current.autoComplete}
        className={inputBaseClass}
      />
    );
  };

  if (filteredSteps.length === 0) return null;

  return (
    <div className={className}>
      <div className="mb-10 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={current?.name ?? step}
          custom={direction}
          initial={{ opacity: 0, x: direction >= 0 ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction >= 0 ? -24 : 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-[120px]"
        >
          <label htmlFor={`tf-${current?.name}`} className="block">
            <span className="text-lg font-medium text-slate-500">
              {safeStep + 1} of {filteredSteps.length}
            </span>
            <span className="mt-2 block text-2xl font-bold text-slate-900 sm:text-3xl">
              {current?.label}
            </span>
          </label>
          {renderField()}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex gap-3">
        {!isFirst && (
          <button
            type="button"
            onClick={goBack}
            className="rounded-2xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={loading && isLast}
          className="glow-btn rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-7 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-70"
        >
          {loading && isLast ? "Sending…" : isLast ? submitLabel : "Next"}
        </button>
      </div>
    </div>
  );
}
