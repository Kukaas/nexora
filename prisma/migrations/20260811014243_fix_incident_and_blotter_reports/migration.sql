-- AlterTable
ALTER TABLE "blotter_record" ADD COLUMN     "attachment_url" TEXT;

-- CreateTable
CREATE TABLE "incident_report" (
    "id" TEXT NOT NULL,
    "report_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "incident_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attachment_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "admin_notes" TEXT,
    "reporter_id" TEXT,
    "reporter_name" TEXT NOT NULL,
    "reporter_contact" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incident_report_report_number_key" ON "incident_report"("report_number");

-- CreateIndex
CREATE INDEX "incident_report_status_idx" ON "incident_report"("status");

-- CreateIndex
CREATE INDEX "incident_report_category_idx" ON "incident_report"("category");

-- AddForeignKey
ALTER TABLE "incident_report" ADD CONSTRAINT "incident_report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
