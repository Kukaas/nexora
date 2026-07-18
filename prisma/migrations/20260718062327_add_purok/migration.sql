-- CreateEnum
CREATE TYPE "Purok" AS ENUM ('PUROK_1', 'PUROK_2', 'PUROK_3', 'PUROK_4', 'PUROK_5', 'PUROK_6', 'PUROK_7');

-- AlterTable
ALTER TABLE "announcement" ADD COLUMN     "purok" "Purok";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "purok" "Purok";

-- CreateIndex
CREATE INDEX "announcement_purok_idx" ON "announcement"("purok");
