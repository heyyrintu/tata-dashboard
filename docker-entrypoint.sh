#!/bin/sh
set -eu

# ---------------------------------------------------------------------------
# Runtime configuration for the SPA.
#
# Vite inlines VITE_* variables at BUILD time, but Coolify injects environment
# variables at RUNTIME into the already-built image. Without this step, a value
# set in the Coolify UI would never reach the browser and every config change
# would need a full rebuild.
#
# So: before nginx serves anything, write the current environment into
# /env.js, which index.html loads ahead of the app bundle. See
# frontend/src/lib/runtimeEnv.ts for the read side.
#
# Only PUBLIC configuration belongs here - this file is served to every visitor.
# ---------------------------------------------------------------------------
ENV_FILE=/usr/share/nginx/html/env.js

# node does the writing so values are JSON-escaped properly; shell string
# interpolation would break on a quote or a newline in any of these.
node -e '
const keys = [
  "VITE_API_URL",
  "VITE_API_KEY",
  "VITE_APPWRITE_ENDPOINT",
  "VITE_APPWRITE_PROJECT_ID",
  "VITE_APPWRITE_ADMIN_TEAM_ID",
  "VITE_LOGO_URL",
];
const config = {};
for (const key of keys) {
  const value = process.env[key];
  if (value) config[key] = value;
}
require("fs").writeFileSync(
  process.argv[1],
  "window.__ENV__ = " + JSON.stringify(config) + ";\n"
);
console.log(
  "[Entrypoint] Wrote runtime config for: " +
    (Object.keys(config).join(", ") || "(nothing set)")
);
' "$ENV_FILE"

exec "$@"
