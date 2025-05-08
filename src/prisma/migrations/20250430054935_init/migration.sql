/*
  Warnings:

  - You are about to drop the column `created_time` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `updated_time` on the `activities` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "activities" DROP COLUMN "created_time",
DROP COLUMN "updated_time";
