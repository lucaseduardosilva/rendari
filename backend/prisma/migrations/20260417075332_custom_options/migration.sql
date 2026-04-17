-- CreateTable
CREATE TABLE "CustomOption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomOption_userId_scope_idx" ON "CustomOption"("userId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "CustomOption_userId_scope_value_key" ON "CustomOption"("userId", "scope", "value");

-- AddForeignKey
ALTER TABLE "CustomOption" ADD CONSTRAINT "CustomOption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
