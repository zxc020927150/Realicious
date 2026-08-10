/*
  Warnings:

  - A unique constraint covering the columns `[user_id,product_id]` on the table `favorites` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `cart` DROP FOREIGN KEY `cart_ibfk_2`;

-- DropForeignKey
ALTER TABLE `favorites` DROP FOREIGN KEY `favorites_ibfk_2`;

-- DropForeignKey
ALTER TABLE `product_tags` DROP FOREIGN KEY `product_tags_ibfk_1`;

-- DropForeignKey
ALTER TABLE `product_tags` DROP FOREIGN KEY `product_tags_ibfk_2`;

-- DropForeignKey
ALTER TABLE `stocks` DROP FOREIGN KEY `stocks_ibfk_2`;

-- DropIndex
DROP INDEX `user_id` ON `favorites`;

-- DropIndex
DROP INDEX `restaurant_id` ON `stocks`;

-- AlterTable
ALTER TABLE `cart` MODIFY `quantity` INTEGER NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX `uk_user_product` ON `favorites`(`user_id`, `product_id`);

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `product_tags` ADD CONSTRAINT `product_tags_ibfk_1` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `product_tags` ADD CONSTRAINT `product_tags_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `stocks` ADD CONSTRAINT `stocks_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- RenameIndex
ALTER TABLE `favorites` RENAME INDEX `product_id` TO `favorites_ibfk_2`;

-- RenameIndex
ALTER TABLE `product_tags` RENAME INDEX `product_id` TO `product_tags_ibfk_2`;

-- RenameIndex
ALTER TABLE `product_tags` RENAME INDEX `tag_id` TO `product_tags_ibfk_1`;

-- RenameIndex
ALTER TABLE `stocks` RENAME INDEX `product_id` TO `stocks_ibfk_2`;
