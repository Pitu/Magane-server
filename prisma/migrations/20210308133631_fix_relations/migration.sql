/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[lineId]` on the table `packs`. If there are existing duplicate values, the migration will fail.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_stickers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "packId" INTEGER NOT NULL,
    "lineId" INTEGER NOT NULL,
    "file" TEXT,
    FOREIGN KEY ("packId") REFERENCES "packs" ("lineId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_stickers" ("id", "packId", "lineId", "file") SELECT "id", "packId", "lineId", "file" FROM "stickers";
DROP TABLE "stickers";
ALTER TABLE "new_stickers" RENAME TO "stickers";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "packs.lineId_unique" ON "packs"("lineId");
