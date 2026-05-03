-- CreateIndex
CREATE INDEX `Candle_symbol_interval_openTime_idx` ON `Candle`(`symbol`, `interval`, `openTime`);
