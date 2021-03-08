-- CreateTable
CREATE TABLE "packs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lineId" TEXT,
    "name" TEXT,
    "animated" BOOLEAN,
    "count" INTEGER,
    "subscribed" INTEGER DEFAULT 0,
    "enabled" BOOLEAN DEFAULT true
);

-- CreateTable
CREATE TABLE "stickers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "packId" TEXT,
    "lineId" TEXT,
    "file" TEXT
);
