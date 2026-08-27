-- CreateTable
CREATE TABLE "Candle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "open" REAL NOT NULL,
    "high" REAL NOT NULL,
    "low" REAL NOT NULL,
    "close" REAL NOT NULL,
    "volume" REAL,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StrategyConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "lookbackPeriod" INTEGER NOT NULL DEFAULT 5,
    "retestTolerance" REAL NOT NULL DEFAULT 10,
    "confirmationBars" INTEGER NOT NULL DEFAULT 1,
    "expireAfterBars" INTEGER NOT NULL DEFAULT 20,
    "mirroredEnabled" BOOLEAN NOT NULL DEFAULT false,
    "params" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SwingPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "configId" TEXT NOT NULL,
    "invalidatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SwingPoint_configId_fkey" FOREIGN KEY ("configId") REFERENCES "StrategyConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StrategySignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "candleTimestamp" DATETIME NOT NULL,
    "swingPointId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "configId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StrategySignal_swingPointId_fkey" FOREIGN KEY ("swingPointId") REFERENCES "SwingPoint" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StrategySignal_configId_fkey" FOREIGN KEY ("configId") REFERENCES "StrategyConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "startingBalance" REAL NOT NULL,
    "currentBalance" REAL NOT NULL,
    "highWaterMark" REAL NOT NULL,
    "profitTarget" REAL NOT NULL,
    "trailingDrawdown" REAL NOT NULL,
    "drawdownMode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PayoutRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "consistencyRulePct" REAL NOT NULL DEFAULT 50,
    "minWinningDays" INTEGER NOT NULL DEFAULT 5,
    "minWinningDayAmount" REAL NOT NULL DEFAULT 150,
    "minTradingDays" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PayoutRule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL DEFAULT 'MNQ',
    "direction" TEXT NOT NULL,
    "contracts" INTEGER NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL,
    "entryTime" DATETIME NOT NULL,
    "exitTime" DATETIME,
    "stopLoss" REAL,
    "takeProfit" REAL,
    "fees" REAL NOT NULL DEFAULT 0,
    "contractMultiplier" REAL NOT NULL DEFAULT 2,
    "pnl" REAL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "tags" TEXT,
    "signalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trade_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "StrategySignal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Candle_symbol_timeframe_timestamp_idx" ON "Candle"("symbol", "timeframe", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Candle_symbol_timeframe_timestamp_key" ON "Candle"("symbol", "timeframe", "timestamp");

-- CreateIndex
CREATE INDEX "SwingPoint_symbol_timeframe_timestamp_idx" ON "SwingPoint"("symbol", "timeframe", "timestamp");

-- CreateIndex
CREATE INDEX "StrategySignal_symbol_timeframe_candleTimestamp_idx" ON "StrategySignal"("symbol", "timeframe", "candleTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutRule_accountId_key" ON "PayoutRule"("accountId");

-- CreateIndex
CREATE INDEX "Trade_accountId_entryTime_idx" ON "Trade"("accountId", "entryTime");
