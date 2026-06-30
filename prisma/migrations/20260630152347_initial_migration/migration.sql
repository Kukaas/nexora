-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'CLAIMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AnnouncementCategory" AS ENUM ('ADVISORY', 'HEALTH', 'EVENTS', 'ASSISTANCE', 'GOVERNANCE');

-- CreateEnum
CREATE TYPE "UserRoles" AS ENUM ('ADMIN', 'CAPTAIN', 'SECRETARY', 'TREASURER', 'KAGAWAD', 'RESIDENT');

-- CreateEnum
CREATE TYPE "IDType" AS ENUM ('DRIVER_LICENSE', 'PASSPORT', 'SSS', 'GSIS', 'PRC', 'OTHERS');

-- CreateEnum
CREATE TYPE "IDStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('GCASH', 'MAYA', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "first_name" TEXT,
    "middle_name" TEXT,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "birth_date" TIMESTAMP(3),
    "mobile_number" TEXT,
    "profile_completed_at" TIMESTAMP(3),
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "roles" "UserRoles"[] DEFAULT ARRAY['RESIDENT']::"UserRoles"[],

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "scope" TEXT,
    "password" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "id" (
    "id" TEXT NOT NULL,
    "type" "IDType" NOT NULL,
    "number" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "status" "IDStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "id_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method" (
    "id" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "account_name" TEXT,
    "account_number" TEXT,
    "qr_image" TEXT,
    "instructions" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethodType" NOT NULL,
    "reference_number" TEXT,
    "proof_image" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "review_note" TEXT,
    "payer_id" TEXT NOT NULL,
    "payer_name" TEXT NOT NULL,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fee" DECIMAL(10,2) NOT NULL,
    "turnaround_days" INTEGER NOT NULL DEFAULT 2,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "fields" JSONB NOT NULL DEFAULT '[]',
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
    "field_values" JSONB NOT NULL DEFAULT '[]',
    "purpose" TEXT,
    "method" "PaymentMethodType" NOT NULL,
    "payment_reference" TEXT,
    "proof_image" TEXT,
    "or_number" TEXT,
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "resubmit_note" TEXT,
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
    "date" TIMESTAMP(3),
    "author_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "id_user_id_idx" ON "id"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "id_type_number_key" ON "id"("type", "number");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_type_key" ON "payment_method"("type");

-- CreateIndex
CREATE INDEX "payment_status_idx" ON "payment"("status");

-- CreateIndex
CREATE INDEX "payment_payer_id_idx" ON "payment"("payer_id");

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
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id" ADD CONSTRAINT "id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
