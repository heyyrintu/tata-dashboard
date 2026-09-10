-- CreateTable
CREATE TABLE "shipments" (
    "id" SERIAL NOT NULL,
    "srNo" INTEGER,
    "sourceSheet" TEXT,
    "branch" TEXT,
    "pickupLocation" TEXT,
    "partyName" TEXT,
    "destination" TEXT,
    "lane" TEXT,
    "invoiceNumber" TEXT,
    "lrNo" TEXT,
    "lrDate" TIMESTAMPTZ,
    "material" TEXT,
    "materialSku" TEXT,
    "packSizeLtr" DOUBLE PRECISION,
    "buckets" DOUBLE PRECISION DEFAULT 0,
    "totalQuantityLtr" DOUBLE PRECISION DEFAULT 0,
    "loadType" TEXT,
    "expectedDeliveryDate" TIMESTAMPTZ,
    "actualDeliveryDate" TIMESTAMPTZ,
    "dispatchDate" TIMESTAMPTZ,
    "dispatchFrom" TEXT,
    "deliveryStatus" TEXT,
    "deliveryStatusRaw" TEXT,
    "lrStatus" TEXT,
    "damage" BOOLEAN DEFAULT false,
    "delayDays" INTEGER,
    "isOnTime" BOOLEAN,
    "dispatchToDeliveryDays" INTEGER,
    "loadingCharges" DOUBLE PRECISION DEFAULT 0,
    "unloadingCharges" DOUBLE PRECISION DEFAULT 0,
    "vehicleNumber" TEXT,
    "vehicleType" TEXT,
    "vendorName" TEXT,
    "dispatchVehicle" TEXT,
    "routeCode" TEXT,
    "ply" DOUBLE PRECISION DEFAULT 0,
    "podStatus" TEXT,
    "podStatusRaw" TEXT,
    "podReceived" BOOLEAN DEFAULT false,
    "monthKey" TEXT,
    "remarks" TEXT,
    "dataFlags" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "shipments_lrDate_idx" ON "shipments"("lrDate");

-- CreateIndex
CREATE INDEX "shipments_monthKey_idx" ON "shipments"("monthKey");

-- CreateIndex
CREATE INDEX "shipments_branch_idx" ON "shipments"("branch");

-- CreateIndex
CREATE INDEX "shipments_deliveryStatus_idx" ON "shipments"("deliveryStatus");

-- CreateIndex
CREATE INDEX "shipments_podStatus_idx" ON "shipments"("podStatus");

-- CreateIndex
CREATE INDEX "shipments_vendorName_idx" ON "shipments"("vendorName");

-- CreateIndex
CREATE INDEX "shipments_materialSku_idx" ON "shipments"("materialSku");

-- CreateIndex
CREATE INDEX "shipments_branch_lrDate_idx" ON "shipments"("branch", "lrDate");

-- CreateIndex
CREATE INDEX "shipments_monthKey_branch_idx" ON "shipments"("monthKey", "branch");

-- CreateIndex
CREATE INDEX "shipments_lrDate_deliveryStatus_idx" ON "shipments"("lrDate", "deliveryStatus");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_snapshots_cacheKey_key" ON "dashboard_snapshots"("cacheKey");
