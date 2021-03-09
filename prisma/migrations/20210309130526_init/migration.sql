-- CreateTable
CREATE TABLE "packs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lineId" INTEGER,
    "name" TEXT,
    "animated" BOOLEAN,
    "count" INTEGER,
    "subscribed" INTEGER DEFAULT 0,
    "enabled" BOOLEAN DEFAULT true
);

-- CreateTable
CREATE TABLE "stickers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "packId" INTEGER NOT NULL,
    "lineId" INTEGER NOT NULL,
    "file" TEXT,
    FOREIGN KEY ("packId") REFERENCES "packs" ("lineId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "packs.lineId_unique" ON "packs"("lineId");
