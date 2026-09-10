# NPL DEF Dashboard — Production Deployment Guide

## Topology

One container, built from the **root `Dockerfile`**, listening on port **80**:

```
Coolify proxy (TLS)  ->  :80  nginx  ->  static SPA  (/usr/share/nginx/html)
                                     \-> /api, /health  ->  node :5000
                                                              |
                                                    remote PostgreSQL
```

nginx and node are supervised by `supervisord`, which runs as PID 1 via
`docker-entrypoint.sh`. TLS, certificates and the public hostname are Coolify's
job — the container never terminates TLS and never binds 443.

This is the only supported topology. The four-container `docker-compose.yml`
stack and the host-level nginx configs were retired to
[`deploy/legacy/`](deploy/legacy/README.md); the nixpacks files were deleted.
Do not resurrect them under Coolify: they bind host ports 80/443 and fight
Coolify's proxy for them.

---

## Coolify setup

Build pack: **Dockerfile**. Path: `/Dockerfile`. Exposed port: **80**.

There are **no build arguments**. Every setting below is an ordinary runtime
environment variable, so changing one is a container restart, not a rebuild.

### Required variables

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Remote PostgreSQL connection string. |
| `FRONTEND_URL` | Public origin(s) allowed to call the API from a browser. Comma-separated; the apex/www counterpart of each entry is allowed automatically. |
| `API_KEY` | Shared secret for `/api/*`. **The server refuses to boot in production without it.** |

Generate the key with `openssl rand -hex 32`.

`API_KEY` is mandatory because `middleware/auth.ts` falls through to open access
when it is unset. An open `/api` includes `POST /api/upload`, which **replaces
every row in the shipments table** — no authentication, no undo.

### Optional variables

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_API_URL` | *(empty)* | Leave unset. nginx serves the SPA and proxies `/api` on the same origin, so the empty value resolves to a relative `/api`. Only set this if the API moves to a different host. |
| `VITE_API_KEY` | *(empty)* | The key the browser sends. See the warning below. |
| `VITE_APPWRITE_ENDPOINT` | | Appwrite console values, for the browser SDK. |
| `VITE_APPWRITE_PROJECT_ID` | | |
| `APPWRITE_ENDPOINT` | | Same values again, unprefixed, so the **backend** can verify JWTs. Without them no user can be identified — see *Roles*. |
| `APPWRITE_PROJECT_ID` | | |
| `HO_TEAM_ID` | | Appwrite team whose members see real carrier names. |
| `ADMIN_TEAM_ID` | | Appwrite team whose members may upload. |
| `CLIENT_VIEW` | `auto` | Masking kill-switch: `auto`, `always`, `off`. |
| `VITE_LOGO_URL` | `/logo.png` | |
| `RUN_MIGRATIONS` | `true` | Set `false` if a separate release step applies migrations. |
| `TRUST_PROXY` | `loopback, linklocal, uniquelocal` | See *Rate limiting* below. |
| `SHUTDOWN_TIMEOUT_MS` | `10000` | Must stay under `stopwaitsecs` (15s) in `supervisord.conf`. |
| `ENABLE_EMAIL_POLLING` | `false` | IMAP ingestion is opt-in; `IMAP_*` variables only matter when it is `true`. |

> **`VITE_*` variables are public.** They are written into `/env.js` and served
> to every visitor. `VITE_API_KEY` is therefore not a secret — it keeps casual
> traffic off the API, nothing more. Never put a server-side credential in a
> `VITE_*` variable.

`supervisord.conf` no longer carries an `environment=` allowlist, so the backend
inherits everything Coolify injects. Adding a new variable needs no changes here.

---

## How frontend configuration reaches the browser

Vite inlines `import.meta.env.VITE_*` at **build** time, but Coolify injects
environment at **runtime**, into an image that is already built. A variable set
in the Coolify UI would therefore never reach a bundle compiled before it
existed.

The container closes that gap:

1. `docker-entrypoint.sh` reads the `VITE_*` variables from the environment and
   writes `/usr/share/nginx/html/env.js` as `window.__ENV__ = {...}` — before
   nginx starts serving.
2. `index.html` loads `/env.js` ahead of the app bundle.
3. `frontend/src/lib/runtimeEnv.ts` reads it, falling back to the build-time
   value (which is what `npm run dev` uses locally).

nginx serves `/env.js` with `no-store` so a restarted container never serves the
previous config. Cache headers come from the `$cache_control` map in
`nginx.combined.conf` rather than per-location blocks, because a location that
declares its own `add_header` drops the server-level security headers.

**Consequence:** rebuild only for code changes. Config changes are a restart.

---

## Roles

Two audiences share one deployment:

| | Sees carrier names | May upload |
| --- | --- | --- |
| **Drona HO** (`HO_TEAM_ID`) | Real names | only if also in `ADMIN_TEAM_ID` |
| **Client / NPL** (everyone else) | `Carrier 4F2` pseudonyms | only if in `ADMIN_TEAM_ID` |

The two teams are **independent on purpose**. An HO analyst can read real
carrier names without being trusted to wipe and reload every shipment row, and
an operator can run the upload without needing carrier identities.

### How a role is established

1. The browser mints a short-lived Appwrite JWT (`account.createJWT()`) and
   sends it as `Authorization: Bearer …` on every API call.
2. The backend hands that token straight back to Appwrite: `account.get()`
   proves who it belongs to, and `teams.list()` on the same token says which
   teams that user is in.
3. Masking is applied **server-side**, before the payload is serialised.

Nothing the browser sends can raise its own role. There is no role header, no
role query parameter, and the frontend's copy of the role — fetched from
`GET /api/me` — only decides which buttons render. Carrier names a client is
not entitled to never leave the server, so they cannot be recovered from the
network tab, from the Excel export, or from the dashboard cache.

Every failure resolves to the masked role: no token, an expired token, a user
in no team, Appwrite unreachable. A misconfiguration hides names; it never
reveals them.

### Shared API key

`API_KEY` has no user behind it, so it always resolves to `client` and can
never upload. It ships to every browser as `VITE_API_KEY`, so treating it as
internal would publish carrier names to anyone who reads the JS bundle.

### Kill-switch

`CLIENT_VIEW=always` masks everyone regardless of role — use it if roles are
misconfigured and names are leaking. `CLIENT_VIEW=off` disables masking
entirely, for an internal-only deployment. An unrecognised value falls back to
`auto`, never to `off`.

### Local development

`VITE_BYPASS_AUTH=true` skips login, so no JWT exists. Set `DEV_ROLE=ho` (and
optionally `DEV_ADMIN=false` to exercise the HO-without-upload case) on the
backend instead. Both are ignored when `NODE_ENV=production`.

---

## Database migrations

The container runs `prisma migrate deploy` on boot (`start-backend.sh`). That
applies only the files in `backend/prisma/migrations/` that are not yet recorded
in `_prisma_migrations`, never generates SQL of its own, and is a no-op once the
database is current.

> **This replaced `prisma db push --skip-generate`, which ran on every boot.**
> `db push` diffs the live database against `schema.prisma` and rewrites the
> database to match — it ignores the migration files and will drop or retype
> columns without asking. Against the remote production database, an ordinary
> redeploy could destroy data.

### One-time baseline (required if the database was created with `db push`)

A database created by `db push` has no `_prisma_migrations` history, so
`migrate deploy` tries to apply the baseline migration on top of tables that
already exist and fails. Boot will fail with instructions until you baseline it.

**Verify first** that the live schema matches `schema.prisma`. This is read-only:

```bash
cd backend
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

An empty result means the schema already matches; then record the baseline:

```bash
npx prisma migrate resolve --applied 20260910054116_init_npl_shipments
```

`migrate resolve` only inserts a row into `_prisma_migrations`. It does not
create, alter or drop anything, and does not touch table data.

If `migrate diff` **does** print statements, the live schema has drifted from
`schema.prisma`. Do not baseline. Review the emitted SQL, take a backup, and
write a migration that reconciles the difference deliberately.

### Adding a migration later

```bash
cd backend
npx prisma migrate dev --name describe_the_change   # against a LOCAL database
```

Commit the generated folder. The next deploy applies it.

---

## Health checks

`GET /health` runs a probe query and returns:

- **200** with row counts when the database answers;
- **503** when it does not.

Point Coolify's health check at `/health` on port 80. It previously returned 200
even when the query failed, which reported healthy straight through an outage.

---

## Restarts and redeploys

Coolify sends `SIGTERM` on every redeploy. `server.ts` handles it: stop
accepting connections, drop idle keep-alive sockets, let in-flight requests
finish, stop the email poller, disconnect Prisma, exit 0. A
`SHUTDOWN_TIMEOUT_MS` guard forces exit if something hangs.

This matters most for `POST /api/upload`, which truncates and repopulates the
shipments table — a hard kill mid-upload leaves it half-written.

---

## Rate limiting and the proxy chain

Two proxies sit in front of node: Coolify's proxy and the in-container nginx.
Each appends to `X-Forwarded-For`. Without `trust proxy`, express sees every
request as coming from `127.0.0.1`, so `express-rate-limit` keys all clients to
one bucket — the per-client limits become a single global cap, and v8's
`X-Forwarded-For` validator errors at request time.

The default (`loopback, linklocal, uniquelocal`) walks back through loopback and
private addresses and stops at the first public one — the real client. Note that
a fixed `trust proxy` of `1` is **not** enough here: it resolves to Coolify's
proxy address, leaving every client in the same bucket. Override with
`TRUST_PROXY` only if the chain differs.

---

## Local development

```bash
make dev        # Postgres + hot-reload backend and frontend
make dev-logs
make dev-down
```

Frontend on 5173, backend on 5000, Postgres on 5432. Nothing binds 80 or 443.

To run the production image locally:

```bash
make build
DATABASE_URL=... API_KEY=... make run   # http://localhost:8080
make health
make stop
```

---

## Troubleshooting

**Container exits immediately, log says `Missing required environment variables`**
Set the named variable in Coolify. In production `DATABASE_URL`, `FRONTEND_URL`
and `API_KEY` are all mandatory.

**Boot fails on `prisma migrate deploy`**
The database has no migration history. Follow *One-time baseline* above.

**All `/api` calls return 401**
`API_KEY` and the browser's `VITE_API_KEY` differ. They must match. If users
are signed in, check `APPWRITE_ENDPOINT`/`APPWRITE_PROJECT_ID` on the backend
instead — a JWT that cannot be verified is rejected.

**An HO user sees pseudonyms**
Check, in order: `CLIENT_VIEW` is not `always`; `HO_TEAM_ID` matches the team
id in the Appwrite console; the user is actually a member of it; the backend
`APPWRITE_*` pair is set. Every one of those failing modes masks by design.
`GET /api/me` reports what the server decided and why (`role`, `via`).

**"You do not have permission" on upload**
The user is not in `ADMIN_TEAM_ID`. Being in `HO_TEAM_ID` does not grant
upload — the two teams are separate.

**Browser console: blocked by CORS**
The origin is not in `FRONTEND_URL`. Add it (comma-separated); the apex/www
counterpart is covered automatically. A rejected origin returns 403.

**Frontend shows stale configuration after changing a Coolify variable**
Restart the container — `/env.js` is written at boot. Hard-refresh if a proxy
cached it; nginx itself sends `no-store` for that path.

**Health check red but the app loads**
The database is unreachable. `/health` returns 503 by design; check
`DATABASE_URL` and the database's network rules.
