-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('HEAD', 'SPOUSE', 'CHILD', 'PARENT', 'RELATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "BlotterStatus" AS ENUM ('FILED', 'MEDIATION_SCHEDULED', 'SETTLED', 'DISMISSED', 'ESCALATED_TO_PNP');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('NEIGHBOR_DISPUTE', 'NOISE_COMPLAINT', 'PHYSICAL_INJURY', 'PROPERTY_DAMAGE', 'THEFT', 'THREATS', 'DOMESTIC', 'OTHER');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "household_id" TEXT,
ADD COLUMN     "is_4ps_beneficiary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_pwd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_senior" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_solo_parent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "relationship_to_head" "HouseholdRole";

-- CreateTable
CREATE TABLE "household" (
    "id" TEXT NOT NULL,
    "household_number" TEXT NOT NULL,
    "purok" "Purok" NOT NULL,
    "street_address" TEXT NOT NULL,
    "head_id" TEXT,
    "is_4ps" BOOLEAN NOT NULL DEFAULT false,
    "is_indigent" BOOLEAN NOT NULL DEFAULT false,
    "has_senior" BOOLEAN NOT NULL DEFAULT false,
    "has_pwd" BOOLEAN NOT NULL DEFAULT false,
    "has_solo_parent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blotter_record" (
    "id" TEXT NOT NULL,
    "case_number" TEXT NOT NULL,
    "incident_type" "IncidentType" NOT NULL,
    "incident_date" TIMESTAMP(3) NOT NULL,
    "incident_location" TEXT NOT NULL,
    "complainant_id" TEXT,
    "complainant_name" TEXT NOT NULL,
    "complainant_contact" TEXT,
    "respondent_name" TEXT NOT NULL,
    "respondent_address" TEXT,
    "narrative" TEXT NOT NULL,
    "status" "BlotterStatus" NOT NULL DEFAULT 'FILED',
    "hearing_date" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "officer_in_charge_id" TEXT,
    "is_confidential" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blotter_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "household_household_number_key" ON "household"("household_number");

-- CreateIndex
CREATE UNIQUE INDEX "household_head_id_key" ON "household"("head_id");

-- CreateIndex
CREATE INDEX "household_purok_idx" ON "household"("purok");

-- CreateIndex
CREATE UNIQUE INDEX "blotter_record_case_number_key" ON "blotter_record"("case_number");

-- CreateIndex
CREATE INDEX "blotter_record_status_idx" ON "blotter_record"("status");

-- CreateIndex
CREATE INDEX "blotter_record_incident_type_idx" ON "blotter_record"("incident_type");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household" ADD CONSTRAINT "household_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blotter_record" ADD CONSTRAINT "blotter_record_complainant_id_fkey" FOREIGN KEY ("complainant_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blotter_record" ADD CONSTRAINT "blotter_record_officer_in_charge_id_fkey" FOREIGN KEY ("officer_in_charge_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
