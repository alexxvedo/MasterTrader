/*
  Warnings:

  - A unique constraint covering the columns `[magic]` on the table `EA` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountId` to the `EA` table without a default value. This is not possible if the table is not empty.
  - Added the required column `magic` to the `EA` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `EA` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "EA_name_key";

-- AlterTable
ALTER TABLE "EA" ADD COLUMN     "accountId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "magic" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EA_magic_key" ON "EA"("magic");

-- AddForeignKey
ALTER TABLE "EA" ADD CONSTRAINT "EA_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
