-- AlterTable
ALTER TABLE "document_request" ADD COLUMN     "field_values" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "document_type" ADD COLUMN     "fields" JSONB NOT NULL DEFAULT '[]';
