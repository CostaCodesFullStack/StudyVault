ALTER TABLE "Document" ADD COLUMN "unitId" TEXT;

CREATE INDEX "Document_unitId_idx" ON "Document"("unitId");

ALTER TABLE "Document"
ADD CONSTRAINT "Document_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "Unit"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
