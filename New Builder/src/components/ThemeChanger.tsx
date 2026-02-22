import { useState, useRef, useEffect, useCallback } from 'react';
import { useBuilderStore } from '../store/useBuilderStore';
import type { ThemeColors } from '../types';

const COLOR_KEYS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'textMuted', label: 'Muted' },
];

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  h /= 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return `#${v.toString(16).padStart(2, '0')}${v.toString(16).padStart(2, '0')}${v.toString(16).padStart(2, '0')}`;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function ColorStripSwatch({
  color,
  label,
  isActive,
  onClick,
}: {
  color: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const hsl = hexToHSL(color);
  const textColor = hsl.l > 0.55 ? '#1e293b' : '#ffffff';

  return (
    <button
      type="button"
      onClick={onClick}
      className="theme-strip-swatch"
      style={{
        backgroundColor: color,
        color: textColor,
        flex: 1,
        border: isActive ? '2px solid #6366f1' : '2px solid transparent',
        boxShadow: isActive ? '0 0 0 2px #6366f1, inset 0 0 0 1px rgba(255,255,255,.3)' : 'none',
        transform: isActive ? 'scale(1.08)' : 'scale(1)',
      }}
      title={`${label}: ${color}`}
    >
      <span className="theme-strip-label">{label}</span>
    </button>
  );
}

function HueShiftSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="theme-hue-slider">
      <label className="theme-hue-label">
        <span>Hue shift</span>
        <span className="theme-hue-value">{value > 0 ? `+${value}` : value}°</span>
      </label>
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="theme-hue-input"
        style={{
          background: `linear-gradient(to right,
            hsl(0,80%,50%), hsl(60,80%,50%), hsl(120,80%,50%),
            hsl(180,80%,50%), hsl(240,80%,50%), hsl(300,80%,50%), hsl(360,80%,50%))`,
        }}
      />
      {value !== 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="theme-hue-reset"
        >
          Reset
        </button>
      )}
    </div>
  );
}

export function ThemeChanger() {
  const { theme, themes, setTheme, setThemeColors } = useBuilderStore();
  const [expanded, setExpanded] = useState(false);
  const [editingColor, setEditingColor] = useState<keyof ThemeColors | null>(null);
  const [hueShift, setHueShift] = useState(0);
  const baseColorsRef = useRef<ThemeColors>({ ...theme.colors });
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setEditingColor(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeSelect = (t: typeof themes[0]) => {
    setTheme(t);
    baseColorsRef.current = { ...t.colors };
    setHueShift(0);
  };

  const handleHueShift = useCallback(
    (shift: number) => {
      setHueShift(shift);
      const base = baseColorsRef.current;
      const shifted: Partial<ThemeColors> = {};
      for (const { key } of COLOR_KEYS) {
        const hsl = hexToHSL(base[key]);
        shifted[key] = hslToHex((hsl.h + shift + 360) % 360, hsl.s, hsl.l);
      }
      setThemeColors(shifted);
    },
    [setThemeColors],
  );

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setThemeColors({ [key]: value });
    baseColorsRef.current = { ...baseColorsRef.current, [key]: value };
  };

  return (
    <div className="theme-changer">
      {/* Current theme strip preview */}
      <div className="theme-changer-header">
        <h2 className="theme-changer-title">Theme</h2>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="theme-changer-toggle"
        >
          {expanded ? 'Collapse' : 'Customize'}
        </button>
      </div>

      {/* Active color strip */}
      <div className="theme-strip-current">
        {COLOR_KEYS.map(({ key, label }) => (
          <ColorStripSwatch
            key={key}
            color={theme.colors[key]}
            label={label}
            isActive={editingColor === key}
            onClick={() => setEditingColor(editingColor === key ? null : key)}
          />
        ))}
      </div>

      {/* Inline color editor when a swatch is tapped */}
      {editingColor && (
        <div ref={pickerRef} className="theme-color-editor">
          <div className="theme-color-editor-header">
            <span className="theme-color-editor-label">
              {COLOR_KEYS.find((c) => c.key === editingColor)?.label}
            </span>
            <span className="theme-color-editor-value">{theme.colors[editingColor]}</span>
          </div>
          <div className="theme-color-editor-row">
            <input
              type="color"
              value={theme.colors[editingColor]}
              onChange={(e) => handleColorChange(editingColor, e.target.value)}
              className="theme-color-picker"
            />
            <input
              type="text"
              value={theme.colors[editingColor]}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{6}$/.test(v)) handleColorChange(editingColor, v);
              }}
              placeholder="#000000"
              className="theme-color-hex-input"
            />
          </div>
        </div>
      )}

      {/* Hue shift slider - always visible */}
      <HueShiftSlider value={hueShift} onChange={handleHueShift} />

      {/* Expanded: preset theme grid */}
      {expanded && (
        <div className="theme-presets">
          <h3 className="theme-presets-title">Preset Themes</h3>
          <div className="theme-presets-grid">
            {themes.map((t) => {
              const isActive = theme.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleThemeSelect(t)}
                  className={`theme-preset-card ${isActive ? 'theme-preset-active' : ''}`}
                >
                  <div className="theme-preset-strip">
                    {(['primary', 'secondary', 'accent', 'background', 'surface'] as const).map(
                      (key) => (
                        <div
                          key={key}
                          className="theme-preset-swatch"
                          style={{ backgroundColor: t.colors[key] }}
                        />
                      ),
                    )}
                  </div>
                  <span className="theme-preset-name">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
