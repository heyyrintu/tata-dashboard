// Placeholder runtime configuration.
//
// In production this file is OVERWRITTEN by docker-entrypoint.sh, which writes
// the VITE_* variables Coolify injected into the container before nginx starts
// serving. Leaving it empty here means `npm run dev` and `npm run build` fall
// back to build-time `import.meta.env` values, and the app never 404s on
// /env.js. See frontend/src/lib/runtimeEnv.ts.
window.__ENV__ = window.__ENV__ || {};
