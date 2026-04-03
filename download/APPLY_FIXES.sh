#!/bin/bash
# سكريبت لتطبيق كل التعديلات المهمة
# شغّل هذا الملف في كل مرة تُفتح فيها جلسة جديدة

echo "جاري تطبيق التعديلات..."

# 1. إنشاء مجلد suggestions/delete
mkdir -p src/app/api/suggestions/delete

# 2. إنشاء ملف route.ts للحذف
cat > src/app/api/suggestions/delete/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function getCurrentUser(request: NextRequest) {
  const sessionToken = request.cookies.get('session-token')?.value
  if (!sessionToken) return null
  const session = await prisma.session.findFirst({
    where: { id: sessionToken, expiresAt: { gt: new Date() } },
    include: { user: true }
  })
  return session?.user || null
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    const body = await request.json()
    const productName = body.productName
    if (!productName) return NextResponse.json({ error: 'اسم المنتج مطلوب' }, { status: 400 })
    
    const productNameLower = productName.toLowerCase().trim()
    let savedNamesDeleted = 0, priceHistoryDeleted = 0, itemsDeleted = 0

    try {
      const saved = await prisma.savedProductName.findMany({ where: { userId: user.id } })
      const ids = saved.filter(s => s.name.toLowerCase().trim() === productNameLower).map(s => s.id)
      if (ids.length > 0) {
        await prisma.savedProductName.deleteMany({ where: { id: { in: ids } } })
        savedNamesDeleted = ids.length
      }
    } catch {}

    try {
      const deleted = await prisma.priceHistoryRecord.deleteMany({
        where: { userId: user.id, productName: productNameLower }
      })
      priceHistoryDeleted = deleted.count
    } catch {}

    try {
      const items = await prisma.item.findMany({ where: { userId: user.id } })
      const ids = items.filter(i => i.name.toLowerCase().trim() === productNameLower).map(i => i.id)
      if (ids.length > 0) {
        const deleted = await prisma.item.deleteMany({ where: { id: { in: ids } } })
        itemsDeleted = deleted.count
      }
    } catch {}

    return NextResponse.json({ success: true, deleted: { savedNames: savedNamesDeleted, priceHistory: priceHistoryDeleted, items: itemsDeleted } })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الحذف' }, { status: 500 })
  }
}
EOF

# 3. إضافة SavedProductName model لقاعدة البيانات
if ! grep -q "model SavedProductName" prisma/schema.prisma; then
  # إضافة العلاقة في User
  sed -i 's/receivedInvitations FamilyInvitation\[\] @relation("ReceivedInvitations")/receivedInvitations FamilyInvitation[] @relation("ReceivedInvitations")\n  savedProductNames SavedProductName[]/' prisma/schema.prisma
  
  # إضافة Model
  cat >> prisma/schema.prisma << 'EOF'

model SavedProductName {
  id        String   @id @default(cuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([userId, name])
  @@index([userId])
}
EOF
fi

# 4. تعديل itemQuantity في page.tsx
sed -i "s/const \[itemQuantity, setItemQuantity\] = useState(1)/const [itemQuantity, setItemQuantity] = useState<number | ''>('')/" src/app/page.tsx
sed -i "s/setItemQuantity(1)/setItemQuantity('')/g" src/app/page.tsx
sed -i "s/quantity: itemQuantity,$/quantity: itemQuantity || 1,/g" src/app/page.tsx
sed -i "s/quantity: itemQuantity$/quantity: itemQuantity || 1/g" src/app/page.tsx

# 5. تحديث قاعدة البيانات
npx prisma generate
npx prisma db push

echo "✅ تم تطبيق جميع التعديلات!"
