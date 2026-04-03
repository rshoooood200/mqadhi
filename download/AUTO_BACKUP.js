/**
 * نظام النسخ الاحتياطي التلقائي
 * هذا الملفف يقوم بتصدير البيانات بشكل دوري
 * 
 * للتشغيل: node download/AUTO_BACKUP.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportAllData() {
  console.log('📤 جاري تصدير جميع البيانات...\n');
  
  try {
    const users = await prisma.user.findMany();
    const items = await prisma.item.findMany({ include: { prices: true } });
    const priceHistory = await prisma.priceHistoryRecord.findMany();
    const customStores = await prisma.customStore.findMany();
    const customCategories = await prisma.customCategory.findMany();
    const budget = await prisma.budget.findMany();
    const familyMembers = await prisma.familyMember.findMany();
    const sessions = await prisma.session.findMany();
    const savedProductNames = await prisma.savedProductName.findMany();
    
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      statistics: {
        users: users.length,
        items: items.length,
        priceHistory: priceHistory.length,
        customStores: customStores.length,
        customCategories: customCategories.length,
        familyMembers: familyMembers.length,
        sessions: sessions.length,
        savedProductNames: savedProductNames.length
      },
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        createdAt: u.createdAt
      })),
      items: items,
      priceHistory: priceHistory,
      customStores: customStores,
      customCategories: customCategories,
      budget: budget,
      familyMembers: familyMembers,
      savedProductNames: savedProductNames
    };
    
    // حفظ في ملف JSON
    const backupDir = path.join(__dirname, 'database_backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const filename = path.join(backupDir, `full_backup_${Date.now()}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    
    console.log('✅ تم تصدير البيانات بنجاح!');
    console.log(`📁 الملف: ${filename}`);
    console.log('\n📊 الإحصائيات:');
    console.log(`   - المستخدمين: ${users.length}`);
    console.log(`   - الأغراض: ${items.length}`);
    console.log(`   - سجل الأسعار: ${priceHistory.length}`);
    console.log(`   - المتاجر: ${customStores.length}`);
    console.log(`   - الجلسات النشطة: ${sessions.length}`);
    
    return data;
  } catch (error) {
    console.error('❌ خطأ في التصدير:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل التصدير
exportAllData();
