-- CreateEnum
CREATE TYPE "IDStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "id" ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "status" "IDStatus" NOT NULL DEFAULT 'PENDING';
