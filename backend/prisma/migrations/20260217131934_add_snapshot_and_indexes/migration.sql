-- CreateTable
CREATE TABLE "dashboard_snapshots" (
    "id" SERIAL NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "computedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tripCount" INTEGER NOT NULL,

    CONSTRAINT "dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_snapshots_cacheKey_key" ON "dashboard_snapshots"("cacheKey");

-- CreateIndex
CREATE INDEX "dashboard_snapshots_cacheKey_idx" ON "dashboard_snapshots"("cacheKey");

-- CreateIndex
CREATE INDEX "trips_range_idx" ON "trips"("range");

-- CreateIndex
CREATE INDEX "trips_material_idx" ON "trips"("material");

-- CreateIndex
CREATE INDEX "trips_freightTigerMonth_idx" ON "trips"("freightTigerMonth");

-- CreateIndex
CREATE INDEX "trips_indentDate_range_idx" ON "trips"("indentDate", "range");

-- CreateIndex
CREATE INDEX "trips_vehicleNumber_indentDate_idx" ON "trips"("vehicleNumber", "indentDate");
