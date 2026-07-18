/*
  Warnings:

  - You are about to drop the column `time` on the `announcement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "announcement" DROP COLUMN "time",
ADD COLUMN     "end_time" TEXT,
ADD COLUMN     "start_time" TEXT;
