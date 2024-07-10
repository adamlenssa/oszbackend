/*
  Warnings:

  - You are about to alter the column `type` on the `song` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `song` MODIFY `type` ENUM('shewa', 'wallaga', 'arsi', 'bale', 'jimma', 'hararghe', 'borana', 'guji', 'illubabor', 'karayuu', 'modern', 'oldies') NOT NULL;
