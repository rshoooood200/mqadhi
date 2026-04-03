const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
  console.log('📤 جاري تصدير البيانات...\n');
  
  try {
    // جلب جميع البيانات
    const users = await prisma.user.findMany();
    const items = await prisma.item.findMany({ include: { prices: true } });
    const priceHistory = await prisma.priceHistoryRecord.findMany();
    const customStores = await prisma.customStore.findMany();
    const customCategories = await prisma.customCategory.findMany();
    const budget = await prisma.budget.findMany();
    const familyMembers = await prisma.familyMember.findMany();
    const savedProductNames = await prisma.savedProductName.findMany();
    
    const data = {
      exportDate: new Date().toISOString(),
      users,
      items,
      priceHistory,
      customStores,
      customCategories,
      budget,
      familyMembers,
      savedProductNames
    };
    
    // حفظ في ملف JSON
    const filename = path.join(__dirname, 'database_backups', `data_${Date.now()}.json`);
    require('fs').mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    
    console.log('✅ تم تصدير البيانات بنجاح!');
    console.log(`📁 الملف: ${filename}`);
    console.log(`📊 الإحصائيات:`);
    console.log(`   - المستخدمين: ${users.length}`);
    console.log(`   - الأغراض: ${items.length}`);
    console.log(`   - سجل الأسعار: ${priceHistory.length}`);
    console.log(`   - المتاجر: ${customStores.length}`);
    console.log(`   - التصنيفات: ${customCategories.length}`);
    console.log(`   - أسماء المنتجات المحفوظة: ${savedProductNames.length}`);
    
  } catch (error) {
    console.error('❌ خطأ في التصدير:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
