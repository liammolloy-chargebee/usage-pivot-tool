import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// When deploying to GitHub Pages at https://<user>.github.io/<repo>/,
// set BASE_PATH=/<repo>/ in the build env. Locally we keep "/".
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
});
