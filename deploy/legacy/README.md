# Legacy deployment files — NOT USED

Nothing in this directory takes part in the supported deployment. It is kept
only as a reference for the standalone VPS setup that predates Coolify.

**The supported topology is the root `Dockerfile`**: one container running
nginx + supervisord + node on port **80**. Coolify builds that file, injects
environment variables from its UI, terminates TLS, and reverse-proxies to
port 80.

## Why these files were retired

### `docker-compose.yml`

It describes a completely different, conflicting topology:

- four containers (postgres, backend, frontend, nginx) instead of one;
- an `nginx` service that **binds host ports 80 and 443** and terminates TLS
  itself. Under Coolify those bindings collide with Coolify's own proxy, and
  the duplicated TLS termination fights it for the certificate;
- a bundled PostgreSQL container, while production uses a remote managed
  database supplied via `DATABASE_URL`;
- per-service `backend/Dockerfile` and `frontend/Dockerfile` builds, which are
  not what the root `Dockerfile` produces.

If you run this against a Coolify host it will either fail to bind or take over
ports Coolify is already serving on.

### `nginx/`

`docker-nginx.conf` and `tata-dashboard.conf` are the reverse-proxy and TLS
configs for that four-container layout and for a host-level nginx install. The
single container uses `nginx.combined.conf` at the repository root instead;
these are unrelated to it. `nginx/` was already excluded from the image by
`.dockerignore`.

## Also removed

`backend/nixpacks.toml` and `frontend/nixpacks.toml` were deleted outright
rather than moved here. They were actively harmful:

- Nixpacks builds a glibc image, but the Prisma query engine in this project is
  compiled for the Alpine (musl) base the root `Dockerfile` uses — the client
  fails to load at runtime;
- `frontend/nixpacks.toml` ran `vite preview` as the production server. That is
  a development preview server: no compression, no caching, no hardening, and
  it depends on the `allowedHosts` list in `vite.config.ts` staying in sync with
  whatever domain is live.

Anything that would have been served by nixpacks is served by nginx inside the
single container.

## Local development

Use `docker-compose.dev.yml` at the repository root. It is unrelated to these
files: it stays on ports 5173/5000/5432 and never touches 80/443.
