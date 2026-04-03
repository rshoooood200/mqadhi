import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';

// الحصول على المستخدم الحالي
async function getCurrentUser(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) return null

    const session = await prisma.session.findFirst({
      where: {
        id: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    })

    return session?.user || null
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

// التصنيفات الافتراضية
const CATEGORIES = [
  { id: 'dairy', name: 'ألبان', keywords: ['حليب', 'لبن', 'جبن', 'زبادي', 'روب', 'قشطة', 'زبدة', 'كيري', 'لاكتوز', 'milk', 'جبنة'] },
  { id: 'meat', name: 'لحوم', keywords: ['لحم', 'لحمة', 'بقر', 'خروف', 'كباب', 'كفتة', 'مفروم', 'ستيك', 'لحمه'] },
  { id: 'poultry', name: 'دواجن', keywords: ['دجاج', 'فراخ', 'فرخ', 'فروج', 'ديك', 'رومي', 'بط', 'وز', 'صدور', 'فخذ'] },
  { id: 'seafood', name: 'أسماك', keywords: ['سمك', 'ربيان', 'روبيان', 'جمبري', 'تونة', 'سالمون', 'سردين'] },
  { id: 'bakery', name: 'مخبوزات', keywords: ['خبز', 'صمون', 'كرواسون', 'توست', 'فينو', 'كعك', 'فطير', 'كرواسان'] },
  { id: 'vegetables', name: 'خضار', keywords: ['طماطم', 'بصل', 'ثوم', 'بطاطس', 'جزر', 'خيار', 'فلفل', 'خس', 'باذنجان', 'كوسا', 'بطاطا', 'بطاط'] },
  { id: 'fruits', name: 'فواكه', keywords: ['تفاح', 'موز', 'برتقال', 'ليمون', 'عنب', 'رمان', 'فراولة', 'مانجو', 'كيوي', 'تمر'] },
  { id: 'frozen', name: 'مجمدات', keywords: ['مجمد', 'مثلج', 'آيس كريم', 'فريزر', 'سمبوسة', 'ايس كريم'] },
  { id: 'legumes', name: 'بقوليات', keywords: ['فول', 'عدس', 'حمص', 'فاصوليا', 'لوبيا', 'بازلاء'] },
  { id: 'spices', name: 'توابل وبهارات', keywords: ['توابل', 'بهارات', 'ملح', 'سكر', 'فلفل', 'كركم', 'قرفة', 'زعفران', 'هيل', 'كمون', 'خل'] },
  { id: 'sweets', name: 'حلويات', keywords: ['حلويات', 'شوكولاتة', 'كيك', 'بسكويت', 'حلاوة', 'كنافة', 'بقلاوة', 'نوتيلا', 'شوكولاته'] },
  { id: 'drinks', name: 'مشروبات', keywords: ['مشروب', 'عصير', 'ماء', 'بيبسي', 'كولا', 'شاي', 'قهوة', 'نسكافيه'] },
  { id: 'snacks', name: 'سناكس', keywords: ['سناكس', 'شيبس', 'مكسرات', 'فشار', 'بوب كورن', 'شيبسي'] },
  { id: 'cleaning', name: 'منظفات', keywords: ['منظف', 'صابون', 'مسحوق', 'كلور', 'مطهر', 'ديتول', 'فيري', 'برسيل', 'تايد'] },
  { id: 'personal', name: 'عناية شخصية', keywords: ['شامبو', 'كريم', 'لوشن', 'معجون', 'فرشاة', 'مزيل', 'حفاضات', 'بامبرز'] },
  { id: 'kitchen', name: 'مطبخ وأدوات', keywords: ['قدر', 'مقلاة', 'طقم', 'صحن', 'كوب', 'ملعقة', 'سكين'] },
  { id: 'other', name: 'أخرى', keywords: [] }
];

// تصنيف المنتج
function classifyProduct(productName: string): string {
  const nameLower = productName.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(keyword => nameLower.includes(keyword.toLowerCase()))) {
      return cat.id;
    }
  }
  return 'other';
}

// دالة لاستخراج JSON من النص
function extractJSON(text: string): any {
  // البحث عن أول { وآخر }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || firstBrace > lastBrace) {
    return null;
  }
  
  const jsonStr = text.substring(firstBrace, lastBrace + 1);
  
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('=== Scan Receipt API Called ===')
  
  try {
    // التحقق من المستخدم
    const user = await getCurrentUser(request);
    console.log('User:', user ? user.email : 'Not logged in')
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'يجب تسجيل الدخول أولاً' 
      }, { status: 401 });
    }

    // قراءة البيانات
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body')
      return NextResponse.json({ 
        success: false,
        error: 'فشل في قراءة البيانات المرسلة' 
      }, { status: 400 });
    }
    
    const imageBase64 = body.image || body.imageBase64;

    if (!imageBase64) {
      return NextResponse.json({ 
        success: false,
        error: 'الصورة مطلوبة' 
      }, { status: 400 });
    }

    // تجهيز رابط الصورة
    let imageUrl: string;
    if (imageBase64.startsWith('data:')) {
      imageUrl = imageBase64;
    } else {
      imageUrl = `data:image/jpeg;base64,${imageBase64}`;
    }
    
    console.log('Image size:', imageUrl.length, 'characters')

    // تهيئة SDK
    console.log('Initializing ZAI SDK...')
    const zai = await ZAI.create();
    console.log('ZAI SDK initialized')

    // تحليل الصورة
    console.log('Calling Vision API...')
    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `أنت خبير في قراءة وتحليل فواتير السوبرماركت والمتاجر.

مهمتك:
1. اقرأ الفاتورة بعناية
2. استخرج كل منتج مذكور في الفاتورة
3. لكل منتج حدد:
   - اسم المنتج بالضبط كما هو مكتوب
   - السعر (رقم فقط)
   - الكمية (إذا لم تكن مذكورة افترض أنها 1)

أرجع النتيجة بهذا التنسيق JSON فقط بدون أي كلام إضافي:
{
  "store": "اسم المتجر",
  "date": "التاريخ",
  "items": [
    {
      "name": "اسم المنتج",
      "price": 15.50,
      "quantity": 1
    }
  ],
  "total": 150.00
}

حلل هذه الفاتورة:`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    });

    const responseText = completion.choices[0]?.message?.content || '';
    console.log('AI Response length:', responseText.length)
    console.log('AI Response preview:', responseText.substring(0, 500))
    
    // استخراج JSON من الرد
    const receiptData = extractJSON(responseText);
    
    if (!receiptData) {
      console.error('No valid JSON found in response')
      return NextResponse.json({ 
        success: false,
        error: 'لم نتمكن من قراءة الفاتورة. جرب صورة أوضح.',
        rawResponse: responseText.substring(0, 1000)
      }, { status: 400 });
    }

    // التحقق من وجود المنتجات
    if (!receiptData.items || !Array.isArray(receiptData.items) || receiptData.items.length === 0) {
      console.error('No items found in receipt')
      return NextResponse.json({ 
        success: false,
        error: 'لم نجد منتجات في الفاتورة. تأكد من وضوح الصورة.',
        rawResponse: responseText.substring(0, 1000)
      }, { status: 400 });
    }

    // تصنيف وتنظيف المنتجات
    const itemsWithCategory = receiptData.items
      .filter((item: any) => item && item.name && String(item.name).trim() !== '')
      .map((item: any) => ({
        name: String(item.name || '').trim(),
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        category: classifyProduct(String(item.name || ''))
      }));

    if (itemsWithCategory.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'لم نتمكن من استخراج منتجات صالحة من الفاتورة.',
        rawResponse: responseText.substring(0, 1000)
      }, { status: 400 });
    }

    console.log('Found', itemsWithCategory.length, 'items')

    return NextResponse.json({
      success: true,
      store: receiptData.store || '',
      date: receiptData.date || '',
      items: itemsWithCategory,
      total: Number(receiptData.total) || 0
    });

  } catch (error: any) {
    console.error('=== Receipt scan error ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    
    return NextResponse.json({ 
      success: false,
      error: 'حدث خطأ في تحليل الفاتورة: ' + (error.message || 'خطأ غير معروف')
    }, { status: 500 });
  }
}
