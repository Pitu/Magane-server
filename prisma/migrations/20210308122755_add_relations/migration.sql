/*
  Warnings:

  - You are about to alter the column `lineId` on the `packs` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `packId` on the `stickers` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `lineId` on the `stickers` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Made the column `packId` on table `stickers` required. The migration will fail if there are existing NULL values in that column.
  - Made the column `lineId` on table `stickers` required. The migration will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_packs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lineId" INTEGER,
    "name" TEXT,
    "animated" BOOLEAN,
    "count" INTEGER,
    "subscribed" INTEGER DEFAULT 0,
    "enabled" BOOLEAN DEFAULT true
);
INSERT INTO "new_packs" ("id", "lineId", "name", "animated", "count", "subscribed", "enabled") SELECT "id", "lineId", "name", "animated", "count", "subscribed", "enabled" FROM "packs";
DROP TABLE "packs";
ALTER TABLE "new_packs" RENAME TO "packs";
CREATE TABLE "new_stickers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "packId" INTEGER NOT NULL,
    "lineId" INTEGER NOT NULL,
    "file" TEXT,
    FOREIGN KEY ("packId") REFERENCES "packs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_stickers" ("id", "packId", "lineId", "file") SELECT "id", "packId", "lineId", "file" FROM "stickers";
DROP TABLE "stickers";
ALTER TABLE "new_stickers" RENAME TO "stickers";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
