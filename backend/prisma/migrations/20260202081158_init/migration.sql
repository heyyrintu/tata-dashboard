-- CreateTable
CREATE TABLE "trips" (
    "id" SERIAL NOT NULL,
    "sNo" INTEGER,
    "indentDate" TIMESTAMPTZ,
    "indent" TEXT,
    "allocationDate" TIMESTAMPTZ,
    "customerName" TEXT,
    "location" TEXT,
    "vehicleModel" TEXT,
    "vehicleNumber" TEXT,
    "vehicleBased" TEXT,
    "lrNo" TEXT,
    "material" TEXT,
    "loadPerBucket" DOUBLE PRECISION DEFAULT 0,
    "noOfBuckets" DOUBLE PRECISION DEFAULT 0,
    "totalLoad" DOUBLE PRECISION DEFAULT 0,
    "podReceived" TEXT,
    "loadingCharge" DOUBLE PRECISION DEFAULT 0,
    "unloadingCharge" DOUBLE PRECISION DEFAULT 0,
    "actualRunning" DOUBLE PRECISION DEFAULT 0,
    "billableRunning" DOUBLE PRECISION DEFAULT 0,
    "range" TEXT,
    "remarks" TEXT,
    "freightTigerMonth" TEXT,
    "totalCostAE" DOUBLE PRECISION DEFAULT 0,
    "totalCostLoading" DOUBLE PRECISION DEFAULT 0,
    "totalCostUnload" DOUBLE PRECISION DEFAULT 0,
    "anyOtherCost" DOUBLE PRECISION DEFAULT 0,
    "remainingCost" DOUBLE PRECISION DEFAULT 0,
    "vehicleCost" DOUBLE PRECISION DEFAULT 0,
    "profitLoss" DOUBLE PRECISION DEFAULT 0,
    "totalKm" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trips_indentDate_idx" ON "trips"("indentDate");

-- CreateIndex
CREATE INDEX "trips_indent_idx" ON "trips"("indent");

-- CreateIndex
CREATE INDEX "trips_allocationDate_idx" ON "trips"("allocationDate");
