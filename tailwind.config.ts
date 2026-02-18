import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: "hsl(var(--destructive))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        dashboard: {
          DEFAULT: "hsl(var(--dashboard-bg))",
          sidebar: "hsl(var(--dashboard-sidebar))",
          card: "hsl(var(--dashboard-card))",
          "card-hover": "hsl(var(--dashboard-card-hover))",
          border: "hsl(var(--dashboard-border))",
          text: "hsl(var(--dashboard-text))",
          "text-muted": "hsl(var(--dashboard-text-muted))",
          input: "hsl(var(--dashboard-input-bg))",
          "input-border": "hsl(var(--dashboard-input-border))",
        },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
