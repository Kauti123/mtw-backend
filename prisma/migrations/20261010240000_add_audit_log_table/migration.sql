-- Audit / activity timeline for Misba Supervision.

CREATE TABLE `audit_log` (
    `id` VARCHAR(191) NOT NULL,
    `corporate_id` VARCHAR(64) NULL,
    `actor_id` VARCHAR(64) NULL,
    `actor_type` VARCHAR(32) NULL,
    `actor_name` VARCHAR(255) NULL,
    `actor_email` VARCHAR(320) NULL,
    `action` VARCHAR(64) NOT NULL,
    `resource_type` VARCHAR(64) NOT NULL,
    `resource_id` VARCHAR(64) NULL,
    `target_label` VARCHAR(255) NULL,
    `result` VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    `before_json` JSON NULL,
    `after_json` JSON NULL,
    `metadata` JSON NULL,
    `ip` VARCHAR(64) NULL,
    `user_agent` VARCHAR(512) NULL,
    `correlation_id` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_corporate_id_created_at_idx`(`corporate_id`, `created_at`),
    INDEX `audit_log_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    INDEX `audit_log_correlation_id_idx`(`correlation_id`),
    INDEX `audit_log_actor_id_created_at_idx`(`actor_id`, `created_at`),
    INDEX `audit_log_action_created_at_idx`(`action`, `created_at`),
    INDEX `audit_log_result_created_at_idx`(`result`, `created_at`),
    INDEX `audit_log_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
