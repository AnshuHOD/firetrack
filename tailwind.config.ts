import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core surfaces
        background:    "var(--bg-primary)",
        bgSecondary:   "var(--bg-secondary)",
        foreground:    "var(--text-primary)",
        card:          "var(--bg-card)",
        hoverBg:       "var(--bg-hover)",
        border:        "var(--border)",
        borderStrong:  "var(--border-strong)",
        textSecondary: "var(--text-secondary)",
        textMuted:     "var(--text-muted)",

        // Brand
        navbar:        "var(--navbar)",
        btnBg:         "var(--btn-bg)",
        btnHover:      "var(--btn-hover)",
        accentBrown:   "var(--accent-brown)",

        // Semantic accents (re-tuned to earth tones)
        accentRed:     "var(--accent-red)",
        accentOrange:  "var(--accent-orange)",
        accentYellow:  "var(--accent-yellow)",
        accentGreen:   "var(--accent-green)",
        accentBlue:    "var(--accent-blue)",
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Boldonse', 'Bricolage Grotesque', 'Archivo Black', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
};
export default config;
