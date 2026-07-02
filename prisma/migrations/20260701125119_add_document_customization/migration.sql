-- AlterTable
ALTER TABLE "document_type" ADD COLUMN     "paper_size" TEXT NOT NULL DEFAULT 'A4',
ADD COLUMN     "template" TEXT;
