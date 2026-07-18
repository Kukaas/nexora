/*
  Warnings:

  - You are about to drop the column `image` on the `id` table. All the data in the column will be lost.
  - Added the required column `front_image` to the `id` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "id" DROP COLUMN "image",
ADD COLUMN     "back_image" TEXT,
ADD COLUMN     "front_image" TEXT NOT NULL;
