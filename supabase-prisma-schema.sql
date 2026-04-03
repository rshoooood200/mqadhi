-- مقاضي - Prisma Schema for Supabase PostgreSQL
-- شغّل هذا الكود في SQL Editor في Supabase Dashboard

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "avatar" TEXT NOT NULL DEFAULT '👤',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "familyId" TEXT,
  "familyRole" TEXT NOT NULL DEFAULT 'member'
);

-- جدول العائلات
CREATE TABLE IF NOT EXISTS "Family" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "inviteCode" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- جدول دعوات العائلة
CREATE TABLE IF NOT EXISTS "FamilyInvitation" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "role" TEXT NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "familyId" TEXT NOT NULL,
  "invitedBy" TEXT NOT NULL,
  "invitedUserId" TEXT
);

-- جدول الجلسات
CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL
);

-- جدول الأغراض
CREATE TABLE IF NOT EXISTS "Item" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "notes" TEXT NOT NULL DEFAULT '',
  "isPurchased" BOOLEAN NOT NULL DEFAULT FALSE,
  "image" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL DEFAULT '',
  "userId" TEXT NOT NULL,
  "familyId" TEXT
);

-- جدول الأسعار
CREATE TABLE IF NOT EXISTS "Price" (
  "id" TEXT PRIMARY KEY,
  "store" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "itemId" TEXT NOT NULL
);

-- جدول أفراد العائلة
CREATE TABLE IF NOT EXISTS "FamilyMember" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "avatar" TEXT NOT NULL DEFAULT '👤',
  "userId" TEXT NOT NULL,
  "familyId" TEXT
);

-- جدول المتاجر المخصصة
CREATE TABLE IF NOT EXISTS "CustomStore" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "familyId" TEXT
);

-- جدول سجل الأسعار
CREATE TABLE IF NOT EXISTS "PriceHistoryRecord" (
  "id" TEXT PRIMARY KEY,
  "productName" TEXT NOT NULL,
  "store" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  "familyId" TEXT
);

-- جدول الميزانية
CREATE TABLE IF NOT EXISTS "Budget" (
  "id" TEXT PRIMARY KEY,
  "monthlyBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "spentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "shoppingTurn" TEXT,
  "userId" TEXT UNIQUE,
  "familyId" TEXT UNIQUE
);

-- جدول التصنيفات المخصصة
CREATE TABLE IF NOT EXISTS "CustomCategory" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "icon" TEXT NOT NULL DEFAULT '📦',
  "color" TEXT NOT NULL DEFAULT 'gray',
  "keywords" TEXT NOT NULL DEFAULT '',
  "userId" TEXT NOT NULL,
  "familyId" TEXT
);

-- جدول أسماء المنتجات المحفوظة
CREATE TABLE IF NOT EXISTS "SavedProductName" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- إضافة العلاقات (Foreign Keys)
ALTER TABLE "User" ADD CONSTRAINT "User_familyId_fkey" 
  FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FamilyInvitation" ADD CONSTRAINT "FamilyInvitation_familyId_fkey" 
  FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FamilyInvitation" ADD CONSTRAINT "FamilyInvitation_invitedBy_fkey" 
  FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FamilyInvitation" ADD CONSTRAINT "FamilyInvitation_invitedUserId_fkey" 
  FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Item" ADD CONSTRAINT "Item_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_familyId_fkey" 
  FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Price" ADD CONSTRAINT "Price_itemId_fkey" 
  FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyId_fkey" 
  FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomStore" ADD CONSTRAINT "CustomStore_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomStore" ADD CONSTRAINT "CustomStore_familyId_fkey" 
  FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PriceHistoryRecord" ADD CONSTRAINT "PriceHistoryRecord_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceHistoryRecord" ADD CONSTRAINT "PriceHistoryRecord_familyId_fkey" 
  FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_familyId_fkey" 
  FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomCategory" ADD CONSTRAINT "CustomCategory_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomCategory" ADD CONSTRAINT "CustomCategory_familyId_fkey" 
  FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedProductName" ADD CONSTRAINT "SavedProductName_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS "User_familyId_idx" ON "User"("familyId");
CREATE INDEX IF NOT EXISTS "FamilyInvitation_familyId_idx" ON "FamilyInvitation"("familyId");
CREATE INDEX IF NOT EXISTS "FamilyInvitation_code_idx" ON "FamilyInvitation"("code");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Item_userId_idx" ON "Item"("userId");
CREATE INDEX IF NOT EXISTS "Item_familyId_idx" ON "Item"("familyId");
CREATE INDEX IF NOT EXISTS "Price_itemId_idx" ON "Price"("itemId");
CREATE INDEX IF NOT EXISTS "FamilyMember_userId_idx" ON "FamilyMember"("userId");
CREATE INDEX IF NOT EXISTS "FamilyMember_familyId_idx" ON "FamilyMember"("familyId");
CREATE INDEX IF NOT EXISTS "CustomStore_userId_idx" ON "CustomStore"("userId");
CREATE INDEX IF NOT EXISTS "CustomStore_familyId_idx" ON "CustomStore"("familyId");
CREATE INDEX IF NOT EXISTS "PriceHistoryRecord_userId_productName_idx" ON "PriceHistoryRecord"("userId", "productName");
CREATE INDEX IF NOT EXISTS "PriceHistoryRecord_familyId_idx" ON "PriceHistoryRecord"("familyId");
CREATE INDEX IF NOT EXISTS "CustomCategory_userId_idx" ON "CustomCategory"("userId");
CREATE INDEX IF NOT EXISTS "CustomCategory_familyId_idx" ON "CustomCategory"("familyId");
CREATE INDEX IF NOT EXISTS "SavedProductName_userId_idx" ON "SavedProductName"("userId");

-- فريد لمنع تكرار أسماء المنتجات المحفوظة
CREATE UNIQUE INDEX IF NOT EXISTS "SavedProductName_userId_name_key" ON "SavedProductName"("userId", "name");
