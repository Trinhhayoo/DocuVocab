-- AlterTable
ALTER TABLE "Vocabulary" ADD COLUMN     "pageTitle" TEXT,
ADD COLUMN     "sourceHostname" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "Vocabulary_sourceUrl_idx" ON "Vocabulary"("sourceUrl");

-- CreateIndex
CREATE INDEX "Vocabulary_sourceHostname_idx" ON "Vocabulary"("sourceHostname");
