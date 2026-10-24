-- Travel policy tables used by policy-service stepwise CRUD wizard.

CREATE TABLE `policy_travel_policy` (
    `id` VARCHAR(191) NOT NULL,
    `corporate_id` VARCHAR(64) NULL,
    `name` VARCHAR(128) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `policy_type` VARCHAR(64) NOT NULL DEFAULT 'STANDARD',
    `description` VARCHAR(250) NULL,
    `applicable_to` VARCHAR(64) NOT NULL DEFAULT 'ALL_EMPLOYEES',
    `status` VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    `current_step` INT NOT NULL DEFAULT 1,
    `completed_steps` JSON NULL,
    `travel_rules` JSON NULL,
    `spending_limits` JSON NULL,
    `approval_workflow` JSON NULL,
    `assignment` JSON NULL,
    `created_by` VARCHAR(128) NULL,
    `updated_by` VARCHAR(128) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `policy_travel_policy_code_key`(`code`),
    INDEX `policy_travel_policy_corporate_id_idx`(`corporate_id`),
    INDEX `policy_travel_policy_status_idx`(`status`),
    INDEX `policy_travel_policy_policy_type_idx`(`policy_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `policy_approval_request` (
    `id` VARCHAR(191) NOT NULL,
    `corporate_id` VARCHAR(191) NOT NULL,
    `booking_id` VARCHAR(191) NULL,
    `requester_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `levels` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `policy_approval_request_corporate_id_status_idx`(`corporate_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
