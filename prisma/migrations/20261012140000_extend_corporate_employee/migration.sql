-- Extend corporate_employee for Create Employee wizard fields.

ALTER TABLE `corporate_employee`
    ADD COLUMN `title` VARCHAR(16) NULL,
    ADD COLUMN `first_name` VARCHAR(128) NULL,
    ADD COLUMN `last_name` VARCHAR(128) NULL,
    ADD COLUMN `phone` VARCHAR(32) NULL,
    ADD COLUMN `gender` VARCHAR(16) NULL,
    ADD COLUMN `position` VARCHAR(128) NULL,
    ADD COLUMN `department_name` VARCHAR(128) NULL,
    ADD COLUMN `cost_center_name` VARCHAR(128) NULL,
    ADD COLUMN `address` VARCHAR(255) NULL,
    ADD COLUMN `city` VARCHAR(128) NULL,
    ADD COLUMN `state` VARCHAR(128) NULL,
    ADD COLUMN `pin_code` VARCHAR(16) NULL,
    ADD COLUMN `corporate_name` VARCHAR(255) NULL,
    ADD COLUMN `corporate_code` VARCHAR(64) NULL,
    ADD COLUMN `access_json` JSON NULL,
    ADD COLUMN `joined_at` DATETIME(3) NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

CREATE INDEX `corporate_employee_status_idx` ON `corporate_employee`(`status`);
CREATE INDEX `corporate_employee_department_name_idx` ON `corporate_employee`(`department_name`);
CREATE INDEX `corporate_employee_position_idx` ON `corporate_employee`(`position`);
