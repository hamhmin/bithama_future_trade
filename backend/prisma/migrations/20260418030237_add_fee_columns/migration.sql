-- AlterTable
ALTER TABLE `order` ADD COLUMN `fee` DOUBLE NULL,
    ADD COLUMN `feeType` VARCHAR(191) NULL,
    ADD COLUMN `marginType` VARCHAR(191) NOT NULL DEFAULT 'isolated';

-- AlterTable
ALTER TABLE `position` ADD COLUMN `stopLoss` DOUBLE NULL,
    ADD COLUMN `takeProfit` DOUBLE NULL;

-- CreateTable
CREATE TABLE `UserSymbolSetting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `symbol` VARCHAR(191) NOT NULL DEFAULT 'BTCUSDT',
    `marginType` VARCHAR(191) NOT NULL DEFAULT 'isolated',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserSymbolSetting_userId_symbol_key`(`userId`, `symbol`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserSymbolSetting` ADD CONSTRAINT `UserSymbolSetting_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
