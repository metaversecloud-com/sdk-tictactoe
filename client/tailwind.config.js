/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  // Disable Tailwind's preflight so our cascade layers work as expected.
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
