/**
 * Runtime configuration accessor.
 *
 * Vite inlines `import.meta.env.VITE_*` at BUILD time. Coolify injects
 * environment variables at RUNTIME, into the already-built container - so a
 * value set in the Coolify UI never reaches a bundle that was compiled before
 * it existed. Changing the Appwrite project or the API origin would require a
 * full image rebuild.
 *
 * Instead, the container entrypoint writes `/env.js` from the process
 * environment before nginx starts serving, and index.html loads it ahead of the
 * app bundle. This module reads that object, falling back to the build-time
 * value (which is what `npm run dev` and `vite build` still provide locally).
 *
 * Precedence: window.__ENV__ -> import.meta.env -> supplied fallback.
 *
 * Everything here is served to the browser in clear text. Only public
 * configuration belongs in a VITE_* variable; never a server-side secret.
 */

type RuntimeEnv = Record<string, string | undefined>;

declare global {
  interface Window {
    __ENV__?: RuntimeEnv;
  }
}

const runtimeEnv: RuntimeEnv =
  (typeof window !== 'undefined' && window.__ENV__) || {};

/**
 * Read a VITE_* configuration value.
 *
 * An empty string counts as "not set" so that a Coolify variable left blank
 * falls through to the build-time value rather than blanking the config.
 */
export function env(key: string, fallback = ''): string {
  const fromRuntime = runtimeEnv[key];
  if (fromRuntime) return fromRuntime;

  const fromBuild = (import.meta.env as unknown as RuntimeEnv)[key];
  if (fromBuild) return fromBuild;

  return fallback;
}

/** Boolean flags are opt-in: only the literal string "true" enables them. */
export function envFlag(key: string): boolean {
  return env(key) === 'true';
}
