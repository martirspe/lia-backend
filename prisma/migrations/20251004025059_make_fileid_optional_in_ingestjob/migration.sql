-- DropForeignKey
ALTER TABLE "public"."IngestJob" DROP CONSTRAINT "IngestJob_fileId_fkey";

-- AlterTable
ALTER TABLE "public"."IngestJob" ALTER COLUMN "fileId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."IngestJob" ADD CONSTRAINT "IngestJob_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
