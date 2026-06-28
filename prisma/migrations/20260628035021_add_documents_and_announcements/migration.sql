-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'REJECTED');

-- CreateEnum
CREATE TYPE "AnnouncementCategory" AS ENUM ('ADVISORY', 'HEALTH', 'EVENTS', 'ASSISTANCE', 'GOVERNANCE');

-- CreateTable
CREATE TABLE "document_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fee" DECIMAL(10,2) NOT NULL,
    "turnaround_days" INTEGER NOT NULL DEFAULT 2,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_request" (
    "id" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "document_type_id" TEXT,
    "document_name" TEXT NOT NULL,
    "fee" DECIMAL(10,2) NOT NULL,
    "purpose" TEXT,
    "method" "PaymentMethodType" NOT NULL,
    "payment_reference" TEXT,
    "proof_image" TEXT,
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "requester_id" TEXT NOT NULL,
    "requester_name" TEXT NOT NULL,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "AnnouncementCategory" NOT NULL DEFAULT 'ADVISORY',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "place" TEXT,
    "author_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_type_name_key" ON "document_type"("name");

-- CreateIndex
CREATE INDEX "document_request_status_idx" ON "document_request"("status");

-- CreateIndex
CREATE INDEX "document_request_requester_id_idx" ON "document_request"("requester_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_request_reference_number_key" ON "document_request"("reference_number");

-- CreateIndex
CREATE INDEX "announcement_published_pinned_idx" ON "announcement"("published", "pinned");

-- AddForeignKey
ALTER TABLE "document_type" ADD CONSTRAINT "document_type_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_request" ADD CONSTRAINT "document_request_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_request" ADD CONSTRAINT "document_request_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_request" ADD CONSTRAINT "document_request_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
