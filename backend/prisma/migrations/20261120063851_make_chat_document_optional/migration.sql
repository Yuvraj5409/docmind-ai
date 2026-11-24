-- DropForeignKey
ALTER TABLE "chat" DROP CONSTRAINT "chat_documentId_fkey";

-- AlterTable
ALTER TABLE "chat" ALTER COLUMN "documentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
