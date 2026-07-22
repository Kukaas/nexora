/*
  Warnings:

  - A unique constraint covering the columns `[verification_code]` on the table `document_request` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "document_request" ADD COLUMN     "verification_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "document_request_verification_code_key" ON "document_request"("verification_code");
