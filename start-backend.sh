#!/bin/sh
set -eu

cd /app/backend

# ---------------------------------------------------------------------------
# Schema changes come from prisma/migrations/ ONLY.
#
# This script used to run `prisma db push --skip-generate` on every container
# boot. `db push` diffs the live database against schema.prisma and rewrites the
# database to match - it generates its own SQL, ignores prisma/migrations/, and
# will drop or retype columns without asking. Running that against the remote
# production database on each redeploy meant an ordinary deploy could silently
# destroy data.
#
# `migrate deploy` is the production counterpart: it applies only the migration
# files that are not yet recorded in _prisma_migrations, never invents SQL, and
# is a no-op once the database is current. Re-running it on every boot is safe.
#
# Set RUN_MIGRATIONS=false to skip it entirely (e.g. when a separate release
# step owns migrations).
# ---------------------------------------------------------------------------
if [ "${RUN_MIGRATIONS:-true}" = "false" ]; then
    echo "[Startup] RUN_MIGRATIONS=false - skipping prisma migrate deploy"
else
    echo "[Startup] Applying pending Prisma migrations (migrate deploy)..."
    if ! npx --no-install prisma migrate deploy; then
        echo "[Startup] ERROR: prisma migrate deploy failed."
        echo "[Startup]"
        echo "[Startup] If this database was originally created with 'prisma db push'"
        echo "[Startup] it has no _prisma_migrations history, so the baseline migration"
        echo "[Startup] cannot be applied on top of the tables that already exist."
        echo "[Startup] Baseline it ONCE, from a shell with DATABASE_URL set:"
        echo "[Startup]"
        echo "[Startup]   npx prisma migrate resolve --applied 20260910054116_init_npl_shipments"
        echo "[Startup]"
        echo "[Startup] That only inserts a row into _prisma_migrations; it does not"
        echo "[Startup] touch table data. Verify the live schema matches schema.prisma"
        echo "[Startup] first with: npx prisma migrate diff \\"
        echo "[Startup]   --from-url \"\$DATABASE_URL\" --to-schema-datamodel prisma/schema.prisma"
        exit 1
    fi
fi

echo "[Startup] Starting Node.js server..."
exec node /app/backend/dist/server.js
