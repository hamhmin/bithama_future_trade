-- CreateTable
CREATE TABLE `Candle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `symbol` VARCHAR(191) NOT NULL,
    `interval` VARCHAR(191) NOT NULL,
    `openTime` INTEGER NOT NULL,
    `open` DOUBLE NOT NULL,
    `high` DOUBLE NOT NULL,
    `low` DOUBLE NOT NULL,
    `close` DOUBLE NOT NULL,
    `volume` DOUBLE NOT NULL,

    UNIQUE INDEX `Candle_symbol_interval_openTime_key`(`symbol`, `interval`, `openTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
