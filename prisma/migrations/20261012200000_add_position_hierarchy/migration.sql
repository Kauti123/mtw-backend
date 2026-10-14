-- AlterTable
ALTER TABLE `corporate_position` ADD COLUMN `hierarchy` VARCHAR(64) NULL;

-- CreateIndex
CREATE INDEX `corporate_position_corporate_id_hierarchy_idx` ON `corporate_position`(`corporate_id`, `hierarchy`);
