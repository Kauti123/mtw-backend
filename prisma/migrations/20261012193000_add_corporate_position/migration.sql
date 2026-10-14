-- CreateTable
CREATE TABLE IF NOT EXISTS `corporate_position` (
    `id` VARCHAR(191) NOT NULL,
    `corporate_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `corporate_position_corporate_id_name_idx`(`corporate_id`, `name`),
    UNIQUE INDEX `corporate_position_corporate_id_code_key`(`corporate_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `corporate_position`
  ADD CONSTRAINT `corporate_position_corporate_id_fkey`
  FOREIGN KEY (`corporate_id`) REFERENCES `corporate_company`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
