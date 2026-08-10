-- AlterTable
ALTER TABLE `ChatRoom` ADD COLUMN `imageUrl` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `recipient_email` VARCHAR(255) NULL,
    ADD COLUMN `recipient_name` VARCHAR(100) NULL,
    ADD COLUMN `recipient_phone` VARCHAR(30) NULL;
