/*
  Warnings:

  - The values [shewa,wallaga,arsi,bale,jimma,wallo,hararghe,borana,guji,illubabor,karayuu,modern,oldies] on the enum `song_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `song` MODIFY `type` ENUM('Shewa', 'Wallaga', 'Arsi', 'Bale', 'Jimma', 'Wallo', 'Hararghe', 'Borana', 'Guji', 'Illubabor', 'Karayuu', 'Modern', 'Oldies') NOT NULL;
