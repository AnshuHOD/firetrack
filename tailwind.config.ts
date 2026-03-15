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
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        card: "var(--bg-card)",
        border: "var(--border)",
        textSecondary: "var(--text-secondary)",
        accentRed: "var(--accent-red)",
        accentOrange: "var(--accent-orange)",
        accentGreen: "var(--accent-green)",
        accentBlue: "var(--accent-blue)",
      },
    },
  },
  plugins: [],
};
export default config;
