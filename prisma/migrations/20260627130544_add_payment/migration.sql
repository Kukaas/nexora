-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('GCASH', 'MAYA', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

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

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_type_key" ON "payment_method"("type");

-- CreateIndex
CREATE INDEX "payment_status_idx" ON "payment"("status");

-- CreateIndex
CREATE INDEX "payment_payer_id_idx" ON "payment"("payer_id");

-- AddForeignKey
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
