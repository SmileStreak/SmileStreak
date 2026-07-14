/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      animation: {
        pop: "pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        glow: "glow 0.8s ease-out",
        fade: "fade 0.4s ease-out",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "60%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 0 rgba(249,115,22,0)" },
          "60%": { boxShadow: "0 0 28px rgba(249,115,22,0.55)" },
          "100%": { boxShadow: "0 0 0 rgba(249,115,22,0)" },
        },
        fade: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
