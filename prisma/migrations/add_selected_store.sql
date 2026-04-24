-- إضافة عمود selectedStore لجدول Item
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "selectedStore" TEXT;
