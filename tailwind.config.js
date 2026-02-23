/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        neon: "#00f0ff",
        neon2: "#ff2d55",
        neon3: "#a855f7",
        gold: "#ffd700",
        arena: {
          bg: "#05050a",
          surface: "#0f0f1a",
          surface2: "#14142a",
          border: "rgba(255,255,255,0.06)",
        },
      },
      fontFamily: {
        display: ["Orbitron", "monospace"],
        body: ["Rajdhani", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-neon": "pulseNeon 2s ease-in-out infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "shake": "shake 0.4s ease-in-out",
      },
      keyframes: {
        pulseNeon: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
      },
    },
  },
  plugins: [],
};
