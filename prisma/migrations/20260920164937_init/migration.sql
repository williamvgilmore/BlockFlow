-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "lastObservedAt" TIMESTAMP(3) NOT NULL,
    "buyPrice" DECIMAL(20,8) NOT NULL,
    "sellPrice" DECIMAL(20,8) NOT NULL,
    "buyVolume" BIGINT NOT NULL,
    "sellVolume" BIGINT NOT NULL,
    "buyMovingWeek" BIGINT NOT NULL,
    "sellMovingWeek" BIGINT NOT NULL,
    "buyOrders" INTEGER NOT NULL,
    "sellOrders" INTEGER NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "buyPrice" DECIMAL(20,8) NOT NULL,
    "sellPrice" DECIMAL(20,8) NOT NULL,
    "buyVolume" BIGINT NOT NULL,
    "sellVolume" BIGINT NOT NULL,
    "buyMovingWeek" BIGINT NOT NULL,
    "sellMovingWeek" BIGINT NOT NULL,
    "buyOrders" INTEGER NOT NULL,
    "sellOrders" INTEGER NOT NULL,

    CONSTRAINT "ProductSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3),
    "productCount" INTEGER,
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "IngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductSnapshot_observedAt_idx" ON "ProductSnapshot"("observedAt");

-- CreateIndex
CREATE INDEX "ProductSnapshot_productId_observedAt_idx" ON "ProductSnapshot"("productId", "observedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSnapshot_productId_observedAt_key" ON "ProductSnapshot"("productId", "observedAt");

-- AddForeignKey
ALTER TABLE "ProductSnapshot" ADD CONSTRAINT "ProductSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
