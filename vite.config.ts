import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project site: https://kuyu123.github.io/Green-Electricity-Direct-Connection/
export default defineConfig({
  base: "/Green-Electricity-Direct-Connection/",
  plugins: [react()],
});
