'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { APP_VERSION } from '@/lib/version'

// تعريف أنواع البيانات
interface PriceEntry {
  store: string
  price: number
  date: string
}

interface Item {
  id: string
  name: string
  category: string
  quantity: number
  notes: string
  isPurchased: boolean
  image: string | null
  prices: PriceEntry[]
  selectedStore?: string // المتجر المختار للسعر النشط
  createdAt: string
  order?: number
}

interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  familyRole?: string
}

interface CustomCategory {
  id: string
  name: string
  icon: string
  color: string
  keywords: string[]
}

interface Family {
  id: string
  name: string
  inviteCode: string
  members: UserProfile[]
}

interface ScannedItem {
  name: string
  price: number
  quantity: number
  category: string
}

interface DragItem {
  id: string
  index: number
}

// تعريف التصنيفات المفصلة مع الألوان والأيقونات
const categories = [
  { id: 'dairy', name: 'ألبان', icon: '🥛', color: 'bg-sky-500', lightColor: 'bg-sky-100', textColor: 'text-sky-700', borderColor: 'border-sky-200' },
  { id: 'meat', name: 'لحوم', icon: '🥩', color: 'bg-red-600', lightColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-200' },
  { id: 'poultry', name: 'دواجن', icon: '🍗', color: 'bg-orange-500', lightColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
  { id: 'seafood', name: 'أسماك', icon: '🐟', color: 'bg-cyan-600', lightColor: 'bg-cyan-100', textColor: 'text-cyan-700', borderColor: 'border-cyan-200' },
  { id: 'bakery', name: 'مخبوزات', icon: '🥖', color: 'bg-amber-600', lightColor: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  { id: 'vegetables', name: 'خضار', icon: '🥬', color: 'bg-green-600', lightColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-200' },
  { id: 'fruits', name: 'فواكه', icon: '🍎', color: 'bg-rose-500', lightColor: 'bg-rose-100', textColor: 'text-rose-700', borderColor: 'border-rose-200' },
  { id: 'frozen', name: 'مجمدات', icon: '🧊', color: 'bg-indigo-500', lightColor: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' },
  { id: 'legumes', name: 'بقوليات', icon: '🫘', color: 'bg-stone-500', lightColor: 'bg-stone-100', textColor: 'text-stone-700', borderColor: 'border-stone-200' },
  { id: 'spices', name: 'توابل وبهارات', icon: '🧂', color: 'bg-yellow-600', lightColor: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  { id: 'sweets', name: 'حلويات', icon: '🍫', color: 'bg-pink-500', lightColor: 'bg-pink-100', textColor: 'text-pink-700', borderColor: 'border-pink-200' },
  { id: 'drinks', name: 'مشروبات', icon: '🥤', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  { id: 'snacks', name: 'سناكس', icon: '🍿', color: 'bg-violet-500', lightColor: 'bg-violet-100', textColor: 'text-violet-700', borderColor: 'border-violet-200' },
  { id: 'cleaning', name: 'منظفات', icon: '🧹', color: 'bg-emerald-500', lightColor: 'bg-emerald-100', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
  { id: 'personal', name: 'عناية شخصية', icon: '🧴', color: 'bg-fuchsia-500', lightColor: 'bg-fuchsia-100', textColor: 'text-fuchsia-700', borderColor: 'border-fuchsia-200' },
  { id: 'kitchen', name: 'مطبخ وأدوات', icon: '🍳', color: 'bg-slate-500', lightColor: 'bg-slate-100', textColor: 'text-slate-700', borderColor: 'border-slate-200' },
  { id: 'other', name: 'أخرى', icon: '📦', color: 'bg-gray-500', lightColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-200' },
]

// كلمات مفتاحية للتصنيف التلقائي (محسّن)
const categoryKeywords: Record<string, string[]> = {
  dairy: [
    'حليب', 'لبن', 'جبن', 'زبادي', 'روب', 'قشطة', 'زبدة', 'كيري', 'لاكتوز', 'milk',
    'جبنة', 'جبنه', 'اللبن', 'الحليب', 'كاسات', 'كاسة', 'علبة حليب', 'طازج', 'مبستر',
    'كريمه', 'كريمة', 'شيرة', 'موري', 'نيدو', 'ابو قوس', 'العلايلة', 'صافي', 'مراعي',
    'اليمامة', 'نادك', 'العزيزية', 'فييتا', 'دريم ويب', 'شيسلودر', 'بقر', 'حليب سائل',
    'حليب بودرة', 'حليب مكثف', 'مثلثات', 'كرفس', 'لايك', 'دايزي', 'بيف', 'تشنج',
    'لبنه', 'لبنة', 'جميد', 'جبن حلوم', 'جبنة بيضاء', 'جبن شيدر', 'جبن موزاريلا',
    'جبن كرافت', 'جبنة كرافت', 'بارميجان', 'ريكوتا', 'حليب جوز', 'حليب لوز',
    'فييتا', 'بوك', 'لافاش', 'كشكوان', 'جبنة سائلة', 'سائل جبن', 'دوق',
    'مرتاديلا جبن', 'مثلث', 'كاسات لبن', 'زبادي فواكه', 'زبادي بالفواكه',
    'علكة', 'علك', 'شيك', 'ميلك شيك', 'كسترد', 'كريم كراميل'
  ],
  meat: [
    'لحم', 'لحمة', 'لحمه', 'بقر', 'خروف', 'كباب', 'كفتة', 'مفروم', 'ستيك', 'لحمه',
    'لحم بقر', 'لحم غنم', 'لحم عجل', 'لحم صافي', 'لحم مفروم', 'عجل', 'موزات',
    'ريش', 'فخذ', 'ظهر', 'رقبة', 'كبد', 'كلاوي', 'قلب', 'طحال', 'رئة', 'كرشة',
    'لحمية', 'لحمه مفرومه', 'لحمه بعجين', 'عربي', 'هبرة', 'شقف', 'شرائح', 'لانشون',
    'مرتديلا', 'بسطرمة', 'سجق', 'نقانق', 'همبرجر', 'برجر', 'كفتة لحم', 'كباب لحم',
    'لحوم', 'لحوم مجمدة', 'لحم ابيض', 'لحم احمر'
  ],
  poultry: [
    'دجاج', 'فراخ', 'فرخ', 'فروج', 'ديك', 'رومي', 'بط', 'وز', 'صدور', 'فخذ',
    'دجاجة', 'دجاجه', 'صدور دجاج', 'فخذ دجاج', 'أفخاذ', 'صدورة', 'كبد دجاج',
    'قلوب', 'أجنحة', 'اجنحة', 'رقاب', 'كراعين', 'مفروم دجاج', 'كفتة دجاج',
    'نقانق دجاج', 'سجق دجاج', 'برجر دجاج', 'همبرجر دجاج', 'شاورما دجاج',
    'دجاج حي', 'دجاج مذبوح', 'دجاج مجمد', 'دجاج طازج', 'فرخة', 'فرخه',
    'ديك رومي', 'رومي مدخن', 'بط مشوي', 'وز بلدي', 'سمينة'
  ],
  seafood: [
    'سمك', 'ربيان', 'روبيان', 'جمبري', 'تونة', 'سالمون', 'سردين', 'سلمون',
    'سمكة', 'سمكه', 'سمك طازج', 'سمك مجمد', 'سمك مشوي', 'سمك مقلي',
    'هامور', 'نخالة', 'شعور', 'صبور', 'بياض', 'كنعد', 'حمرا', 'صفية',
    'روبيان كبير', 'روبيان صغير', 'روبيان مقشر', 'جمبري كبير', 'جمبري مقشر',
    'تونة معلبة', 'تونه', 'سردين معلب', 'ماكريل', 'أنشوجة', 'سلمون مدخن',
    'كافيار', 'حبار', 'حباري', 'سبيط', 'أخطبوط', 'محار', 'بلح البحر',
    'كركند', 'استاكوزا', 'جمبري ملكي', 'روبيان هندي', 'سمك فيليه'
  ],
  bakery: [
    'خبز', 'صمون', 'كرواسون', 'توست', 'فينو', 'كعك', 'فطير', 'كرواسان',
    'خبز صامولي', 'صامولي', 'خبز عربي', 'خبز تورتيلا', 'تورتيلا', 'خبز فرنسي',
    'خبز أسمر', 'خبز بر', 'خبز نخالة', 'خبز شعير', 'خبز أبيض', 'كيزر',
    'خبز هامبرجر', 'خبز هوت دوج', 'خبز برجر', 'كرواسون شوكولاتة', 'كرواسون جبن',
    'خبز فينو', 'خبز ملفوف', 'معجنات', 'فطائر', 'مناقيش', 'مناقش', 'فطيرة',
    'كعك بالتمر', 'كعك مالح', 'بقسماط', 'فتوت', 'خبز محمص', 'بسكوت',
    'كركم', 'خبز لبناني', 'خبز سوري', 'خبز تركي', 'خبز هندي'
  ],
  vegetables: [
    'طماطم', 'بصل', 'ثوم', 'بطاطس', 'جزر', 'خيار', 'فلفل', 'خس', 'باذنجان', 'كوسا',
    'بطاطا', 'بطاط', 'طماطة', 'بندورة', 'بصل اخضر', 'بصل أحمر', 'بصل أبيض',
    'ثوم مفروم', 'ثوم مدقوق', 'بطاطس حلوة', 'بطاطا حلوة', 'جزر مبشور',
    'خيار مقشر', 'فلفل أخضر', 'فلفل أحمر', 'فلفل أصفر', 'فلفل حار', 'فلفل حلو',
    'شطة', 'فلفل أسود', 'خس امريكي', 'خس رومي', 'جرجير', 'سبانخ', 'ملوخية',
    'بقدونس', 'كزبرة', 'نعناع', 'شبت', 'كراث', 'كراث', 'فجل', 'لفت', 'شمندر',
    'كرفس', 'قرع', 'يقطين', 'لوبيا خضراء', 'فاصوليا خضراء', 'بازلاء',
    'ذرة', 'ذرة حلوة', 'فطر', 'مشروم', 'كابوتشا', 'خضار مشكلة', 'خضار مجمدة',
    'زنجبيل', 'كركديه', 'ورق عنب', 'مخلل', 'كabbage', 'كرنب', 'ملفوف',
    'بطاط', 'جزر', 'خيار', 'كوسا', 'باذنجان', 'فلفل', 'بصل', 'ثوم', 'طماطم',
    'خضروات', 'خضراوات', 'خضر', 'ورقيات', 'خضار ورقية', 'بقدونس', 'كزبرة خضراء',
    'شبت', 'نعناع أخضر', 'ريحان أخضر', 'جرجير', 'رخام', 'سبانخ', 'ملوخية خضراء'
  ],
  fruits: [
    'تفاح', 'موز', 'برتقال', 'ليمون', 'عنب', 'رمان', 'فراولة', 'مانجو', 'كيوي', 'تمر',
    'تفاحة', 'موزة', 'برتقالة', 'ليمونة', 'عنبة', 'فراوله', 'مانجوا', 'تمور',
    'تفاح أخضر', 'تفاح أحمر', 'تفاح أصفر', 'موز مستورد', 'موز بلدي',
    'برتقال أبو سرة', 'برتقال سكري', 'يوسفي', 'كليمنتينا', 'ليمون أخضر',
    'ليمون أصفر', 'جريب فروت', 'أناناس', 'بطيخ', 'شمام', 'كانتلوب',
    'خوخ', 'مشمش', 'برقوق', 'نكتارين', 'خوخ', 'تين', 'تين شوكي',
    'بطيخ', 'جوافة', 'باباظ', 'بابايا', 'أفوكادو', 'توت', 'توت بري',
    'توت فرندي', 'كاكي', 'رقي', 'بلح', 'بلح أحمر', 'تمر هندي', 'زبيب',
    'مشمشية', 'قشطة', 'فواكه مجففة', 'فواكه معلبة', 'عصير', 'فواكه مشكلة',
    'فاكهة', 'فواكه', 'فركت', 'فراولة', 'اناناس', 'كيوي', 'تين',
    'تمر', 'رطب', 'بلح', 'عنب', 'توت', 'فراولة', 'كرز', 'مشمش', 'خوخ'
  ],
  frozen: [
    'مجمد', 'مثلج', 'آيس كريم', 'فريزر', 'سمبوسة', 'ايس كريم', 'مجمدات',
    'آيسكريم', 'ايسكريم', 'جليد', 'ثلج', 'مكعبات ثلج', 'كريمة مثلجة',
    'خضار مجمدة', 'فاصوليا مجمدة', 'بازلاء مجمدة', 'ذرة مجمدة',
    'سمبوسا', 'سمبوسك', 'فطائر مجمدة', 'معجنات مجمدة', 'كرواسون مجمد',
    'سمك مجمد', 'روبيان مجمد', 'جمبري مجمد', 'دجاج مجمد', 'لحم مجمد',
    'بطاطس مجمدة', 'بطاطس مقلية', 'فرنش فرايز', 'fris',
    'حلويات مجمدة', 'تشيز كيك', 'كيك مجمد', 'جاتوه', 'كب كيك',
    'بوظة', 'سوربيه', 'فاكهة مجمدة', 'توت مجمد', 'فراولة مجمدة'
  ],
  legumes: [
    'فول', 'عدس', 'حمص', 'فاصوليا', 'لوبيا', 'بازلاء', 'بقوليات', 'فول مدمس',
    'فول أخضر', 'فول نابت', 'عدس أحمر', 'عدس أصفر', 'عدس بني', 'مجدرة',
    'حمص معلب', 'حمص حب', 'حمص طحينية', 'فاصوليا بيضاء', 'فاصوليا حمراء',
    'فاصوليا سوداء', 'لوبيا بيضاء', 'لوبيا حمراء', 'بازلاء جافة',
    'فول سوداني', 'فستق', 'لوز', 'جوز', 'بندق', 'كاجو', 'عين جمل',
    'حمصية', 'طحينية', 'راشي', 'سمسم', 'كتان', 'شيا', 'quinoa', 'كينوا'
  ],
  spices: [
    'توابل', 'بهارات', 'ملح', 'سكر', 'فلفل', 'كركم', 'قرفة', 'زعفران', 'هيل', 'كمون', 'خل',
    'بهار', 'توابل مشكلة', 'كاري', 'فلفل أسود', 'فلفل أبيض', 'فلفل أحمر',
    'شطة حمراء', 'شطة خضراء', 'فلفل حار', 'فلفل سيتشوان', 'بابريكا',
    'كزبرة ناشفة', 'كمون مطحون', 'كركم مطحون', 'قرفة مطحونة', 'زنجبيل مطحون',
    'زنجبيل طازج', 'ثوم مطحون', 'بصل مطحون', 'ملح طعام', 'ملح خشن',
    'ملح صخري', 'ملح بحري', 'سكر أبيض', 'سكر بني', 'سكر ناعم',
    'سكر بودرة', 'عسل', 'دبس', 'دبس رمان', 'خل أبيض', 'خل تفاح',
    'خل بلسمك', 'مستردة', 'مايونيز', 'كاتشب', 'صلصة', 'صوص',
    'نعناع ناشف', 'ريحان', 'زعتر', 'اوريجانو', 'روز ماري', 'زيت زيتون',
    'زيت ذرة', 'زيت عباد الشمس', 'سمن', 'سمنة', 'زيت'
  ],
  sweets: [
    'حلويات', 'شوكولاتة', 'كيك', 'بسكويت', 'حلاوة', 'كنافة', 'بقلاوة', 'نوتيلا', 'شوكولاته',
    'شوكولاتا', 'شوكليت', 'كاكاو', 'شوكو', 'تشفلي', 'فيرر', 'جالاكسي',
    'سنيكرز', 'تويكس', 'باونتي', 'مارس', 'كيت كات', 'كرانش', 'دايم',
    'جوز الهند', 'كراميل', 'توفي', 'حلاوة طحينية', 'حلاوة سمسمية',
    'كنافة نابلسية', 'بقلاوة', 'مشبك', 'زلابية', 'قطايف', 'قاطايف',
    'بسكوت', 'ويفر', 'بسكويتة', 'كيكة', 'تشيزكيك', 'تشيز كيك',
    'براوني', 'كوكيز', 'دونات', 'كروكيت', 'اكلير', 'تيراميسو',
    'حلوى', 'حلويات شرقية', 'حلويات غربية', 'جاتو', 'تورتة', 'تورته',
    'ايس كريم', 'كريمة', 'كريم كراميل', 'بودينج', 'جيلي', 'مهلبية'
  ],
  drinks: [
    'مشروب', 'عصير', 'ماء', 'بيبسي', 'كولا', 'شاي', 'قهوة', 'نسكافيه',
    'عصائر', 'مياه', 'معدنية', 'غازية', 'مشروبات', 'جبنة سائلة',
    'ماء صحي', 'ماء معدني', 'ماء غازي', 'بيبسي كولا', 'كوكا كولا',
    'سفن أب', 'ميرندا', 'فانتازيا', 'فانتا', 'شويبس', 'بيغ هاي',
    'برميل', 'عايدة', 'أبوهايل', 'زهرة الشام', 'عصير برتقال',
    'عصير تفاح', 'عصير مانجو', 'عصير عنب', 'عصير رمان', 'عصير جزر',
    'عصير طازج', 'سموذي', 'ميلك شيك', 'قهوة سريعة', 'قهوة تركي',
    'قهوة عربية', 'قهوة فرنساوي', 'اسبريسو', 'كابتشينو', 'لاتيه',
    'شاي أخضر', 'شاي أسود', 'شاي أحمر', 'شاي بالنعناع', 'بابونج',
    'يانسون', 'حلبة', 'زنجبيل', 'قرفة مشروب', 'كركديه', 'تمر هندي',
    'نسكافيه', 'كابتشينو', 'كاكاو', 'شوكو', 'حليب بالشوكولاتة',
    'بريك', 'قهوة بريك', 'قهوة سادة', 'قهوة خليجية', 'هاوس',
    'ريدبول', 'ريد بول', 'باور هورس', 'تايقر', 'مونستر', 'طاقة',
    'ماء فرش', 'فرش', 'أكوافينا', 'نوفا', 'أرضين', 'بركة', 'زمزم',
    'روتانا', 'عربي', 'كركم مشروب', 'حليب بالزعفران'
  ],
  snacks: [
    'سناكس', 'شيبس', 'مكسرات', 'فشار', 'بوب كورن', 'شيبسي', 'سناك',
    'شبس', 'شيب', 'ليز', 'دوريتوس', 'تشيترز', 'بوبي', 'كورن فليكس',
    'فشار', 'بوشار', 'بوب كورن', 'فشار زبدة', 'مكسرات مشكلة',
    'فول سوداني', 'فستق', 'لوز', 'كاجو', 'بندق', 'جوز', 'عين جمل',
    'بذور', 'بذر', 'قرع', 'بطيخ', 'دوار الشمس', 'حمص محمص',
    'نخالة', 'حبوب', 'كورن فليكس', 'شوفان', 'جرانولا', 'موسلي',
    'تشيبس', 'شيبس بطاطس', 'شيبس جبن', 'شيبس حار', 'ناجتس',
    'كوكيز', 'بسكويت', 'ويفر', 'كيك صغير', 'دوناتس',
    'شوكليت', 'شوكولاتة', 'جالاكسي', 'سنيكرز', 'تويكس', 'باونتي',
    'فيرير روشية', 'كت كت', 'مارس', 'دايم', 'كرانش', 'جونيور',
    'سفاري', 'مكسرات سودانية', 'قرعيات', 'سمسمية', 'حلاوة طحينية'
  ],
  cleaning: [
    'منظف', 'صابون', 'مسحوق', 'كلور', 'مطهر', 'ديتول', 'فيري', 'برسيل', 'تايد',
    'منظفات', 'صابون', 'غسول', 'شامبو', 'مسحوق غسيل', 'مسحوق تعقيم',
    'كلوركس', 'مبيض', 'معطر', 'منعم', 'مطهرات', 'مضاد بكتيري',
    'فيري', 'برسيل', 'تايد', 'اريال', 'أريال', 'تايد', 'سيرف',
    'داو', 'مير', 'فايري', 'جلي', 'معجون جلي', 'سائل جلي',
    'كلوروكس', 'مبيض ملابس', 'مبيض أبيض', 'معطر ملابس', 'ديتول',
    'دايتول', 'سافلون', 'هيكسول', 'ليزول', 'مطهر أرضيات',
    'منظف زجاج', 'منظف مطابخ', 'منظف حمامات', 'مزيل بقع', 'قشارة',
    'فوط', 'مناديل', 'منديل', 'فوطة', 'إسفنج', 'اسفنجة', 'فرشة',
    'مكنسة', 'مكنسه', 'ممسحة', 'دلو', 'قفازات', 'أكياس', 'أكياس قمامة'
  ],
  personal: [
    'شامبو', 'كريم', 'لوشن', 'معجون', 'فرشاة', 'مزيل', 'حفاضات', 'بامبرز',
    'عناية', 'شخصية', 'صابون', 'غسول', 'معجون أسنان', 'فرشاة أسنان',
    'خيط أسنان', 'غسول فم', 'مضمضة', 'سواك', 'معطر جو', 'معطر',
    'مزيل عرق', 'دودورانت', 'رول أون', 'سبراي', 'برفان', 'عطر',
    'كريم ترطيب', 'كريم بشرة', 'كريم شعر', 'جل شعر', 'واكس',
    'شامبو جاف', 'بلسم', 'ماسك شعر', 'زيت شعر', 'سيروم',
    'حفاضات', 'حفاض', 'بامبرز', 'ليدي سوفت', 'فيم', 'الويز',
    'مناديل أطفال', 'كريم أطفال', 'زيت أطفال', 'بودرة أطفال',
    'أمواس', 'شفرات', 'كريم حلاقة', 'فوم حلاقة', 'جيليت',
    'ماكياج', 'مكياج', 'كريم أساس', 'روج', 'أحمر شفاه', 'ماسكارا',
    'منظف بشرة', 'تونر', 'سيروم', 'واقي شمس', 'كريم ليل', 'كريم نهار'
  ],
  kitchen: [
    'قدر', 'مقلاة', 'طقم', 'صحن', 'كوب', 'ملعقة', 'سكين', 'مطبخ', 'أدوات',
    'قدور', 'مقالي', 'طقم قدور', 'طقم ملاعق', 'طقم صحون', 'طقم أكواب',
    'صحون', 'صحن', 'طبق', 'أطباق', 'كاسات', 'كاسة', 'كوب', 'أكواب',
    'ملعقة', 'ملاعق', 'شوكة', 'شوك', 'سكين', 'سكاكين', 'سكاكين مطبخ',
    'طاسة', 'طاسات', 'مقلاية', 'قلاية', 'قدر ضغط', 'برستو', 'قدر طهي',
    'حلة', 'حلل', 'مقلاة تفلون', 'مقلاة جرانيت', 'قدر ستانلس',
    'صينية', 'صواني', 'فرن', 'قوالب', 'قالب كيك', 'مضرب', 'خلاط',
    'خفاقة', 'عصارة', 'طاحونة', 'محضرة طعام', 'خلاط يدوي',
    'مصفاة', 'منخل', 'مبشرة', 'قشارة', 'لوح تقطيع', 'لوح خشب',
    'قفازات فرن', 'قفازات', 'فوط مطبخ', 'مناشف', 'إسفنج', 'قماش'
  ],
}

// دالة التصنيف التلقائي المحسّنة
const classifyProduct = (productName: string): string => {
  const nameLower = productName.toLowerCase().trim()
  const words = nameLower.split(/\s+/) // تقسيم الاسم إلى كلمات

  // نقاط لكل تصنيف
  const scores: Record<string, number> = {}

  for (const [categoryId, keywords] of Object.entries(categoryKeywords)) {
    let score = 0

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase()

      // تطابق كامل (أعلى نقاط)
      if (nameLower === keywordLower) {
        score += 100
      }
      // الكلمة المفتاحية موجودة ككلمة كاملة في الاسم
      else if (words.includes(keywordLower)) {
        score += 50
      }
      // الاسم يحتوي على الكلمة المفتاحية
      else if (nameLower.includes(keywordLower)) {
        score += 30
      }
      // الكلمة المفتاحية تحتوي على الاسم
      else if (keywordLower.includes(nameLower) && nameLower.length >= 3) {
        score += 20
      }
      // تطابق جزئي للكلمات
      else {
        for (const word of words) {
          if (word.length >= 3 && keywordLower.includes(word)) {
            score += 10
          }
          // تشابه في الحروف (للتعامل مع الأخطاء الإملائية)
          if (word.length >= 4 && keywordLower.length >= 4) {
            const similarity = calculateSimilarity(word, keywordLower)
            if (similarity > 0.8) {
              score += 15
            }
          }
        }
      }
    }

    if (score > 0) {
      scores[categoryId] = score
    }
  }

  // إرجاع التصنيف ذو أعلى نقاط
  const sortedCategories = Object.entries(scores).sort((a, b) => b[1] - a[1])

  if (sortedCategories.length > 0 && sortedCategories[0][1] >= 20) {
    return sortedCategories[0][0]
  }

  return 'other'
}

// دالة حساب التشابه بين كلمتين
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

// دالة حساب مسافة ليفنشتاين (للتعامل مع الأخطاء الإملائية)
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2[i - 1] === str1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

// قائمة المتاجر الافتراضية
const defaultStores = [
  'بنده', 'كارفور', 'لولو هايبر', 'العزيزية', 'التميمي', 'دانوب', 'الراشد', 'ع-extra', 'نستو', 'أسواقنا', 'النهدي'
]

// توليد معرف فريد بصيغة cuid متوافقة مع Prisma
const generateId = () => {
  // Prisma cuid: يبدأ بـ 'c' + 25 حرف (أرقام وأحرف صغيرة)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = 'c'
  for (let i = 0; i < 24; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

export default function Home() {
  // حالات التطبيق
  const [items, setItems] = useState<Item[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'missing' | 'purchased'>('all')
  const [groupByCategory, setGroupByCategory] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false)
  const [selectedItemForPrice, setSelectedItemForPrice] = useState<Item | null>(null)
  const [isStoresModalOpen, setIsStoresModalOpen] = useState(false) // نافذة إدارة المتاجر
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null) // المتجر المراد حذفه
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [familyMembers, setFamilyMembers] = useState<UserProfile[]>([])
  const [activeTab, setActiveTab] = useState<'items' | 'prices' | 'family'>('items')
  const [customStores, setCustomStores] = useState<string[]>([])
  const [priceHistory, setPriceHistory] = useState<Record<string, PriceEntry[]>>({})
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [shoppingTurn, setShoppingTurn] = useState<string>('')
  const [showTurnNotification, setShowTurnNotification] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false) // منع الحفظ قبل تحميل البيانات

  // النسخ الاحتياطية
  const [backups, setBackups] = useState<{id: string; timestamp: string; date: string}[]>([])
  const [isBackupLoading, setIsBackupLoading] = useState(false)
  const [showBackupModal, setShowBackupModal] = useState(false)

  // 🔄 حالات التحديث
  const [currentVersion, setCurrentVersion] = useState<string>('0.0.0')
  const [latestVersion, setLatestVersion] = useState<string>('0.0.0')
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<{
    version: string
    changelog: {version: string; date: string; changes: string[]}[]
    forceUpdate: boolean
 } | null>(null)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)

  // رسالة التنبيه
  const [alertMessage, setAlertMessage] = useState<string>('')
  const [showAlert, setShowAlert] = useState(false)

  // refs للتنظيف (منع memory leaks)
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const turnNotificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 🛡️ refs لمنع Race Condition في الحفظ
  const isSavingRef = useRef(false)
  const lastSaveTimeRef = useRef<number>(0)
  const MIN_SAVE_INTERVAL = 5000 // 5 ثوانٍ بين كل حفظ

  // دالة إظهار التنبيه
  const showAlertMessage = (message: string) => {
    setAlertMessage(message)
    setShowAlert(true)
    
    // تنظيف الـ timeout السابق
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current)
    }
    alertTimeoutRef.current = setTimeout(() => setShowAlert(false), 3000)
  }
  
  // 🧹 تنظيف الـ timeouts عند إغلاق المكون (منع memory leaks)
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current)
      }
      if (turnNotificationTimeoutRef.current) {
        clearTimeout(turnNotificationTimeoutRef.current)
      }
    }
  }, [])

  // حالات التاريخ (client-side only)
  const [gregorianDate, setGregorianDate] = useState<string>('')
  const [hijriDate, setHijriDate] = useState<string>('')
  
  // حالات الميزانية
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0)
  const [spentAmount, setSpentAmount] = useState<number>(0)
  const [budgetStartDate, setBudgetStartDate] = useState<string>('')
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState<string>('')
  
  // حالات النموذج
  const [itemName, setItemName] = useState('')
  const [itemCategory, setItemCategory] = useState('dairy')
  const [itemQuantity, setItemQuantity] = useState<number | ''>('')
  const [itemPrice, setItemPrice] = useState<number | ''>('') // السعر عند الإضافة
  const [itemPriceStore, setItemPriceStore] = useState<string>('') // المتجر
  const [itemNotes, setItemNotes] = useState('')
  const [itemImage, setItemImage] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)
  const [classifiedCategory, setClassifiedCategory] = useState<string | null>(null)

  // حالات السعر
  const [newPriceStore, setNewPriceStore] = useState('')
  const [newPriceAmount, setNewPriceAmount] = useState('')
  const [showCustomStoreInput, setShowCustomStoreInput] = useState(false)
  const [customStoreName, setCustomStoreName] = useState('')
  const [priceSearchTerm, setPriceSearchTerm] = useState('')

  // حالات تعديل المنتج في تتبع الأسعار
  const [editingPriceProductName, setEditingPriceProductName] = useState<string | null>(null)
  const [editingPriceData, setEditingPriceData] = useState<{ newName: string; prices: PriceEntry[] } | null>(null)
  const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false)
  const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null)

  // حالات التصنيفات المخصصة
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦')
  const [newCategoryColor, setNewCategoryColor] = useState('purple')
  const [newCategoryKeywords, setNewCategoryKeywords] = useState('')

  // حالات المصادقة
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  // حالة الوضع الليلي
  const [isDarkMode, setIsDarkMode] = useState(false)

  // تطبيق الوضع الليلي
  useEffect(() => {
    // تحميل تفضيل المستخدم
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev
      if (newValue) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return newValue
    })
  }

  // حالات السحب والإفلات
  const [draggedItem, setDraggedItem] = useState<Item | null>(null)
  const [dragOverItem, setDragOverItem] = useState<Item | null>(null)

  // حالات الاقتراحات
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [savedProductNames, setSavedProductNames] = useState<string[]>([])
  const itemInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // حالات مسح الفاتورة
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [scannedImage, setScannedImage] = useState<string | null>(null)
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // حالات العائلة
  const [family, setFamily] = useState<Family | null>(null)
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [isFamilyLoading, setIsFamilyLoading] = useState(false)

  // حالة PWA
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  // 📌 refs للوصول للبيانات الحالية من الـ intervals (بدون إعادة إنشائها)
  const itemsRef = useRef<Item[]>(items)
  const familyMembersRef = useRef<UserProfile[]>(familyMembers)
  const customStoresRef = useRef<string[]>(customStores)
  const priceHistoryRef = useRef<Record<string, PriceEntry[]>>(priceHistory)
  const customCategoriesRef = useRef<CustomCategory[]>(customCategories)
  const savedProductNamesRef = useRef<string[]>(savedProductNames)
  const monthlyBudgetRef = useRef<number>(monthlyBudget)
  const spentAmountRef = useRef<number>(spentAmount)
  const budgetStartDateRef = useRef<string>(budgetStartDate)
  const shoppingTurnRef = useRef<string>(shoppingTurn)

  // 📌 دوال محسّنة لتحديث state و ref معاً بشكل متزامن
  const updateItems = useCallback((newItems: Item[] | ((prev: Item[]) => Item[])) => {
    setItems(prev => {
      const updated = typeof newItems === 'function' ? newItems(prev) : newItems
      itemsRef.current = updated // تحديث الـ ref فوراً مع الـ state
      console.log('📝 updateItems:', updated.length, 'عناصر')
      return updated
    })
  }, [])

  const updateFamilyMembers = useCallback((newMembers: UserProfile[] | ((prev: UserProfile[]) => UserProfile[])) => {
    setFamilyMembers(prev => {
      const updated = typeof newMembers === 'function' ? newMembers(prev) : newMembers
      familyMembersRef.current = updated
      return updated
    })
  }, [])

  const updateCustomStores = useCallback((newStores: string[] | ((prev: string[]) => string[])) => {
    setCustomStores(prev => {
      const updated = typeof newStores === 'function' ? newStores(prev) : newStores
      customStoresRef.current = updated
      return updated
    })
  }, [])

  const updatePriceHistory = useCallback((newHistory: Record<string, PriceEntry[]> | ((prev: Record<string, PriceEntry[]>) => Record<string, PriceEntry[]>)) => {
    setPriceHistory(prev => {
      const updated = typeof newHistory === 'function' ? newHistory(prev) : newHistory
      priceHistoryRef.current = updated
      return updated
    })
  }, [])

  const updateBudget = useCallback((budget: {
    monthlyBudget?: number
    spentAmount?: number
    startDate?: string
    shoppingTurn?: string
  }) => {
    if (budget.monthlyBudget !== undefined) {
      setMonthlyBudget(budget.monthlyBudget)
      monthlyBudgetRef.current = budget.monthlyBudget
    }
    if (budget.spentAmount !== undefined) {
      setSpentAmount(budget.spentAmount)
      spentAmountRef.current = budget.spentAmount
    }
    if (budget.startDate !== undefined) {
      setBudgetStartDate(budget.startDate)
      budgetStartDateRef.current = budget.startDate
    }
    if (budget.shoppingTurn !== undefined) {
      setShoppingTurn(budget.shoppingTurn)
      shoppingTurnRef.current = budget.shoppingTurn
    }
  }, [])

  // 💾 حفظ البيانات عند مغادرة الصفحة (beforeunload + visibilitychange)
  // 📌 نستخدم refs فقط - ولا نعيد إنشاء الـ event listeners عند كل تغيير
  useEffect(() => {
    // دالة حفظ موحدة تستخدم fetch مع keepalive
    const saveToServer = (reason: string) => {
      if (!isLoggedIn || !isDataLoaded) return
      
      const data = {
        items: itemsRef.current,
        familyMembers: familyMembersRef.current,
        customStores: customStoresRef.current,
        priceHistory: priceHistoryRef.current,
        budget: { 
          monthlyBudget: monthlyBudgetRef.current, 
          spentAmount: spentAmountRef.current, 
          startDate: budgetStartDateRef.current, 
          shoppingTurn: shoppingTurnRef.current 
        },
        customCategories: customCategoriesRef.current,
        savedProductNames: savedProductNamesRef.current
      }
      
      console.log(`💾 ${reason}: حفظ`, itemsRef.current.length, 'عناصر')
      
      // 🔧 استخدام fetch مع keepalive بدلاً من sendBeacon
      // keepalive يسمح للطلب بالاستمرار حتى بعد إغلاق الصفحة
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true // 🔧 مهم: يسمح بالحفظ حتى بعد إغلاق الصفحة
      }).catch(err => console.error(`Save error (${reason}):`, err))
    }

    const handleBeforeUnload = () => {
      saveToServer('beforeunload')
    }

    // 📌 visibilitychange - أفضل من beforeunload للأجهزة المحمولة
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveToServer('visibilitychange')
      }
    }

    // 📌 معالجة pageshow للتعامل مع bfcache (back-forward cache)
    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('📌 pageshow: العودة من bfcache')
        saveToServer('pageshow')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  // 📌 فقط isLoggedIn و isDataLoaded في الـ dependencies - لا نعيد إنشاء عند تغيير البيانات
  }, [isLoggedIn, isDataLoaded])

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const installPWA = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallPrompt(false)
    }
    setDeferredPrompt(null)
  }

  // 🔄 التحقق من التحديثات
  const checkForUpdates = async (showNotification: boolean = false) => {
    if (isCheckingUpdate) return
    
    setIsCheckingUpdate(true)
    try {
      // الحصول على الإصدار المحلي المخزن
      const storedVersion = localStorage.getItem('appVersion') || '0.0.0'
      setCurrentVersion(storedVersion)

      // جلب أحدث إصدار من السيرفر
      const response = await fetch('/api/version', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setLatestVersion(data.version)
        
        // مقارنة الإصدارات
        const stored = storedVersion.split('.').map(Number)
        const latest = data.version.split('.').map(Number)
        
        let isNewer = false
        for (let i = 0; i < 3; i++) {
          if ((latest[i] || 0) > (stored[i] || 0)) {
            isNewer = true
            break
          }
          if ((latest[i] || 0) < (stored[i] || 0)) {
            break
          }
        }
        
        if (isNewer) {
          setUpdateInfo({
            version: data.version,
            changelog: data.changelog,
            forceUpdate: data.forceUpdate
          })
          setShowUpdateModal(true)
        } else if (showNotification) {
          showAlertMessage('✅ أنت تستخدم أحدث إصدار')
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
      if (showNotification) {
        showAlertMessage('❌ فشل التحقق من التحديثات')
      }
    }
    setIsCheckingUpdate(false)
  }

  // 🔄 تطبيق التحديث
  const applyUpdate = () => {
    // تحديث الإصدار المحلي
    localStorage.setItem('appVersion', latestVersion)
    setCurrentVersion(latestVersion)
    setShowUpdateModal(false)
    
    // إعادة تحميل الصفحة للحصول على أحدث الملفات
    if ('caches' in window) {
      // تنظيف الكاش
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name))
      }).then(() => {
        window.location.reload()
      })
    } else {
      window.location.reload()
    }
  }

  // 🔄 التحقق من التحديثات عند بدء التطبيق
  useEffect(() => {
    // تحميل الإصدار المحلي
    const storedVersion = localStorage.getItem('appVersion')
    if (!storedVersion) {
      // أول مرة - تخزين الإصدار الحالي
      fetch('/api/version', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          localStorage.setItem('appVersion', data.version)
          setCurrentVersion(data.version)
        })
        .catch(console.error)
    } else {
      setCurrentVersion(storedVersion)
    }

    // التحقق من التحديثات عند بدء التطبيق
    checkForUpdates()
    
    // التحقق كل 30 دقيقة
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // 🔄 التحقق من تحديث Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // التحقق من تحديثات SW
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // يوجد تحديث جديد
                checkForUpdates()
              }
            })
          }
        })
      })
    }
  }, [])

  // تحميل أسماء المنتجات السابقة من localStorage (للسجل التاريخي)
  useEffect(() => {
    const saved = localStorage.getItem('savedProductNames')
    if (saved) {
      try {
        setSavedProductNames(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading saved product names:', e)
      }
    }
  }, [])

  // تحديث أسماء المنتجات عند تغيير items + دمج مع السجل المحلي
  useEffect(() => {
    if (items.length > 0) {
      const currentNames = [...new Set(items.map(item => item.name.trim()).filter(name => name.length > 0))]
      setSavedProductNames(prev => {
        const combined = [...new Set([...prev, ...currentNames])]
        // حفظ في localStorage للسجل التاريخي
        localStorage.setItem('savedProductNames', JSON.stringify(combined))
        return combined
      })
    }
  }, [items])

  // فلترة الاقتراحات عند الكتابة - تستخدم items + priceHistory + السجل المحلي
  useEffect(() => {
    if (itemName.trim().length >= 1) { // يبدأ من حرف واحد
      const query = itemName.toLowerCase().trim()

      // استخراج الأسماء من items الحالية (تُحفظ على السيرفر)
      const currentItemNames = [...new Set(items.map(item => item.name.trim()))]
      const currentItemNamesLower = currentItemNames.map(n => n.toLowerCase())

      // استخراج الأسماء من تتبع الأسعار (priceHistory)
      // نحتفظ بالاسم الأصلي من items إن وجد، وإلا نستخدم المفتاح
      const priceHistoryNames: string[] = []
      Object.keys(priceHistory).forEach(key => {
        // ابحث عن الاسم الأصلي في items
        const originalName = items.find(item => item.name.toLowerCase().trim() === key)?.name
        priceHistoryNames.push(originalName || key)
      })

      // دمج جميع المصادر: items + priceHistory + السجل المحلي
      const allNames = [...new Set([...currentItemNames, ...priceHistoryNames, ...savedProductNames])]

      // ترتيب حسب الأولوية:
      // 1. المنتجات في القائمة الحالية (الأحدث أولاً)
      const recentNames = items
        .filter(item => item.name.toLowerCase().includes(query))
        .map(item => item.name.trim())

      // 2. المنتجات من تتبع الأسعار (لم تكن في القائمة الحالية)
      const priceNames = priceHistoryNames
        .filter(name => name.toLowerCase().includes(query) && !currentItemNamesLower.includes(name.toLowerCase()))

      // 3. باقي الأسماء من السجل المحلي
      const otherNames = savedProductNames
        .filter(name => name.toLowerCase().includes(query) && 
                !recentNames.some(r => r.toLowerCase() === name.toLowerCase()) && 
                !priceNames.some(p => p.toLowerCase() === name.toLowerCase()))

      // دمج مع إعطاء أولوية للمنتجات الحالية ثم تتبع الأسعار
      const filtered = [...new Set([...recentNames, ...priceNames, ...otherNames])].slice(0, 12) // حد أقصى 12 اقتراح

      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredSuggestions([])
      setShowSuggestions(false)
    }
    setSelectedIndex(-1)
  }, [itemName, items, priceHistory, savedProductNames])

  // إغلاق قائمة الاقتراحات عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // دمج المتاجر الافتراضية مع المخصصة (مع إزالة التكرار)
  const allStores = [...new Set([...defaultStores, ...customStores])]

  // حذف منتج من الاقتراحات نهائياً
  const handleDeleteSuggestion = async (productName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const productNameLower = productName.toLowerCase().trim()
      
      // 📌 تحديث priceHistory و ref معاً
      const newPriceHistory = { ...priceHistoryRef.current }
      delete newPriceHistory[productNameLower]
      priceHistoryRef.current = newPriceHistory
      setPriceHistory(newPriceHistory)
      
      // 📌 تحديث items و ref معاً
      const newItems = itemsRef.current.filter(item => item.name.toLowerCase().trim() !== productNameLower)
      itemsRef.current = newItems
      setItems(newItems)
      
      // 📌 تحديث savedProductNames و ref معاً
      const filteredNames = savedProductNamesRef.current.filter(name => name.toLowerCase() !== productNameLower)
      savedProductNamesRef.current = filteredNames
      setSavedProductNames(filteredNames)
      localStorage.setItem('savedProductNames', JSON.stringify(filteredNames))
      
      setShowSuggestions(false)
      showAlertMessage(`تم حذف "${productName}" من الاقتراحات`)
      
      // 🚨 حفظ فوري على السيرفر
      if (isLoggedIn && isDataLoaded) {
        try {
          await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: newItems,
              familyMembers: familyMembersRef.current,
              customStores: customStoresRef.current,
              priceHistory: newPriceHistory,
              budget: {
                monthlyBudget: monthlyBudgetRef.current,
                spentAmount: spentAmountRef.current,
                startDate: budgetStartDateRef.current,
                shoppingTurn: shoppingTurnRef.current
              },
              customCategories: customCategoriesRef.current,
              savedProductNames: filteredNames
            })
          })
        } catch (serverError) {
          console.error('فشل حذف الاقتراح من السيرفر:', serverError)
        }
      }
    } catch (error) {
      console.error('Delete suggestion error:', error)
      showAlertMessage('حدث خطأ في الحذف')
    }
  }

  // حفظ بيانات المستخدم على السيرفر
  // 📌 تستخدم refs للوصول للبيانات الحالية - لا تعتمد على الـ state المتغير
  const saveUserData = useCallback(async () => {
    // 🛡️ حماية قوية: لا تحفظ إذا لم يكن مسجل الدخول
    if (!isLoggedIn) {
      console.log('⚠️ saveUserData: ليس مسجل الدخول')
      return
    }

    // 🛡️ حماية قوية: لا تحفظ إذا كان يحفظ بالفعل
    if (isSaving) {
      console.log('⚠️ saveUserData: يحفظ بالفعل')
      return
    }

  // 🛡️ حماية قوية: لا تحفظ إذا لم يتم تحميل البيانات بعد
    if (!isDataLoaded) {
      console.log('⚠️ saveUserData: البيانات لم تُحمّل بعد - تم إلغاء الحفظ')
      return
    }

    // 📌 استخدام refs للوصول للبيانات الحالية
    const currentItems = itemsRef.current
    const currentFamilyMembers = familyMembersRef.current
    const currentCustomStores = customStoresRef.current
    const currentPriceHistory = priceHistoryRef.current
    const currentCustomCategories = customCategoriesRef.current
    const currentSavedProductNames = savedProductNamesRef.current
    const currentBudget = {
      monthlyBudget: monthlyBudgetRef.current,
      spentAmount: spentAmountRef.current,
      startDate: budgetStartDateRef.current,
      shoppingTurn: shoppingTurnRef.current
    }

    const totalItems = currentItems.length
    const totalFamily = currentFamilyMembers.length
    const totalPriceHistory = Object.keys(currentPriceHistory).length

    // 🛡️ منع Race Condition: لا تحفظ إذا كانت عملية حفظ أخرى قيد التنفيذ
    if (isSavingRef.current) {
      console.log('⚠️ saveUserData: عملية حفظ أخرى قيد التنفيذ - تم تخطي')
      return
    }

    // 🛡️ منع الحفظ المتكرر السريع: يجب مرور 5 ثوانٍ من آخر حفظ
    const now = Date.now()
    if (lastSaveTimeRef.current && (now - lastSaveTimeRef.current) < MIN_SAVE_INTERVAL) {
      console.log('⚠️ saveUserData: تم تخطي الحفظ - وقت قصير جداً من آخر حفظ')
      return
    }

    console.log(`💾 saveUserData: حفظ ${totalItems} items, ${totalFamily} family, ${totalPriceHistory} priceHistory`)

    isSavingRef.current = true
    setIsSaving(true)
    lastSaveTimeRef.current = now
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: currentItems,
          familyMembers: currentFamilyMembers,
          customStores: currentCustomStores,
          priceHistory: currentPriceHistory,
          budget: currentBudget,
          customCategories: currentCustomCategories,
          savedProductNames: currentSavedProductNames
        })
      })

      if (response.status === 401) {
        // انتهت صلاحية الجلسة - تسجيل خروج
        console.log('⚠️ انتهت صلاحية الجلسة')
        setIsLoggedIn(false)
        setCurrentUser(null)
      } else if (response.ok) {
        console.log('✅ تم حفظ البيانات')
      } else {
        console.error('⚠️ فشل حفظ البيانات:', response.status)
      }
    } catch (error) {
      console.error('Save error:', error)
    }
    isSavingRef.current = false
    setIsSaving(false)
  // 📌 استخدام refs في الـ dependencies بدلاً من الـ states
  // هذا يمنع إعادة إنشاء الدالة عند كل تغيير
  }, [isLoggedIn, isSaving, isDataLoaded])

  // ⚠️ تم إزالة الـ save useEffect الذي كان يعتمد على items
  // السبب: كان يسبب حفظ البيانات عند تحميلها من السيرفر - race condition
  // الآن نعتمد على:
  // 1. الحفظ الفوري عند الإضافة/التعديل/الحذف (في handleSubmit و deleteItem)
  // 2. الحفظ التلقائي كل 30 ثانية (auto-sync interval)
  // 3. الحفظ عند beforeunload/visibilitychange/pageshow

  // تحميل البيانات من السيرفر
  const loadUserData = async () => {
    try {
      console.log('📥 loadUserData: جاري تحميل البيانات...')

      // 🔧 تشغيل الـ migration إذا لزم الأمر
      try {
        const migrateResponse = await fetch('/api/migrate', { method: 'POST' })
        if (migrateResponse.ok) {
          const migrateData = await migrateResponse.json()
          if (migrateData.columnAdded) {
            console.log('✅ تم إضافة عمود selectedStore لقاعدة البيانات')
          }
        }
      } catch (migrateError) {
        console.log('⚠️ Migration check skipped:', migrateError)
      }

      const response = await fetch('/api/sync')
      if (response.ok) {
        const data = await response.json()
        
        // 📌 تحديث states و refs معاً بشكل متزامن
        const loadedItems = data.items || []
        const loadedFamilyMembers = data.familyMembers || []
        const loadedCustomStores = data.customStores || []
        const loadedPriceHistory = data.priceHistory || {}
        const loadedCustomCategories = data.customCategories || []
        const loadedSavedProductNames = data.savedProductNames || []
        
        // تحديث الـ states
        setItems(loadedItems)
        setFamilyMembers(loadedFamilyMembers)
        setCustomStores(loadedCustomStores)
        setPriceHistory(loadedPriceHistory)
        setCustomCategories(loadedCustomCategories)
        setSavedProductNames(loadedSavedProductNames)
        
        // 📌 تحديث الـ refs فوراً
        itemsRef.current = loadedItems
        familyMembersRef.current = loadedFamilyMembers
        customStoresRef.current = loadedCustomStores
        priceHistoryRef.current = loadedPriceHistory
        customCategoriesRef.current = loadedCustomCategories
        savedProductNamesRef.current = loadedSavedProductNames
        
        if (data.budget) {
          const budget = {
            monthlyBudget: data.budget.monthlyBudget || 0,
            spentAmount: data.budget.spentAmount || 0,
            startDate: data.budget.startDate || '',
            shoppingTurn: data.budget.shoppingTurn || ''
          }
          setMonthlyBudget(budget.monthlyBudget)
          setSpentAmount(budget.spentAmount)
          setBudgetStartDate(budget.startDate)
          setShoppingTurn(budget.shoppingTurn)
          
          // 📌 تحديث refs للميزانية
          monthlyBudgetRef.current = budget.monthlyBudget
          spentAmountRef.current = budget.spentAmount
          budgetStartDateRef.current = budget.startDate
          shoppingTurnRef.current = budget.shoppingTurn
        }
        
        // تحديد أن البيانات تم تحميلها - الآن يمكن الحفظ
        setIsDataLoaded(true)
        console.log('✅ loadUserData: تم تحميل', loadedItems.length, 'عناصر - refs محدثة')
      } else if (response.status === 401) {
        console.log('⚠️ الجلسة منتهية')
        setIsLoggedIn(false)
        setCurrentUser(null)
        setIsDataLoaded(true) // السماح بالعمل حتى لو انتهت الجلسة
      } else {
        // خطأ آخر - لا نزال نسمح بالعمل
        console.error('خطأ في تحميل البيانات:', response.status)
        setIsDataLoaded(true)
      }
    } catch (error) {
      console.error('Load error:', error)
      // في حالة خطأ الشبكة، نسمح بالعمل وسيتم إعادة المحاولة لاحقاً
      setIsDataLoaded(true)
    }
  }

  // 🔄 دوال النسخ الاحتياطي
  // جلب قائمة النسخ الاحتياطية
  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backup')
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups || [])
      }
    } catch (error) {
      console.error('Fetch backups error:', error)
    }
  }

  // إنشاء نسخة احتياطية
  const createBackup = async () => {
    setIsBackupLoading(true)
    try {
      const response = await fetch('/api/backup', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        showAlertMessage(`✅ تم إنشاء نسخة احتياطية بنجاح (${data.stats?.items || 0} عنصر)`)
        await fetchBackups()
      } else {
        showAlertMessage('❌ فشل إنشاء النسخة الاحتياطية')
      }
    } catch (error) {
      console.error('Create backup error:', error)
      showAlertMessage('❌ حدث خطأ أثناء إنشاء النسخة الاحتياطية')
    }
    setIsBackupLoading(false)
  }

  // استعادة نسخة احتياطية
  const restoreBackup = async (backupId: string) => {
    if (!confirm('⚠️ تحذير: سيتم استبدال جميع البيانات الحالية ببيانات النسخة الاحتياطية. هل أنت متأكد؟')) {
      return
    }

    setIsBackupLoading(true)
    try {
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId })
      })

      if (response.ok) {
        const data = await response.json()
        showAlertMessage(`✅ تم استعادة البيانات بنجاح`)
        setShowBackupModal(false)
        // إعادة تحميل البيانات
        await loadUserData()
      } else {
        const error = await response.json()
        showAlertMessage(`❌ فشل الاستعادة: ${error.error}`)
      }
    } catch (error) {
      console.error('Restore backup error:', error)
      showAlertMessage('❌ حدث خطأ أثناء الاستعادة')
    }
    setIsBackupLoading(false)
  }

  // 📤 تصدير جميع البيانات
  const exportAllData = async () => {
    try {
      showAlertMessage('📦 جاري تصدير البيانات...')
      
      const response = await fetch('/api/export')
      
      if (!response.ok) {
        throw new Error('فشل في تصدير البيانات')
      }
      
      const data = await response.json()
      
      // إنشاء ملف JSON للتحميل
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mqadhi-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showAlertMessage('✅ تم تصدير البيانات بنجاح!')
    } catch (error) {
      console.error('Export error:', error)
      showAlertMessage('❌ حدث خطأ أثناء التصدير')
    }
  }

  // 📥 استيراد البيانات
  const importAllData = async (file: File) => {
    try {
      setIsBackupLoading(true)
      
      // 🛡️ منع الحفظ التلقائي أثناء الاستيراد
      setIsDataLoaded(false)
      
      // قراءة الملف
      const text = await file.text()
      let data
      
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('ملف JSON غير صالح - تأكد من أن الملف بتنسيق صحيح')
      }
      
      // التحقق من صحة الملف
      if (!data.exportType || data.exportType !== 'mqadhi-backup') {
        throw new Error('ملف غير صالح - ليس نسخة احتياطية من تطبيق مقاضي')
      }
      
      // إظهار معلومات الملف
      const infoMessage = `📦 ملف نسخة احتياطية:
• الإصدار: ${data.appVersion || 'غير معروف'}
• التاريخ: ${data.exportDate ? new Date(data.exportDate).toLocaleDateString('ar-SA') : 'غير معروف'}
• الأغراض: ${data.items?.length || 0}
• الأسعار: ${data.priceHistory ? Object.keys(data.priceHistory).length : 0}
• أفراد العائلة: ${data.familyMembers?.length || 0}`
      
      // تأكيد قبل الاستيراد
      if (!confirm(infoMessage + '\n\n⚠️ تحذير: سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟')) {
        setIsBackupLoading(false)
        setIsDataLoaded(true)
        return
      }
      
      showAlertMessage('📦 جاري استيراد البيانات...')
      
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'فشل في استيراد البيانات')
      }
      
      const result = await response.json()
      console.log('✅ نتيجة الاستيراد:', result)
      
      // تحميل البيانات مباشرة من السيرفر بعد الاستيراد
      console.log('📥 تحميل البيانات بعد الاستيراد...')
      await loadUserData()
      
      // إغلاق نافذة النسخ الاحتياطي
      setShowBackupModal(false)
      
      showAlertMessage(`✅ تم استيراد البيانات بنجاح! (${result.stats.items} غرض، ${result.stats.priceHistory} سعر)`)
      
    } catch (error) {
      console.error('Import error:', error)
      showAlertMessage(`❌ ${error instanceof Error ? error.message : 'حدث خطأ أثناء الاستيراد'}`)
      setIsDataLoaded(true) // إعادة تفعيل الحفظ في حالة الخطأ
    }
    setIsBackupLoading(false)
  }

  // مزامنة يدوية
  const handleManualSync = async () => {
    if (isSyncing) return

    // 🛡️ حماية: لا تحفظ إذا لم يتم تحميل البيانات بعد
    if (!isDataLoaded) {
      console.log('⚠️ تم تخطي المزامنة اليدوية - البيانات لم تُحمّل بعد')
      alert('يرجى الانتظار حتى يتم تحميل البيانات')
      return
    }

    // 📌 تم إزالة شرط "البيانات الفارغة" - يجب حفظ حتى لو كانت فارغة
    // السبب: المستخدم قد يحذف جميع المنتجات ونريد حفظ هذا التغيير

    setIsSyncing(true)
    try {
      // حفظ البيانات المحلية أولاً
      const saveResponse = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          familyMembers,
          customStores,
          priceHistory,
          budget: { monthlyBudget, spentAmount, startDate: budgetStartDate, shoppingTurn },
          customCategories,
          savedProductNames
        })
      })

      if (!saveResponse.ok) {
        if (saveResponse.status === 401) {
          // انتهت صلاحية الجلسة
          setIsLoggedIn(false)
          setCurrentUser(null)
          throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً')
        }
        const errorData = await saveResponse.json().catch(() => ({}))
        console.error('Sync error response:', errorData)
        throw new Error(errorData.error || 'فشل في حفظ البيانات')
      }

      // ثم تحميل البيانات المحدثة
      const response = await fetch('/api/sync')
      if (response.ok) {
        const data = await response.json()
        
        // 📌 تحديث states و refs معاً
        const loadedItems = data.items || []
        const loadedFamilyMembers = data.familyMembers || []
        const loadedCustomStores = data.customStores || []
        const loadedPriceHistory = data.priceHistory || {}
        const loadedCustomCategories = data.customCategories || []
        const loadedSavedProductNames = data.savedProductNames || []
        
        itemsRef.current = loadedItems
        familyMembersRef.current = loadedFamilyMembers
        customStoresRef.current = loadedCustomStores
        priceHistoryRef.current = loadedPriceHistory
        customCategoriesRef.current = loadedCustomCategories
        savedProductNamesRef.current = loadedSavedProductNames
        
        setItems(loadedItems)
        setFamilyMembers(loadedFamilyMembers)
        setCustomStores(loadedCustomStores)
        setPriceHistory(loadedPriceHistory)
        setCustomCategories(loadedCustomCategories)
        setSavedProductNames(loadedSavedProductNames)
        
        if (data.budget) {
          const budget = {
            monthlyBudget: data.budget.monthlyBudget || 0,
            spentAmount: data.budget.spentAmount || 0,
            startDate: data.budget.startDate || '',
            shoppingTurn: data.budget.shoppingTurn || ''
          }
          monthlyBudgetRef.current = budget.monthlyBudget
          spentAmountRef.current = budget.spentAmount
          budgetStartDateRef.current = budget.startDate
          shoppingTurnRef.current = budget.shoppingTurn
          
          setMonthlyBudget(budget.monthlyBudget)
          setSpentAmount(budget.spentAmount)
          setBudgetStartDate(budget.startDate)
          setShoppingTurn(budget.shoppingTurn)
        }
        setLastSyncTime(new Date())
        setIsDataLoaded(true) // تأكيد تحميل البيانات
        console.log('✅ تمت المزامنة اليدوية بنجاح -', loadedItems.length, 'عناصر')
      }
    } catch (error) {
      console.error('Manual sync error:', error)
      alert('فشل في المزامنة. تحقق من اتصالك بالإنترنت.')
    }
    setIsSyncing(false)
  }

  // تحميل البيانات عند بدء التطبيق
  useEffect(() => {
    // حساب التاريخ
    const today = new Date()
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    const dayName = days[today.getDay()]
    const day = today.getDate()
    const month = today.getMonth() + 1
    const year = today.getFullYear()
    setGregorianDate(`${dayName}، ${day}/${month}/${year}م`)
    
    try {
      const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      })
      const parts = hijriFormatter.formatToParts(today)
      let hDay = '', hMonth = '', hYear = ''
      for (const part of parts) {
        if (part.type === 'day') hDay = part.value
        if (part.type === 'month') hMonth = part.value
        if (part.type === 'year') hYear = part.value
      }
      setHijriDate(`${hDay}/${hMonth}/${hYear} هـ`)
    } catch {
      setHijriDate('')
    }

    // التحقق من تسجيل الدخول
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setCurrentUser(data.user)
          setIsLoggedIn(true)
          await loadUserData()
        }
      } catch (error) {
        console.error('Auth check error:', error)
      }
      setIsLoaded(true)
    }
    checkAuth()
  }, [])

  // مزامنة تلقائية كل 30 ثانية - حفظ فقط بعد تحميل البيانات
  // 📌 استخدام refs للوصول للبيانات - لا نعيد إنشاء الـ interval عند كل تغيير
  useEffect(() => {
    if (!isLoggedIn || !isDataLoaded) return

    const syncInterval = setInterval(async () => {
      // 📌 استخدام refs للوصول لأحدث البيانات
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsRef.current,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
        if (response.ok) {
          setLastSyncTime(new Date())
          console.log('✅ تم حفظ البيانات تلقائياً -', itemsRef.current.length, 'منتج')
        }
      } catch (error) {
        console.error('Auto save error:', error)
      }
    }, 30000) // كل 30 ثانية

    return () => clearInterval(syncInterval)
  }, [isLoggedIn, isDataLoaded]) // 📌 فقط هذين - لا نعيد إنشاء الـ interval عند تغيير البيانات

  // ⚠️ تم إزالة focus handler الذي كان يحمل بيانات من السيرفر
  // السبب: كان يكتب فوق التغييرات المحلية الحديثة (مثل الحذف)
  // الآن نعتمد على: الحفظ الفوري عند الحذف + الحفظ التلقائي كل 30 ثانية + زر المزامنة اليدوية

  // تسجيل حساب جديد
  const handleRegister = async () => {
    setAuthError('')

    if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
      setAuthError('جميع الحقول مطلوبة')
      return
    }

    if (authPassword.length < 6) {
      setAuthError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setAuthLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword })
      })
      const data = await response.json()

      if (response.ok) {
        // إغلاق النافذة أولاً
        setIsAuthModalOpen(false)
        setAuthName('')
        setAuthEmail('')
        setAuthPassword('')
        setAuthError('')
        
        // تحديث حالة المستخدم
        setCurrentUser(data.user)
        setIsLoggedIn(true)
        
        // تصفير البيانات للمستخدم الجديد (state و ref معاً)
        itemsRef.current = []
        setItems([])
        familyMembersRef.current = []
        setFamilyMembers([])
        customStoresRef.current = []
        setCustomStores([])
        priceHistoryRef.current = {}
        setPriceHistory({})
        monthlyBudgetRef.current = 0
        setMonthlyBudget(0)
        spentAmountRef.current = 0
        setSpentAmount(0)
        budgetStartDateRef.current = ''
        setBudgetStartDate('')
        shoppingTurnRef.current = ''
        setShoppingTurn('')
        customCategoriesRef.current = []
        setCustomCategories([])
        savedProductNamesRef.current = []
        setSavedProductNames([])

        // 🚨 مهم جداً: تفعيل isDataLoaded للسماح بالحفظ
        setIsDataLoaded(true)

        console.log('✅ تم إنشاء الحساب بنجاح:', data.user.name)
      } else {
        setAuthError(data.error || 'حدث خطأ')
      }
    } catch (error) {
      console.error('Register error:', error)
      setAuthError('حدث خطأ في الاتصال')
    }
    setAuthLoading(false)
  }

  // تسجيل الدخول
  const handleLogin = async () => {
    setAuthError('')

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('البريد الإلكتروني وكلمة المرور مطلوبان')
      return
    }

    setAuthLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      })
      const data = await response.json()

      if (response.ok) {
        // إغلاق النافذة أولاً
        setIsAuthModalOpen(false)
        setAuthEmail('')
        setAuthPassword('')
        setAuthError('')
        
        // تحديث حالة المستخدم
        setCurrentUser(data.user)
        setIsLoggedIn(true)
        
        // تحميل البيانات
        await loadUserData()
        
        console.log('✅ تم تسجيل الدخول بنجاح:', data.user.name)
      } else {
        setAuthError(data.error || 'حدث خطأ')
      }
    } catch (error) {
      console.error('Login error:', error)
      setAuthError('حدث خطأ في الاتصال')
    }
    setAuthLoading(false)
  }

  // تسجيل الخروج
  const handleLogout = async () => {
    try {
      // 🔄 إنشاء نسخة احتياطية قبل تسجيل الخروج (إذا كانت هناك بيانات)
      if (isDataLoaded && (items.length > 0 || Object.keys(priceHistory).length > 0 || familyMembers.length > 0)) {
        try {
          await fetch('/api/backup', { method: 'POST' })
          console.log('✅ تم إنشاء نسخة احتياطية قبل تسجيل الخروج')
        } catch (e) {
          console.error('Backup before logout failed:', e)
        }
      }

      // حفظ البيانات قبل تسجيل الخروج
      await saveUserData()
      await fetch('/api/auth/logout', { method: 'POST' })

      // مسح البيانات المحلية (state و ref معاً)
      setCurrentUser(null)
      itemsRef.current = []
      setItems([])
      familyMembersRef.current = []
      setFamilyMembers([])
      customStoresRef.current = []
      setCustomStores([])
      priceHistoryRef.current = {}
      setPriceHistory({})
      monthlyBudgetRef.current = 0
      setMonthlyBudget(0)
      spentAmountRef.current = 0
      setSpentAmount(0)
      budgetStartDateRef.current = ''
      setBudgetStartDate('')
      shoppingTurnRef.current = ''
      setShoppingTurn('')
      customCategoriesRef.current = []
      setCustomCategories([])
      savedProductNamesRef.current = []
      setIsLoggedIn(false)
      setIsDataLoaded(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // التصنيف التلقائي عند كتابة اسم الغرض
  useEffect(() => {
    const classifyItem = async () => {
      if (!itemName || itemName.length < 2 || editingItem) {
        setClassifiedCategory(null)
        return
      }

      // التصنيف المحلي السريع أولاً
      const localCategory = classifyProduct(itemName)
      if (localCategory && localCategory !== 'other') {
        setClassifiedCategory(localCategory)
        setItemCategory(localCategory)
        return // لا حاجة لاستدعاء API
      }

      // استخدام AI فقط إذا لم نجد تصنيف محلي
      setIsClassifying(true)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000) // timeout ثانيتين فقط

        const response = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            itemName,
            customCategories: customCategories.map(c => ({
              id: c.id,
              name: c.name,
              keywords: c.keywords
            }))
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          if (data.category) {
            setClassifiedCategory(data.category)
            setItemCategory(data.category)
          }
        }
      } catch (error) {
        // في حالة الخطأ أو timeout، نتجاهل ونستخدم التصنيف الافتراضي
        console.log('Classification skipped:', error)
      } finally {
        setIsClassifying(false)
      }
    }

    const debounce = setTimeout(classifyItem, 300) // تقليل الانتظار
    return () => clearTimeout(debounce)
  }, [itemName, editingItem, customCategories])

  // معالجة الصورة
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setItemImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // فتح معاينة الصورة
  const openImagePreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl)
    setIsImagePreviewOpen(true)
  }

  // إغلاق معاينة الصورة
  const closeImagePreview = () => {
    setIsImagePreviewOpen(false)
    setPreviewImageUrl(null)
  }

  // إضافة أو تعديل غرض
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('handleSubmit called, itemName:', itemName)

    if (!itemName || !itemName.trim()) {
      console.log('⚠️ اسم المنتج فارغ')
      return
    }

    const trimmedName = itemName.trim()
    console.log('✅ إضافة منتج:', trimmedName)

    // 📌 استخدام itemsRef.current بدلاً من items لتجنب closure problems
    const currentItems = itemsRef.current
    let updatedItems: Item[]

    if (editingItem) {
      updatedItems = currentItems.map(item =>
        item.id === editingItem.id
          ? { ...item, name: trimmedName, category: itemCategory, quantity: itemQuantity || 1, notes: itemNotes, image: itemImage }
          : item
      )
      // 📌 تحديث state و ref معاً
      itemsRef.current = updatedItems
      setItems(updatedItems)
      setEditingItem(null)
    } else {
      const productKey = trimmedName.toLowerCase()
      const savedPrices = priceHistoryRef.current[productKey] || []

      // 📌 إذا أضاف المستخدم سعراً جديداً، أضفه للأسعار
      let initialPrices = [...savedPrices]
      const priceValue = typeof itemPrice === 'number' ? itemPrice : parseFloat(String(itemPrice))

      console.log('💰 السعر المدخل:', { itemPrice, itemPriceStore, priceValue })

      if (priceValue && priceValue > 0) {
        const storeName = itemPriceStore || 'السعر المدخل'
        const newPrice: PriceEntry = {
          store: storeName,
          price: priceValue,
          date: new Date().toISOString()
        }
        initialPrices.push(newPrice)

        // 📌 تحديث priceHistory أيضاً
        const newPriceHistory = { ...priceHistoryRef.current }
        newPriceHistory[productKey] = initialPrices
        priceHistoryRef.current = newPriceHistory
        setPriceHistory(newPriceHistory)

        // 📌 إضافة المتجر للمتاجر المخصصة إذا لم يكن موجوداً
        if (itemPriceStore && !allStores.includes(itemPriceStore) && !defaultStores.includes(itemPriceStore)) {
          const newCustomStores = [...customStoresRef.current, itemPriceStore]
          customStoresRef.current = newCustomStores
          setCustomStores(newCustomStores)
        }
      }

      const newItem: Item = {
        id: generateId(),
        name: trimmedName,
        category: itemCategory,
        quantity: itemQuantity || 1,
        notes: itemNotes,
        isPurchased: false,
        image: itemImage,
        prices: initialPrices,
        selectedStore: priceValue && priceValue > 0 ? (itemPriceStore || 'السعر المدخل') : undefined,
        createdAt: new Date().toISOString()
      }
      updatedItems = [...currentItems, newItem]
      // 📌 تحديث state و ref معاً
      itemsRef.current = updatedItems
      setItems(updatedItems)
      console.log('✅ تمت إضافة المنتج:', newItem.name, 'السعر:', initialPrices, 'إجمالي المنتجات:', updatedItems.length)
    }

    // إعادة تعيين الحقول
    setItemName('')
    setItemCategory('dairy')
    setItemQuantity('')
    setItemPrice('')
    setItemPriceStore('')
    setItemNotes('')
    setItemImage(null)
    setClassifiedCategory(null)
    setIsModalOpen(false)

    // 🚨 حفظ فوري على السيرفر لمنع فقدان البيانات
    console.log('🔍 حالة الحفظ:', { isLoggedIn, isDataLoaded, itemsCount: updatedItems.length })

    if (isLoggedIn && isDataLoaded) {
      try {
        console.log('💾 حفظ فوري بعد الإضافة/التعديل...', updatedItems.length, 'منتجات')

        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: updatedItems,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })

        if (response.ok) {
          console.log('✅ تم حفظ الإضافة/التعديل على السيرفر')
          showAlertMessage('✅ تم حفظ المنتج بنجاح')
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('⚠️ فشل حفظ الإضافة/التعديل على السيرفر:', response.status, errorData)

          if (response.status === 401) {
            showAlertMessage('⚠️ انتهت صلاحية الجلسة - يرجى تسجيل الدخول مجدداً')
            setIsLoggedIn(false)
            setCurrentUser(null)
          } else {
            showAlertMessage(`⚠️ فشل الحفظ: ${errorData.error || 'خطأ غير معروف'}`)
          }
        }
      } catch (error) {
        console.error('Save after add/edit error:', error)
        showAlertMessage('⚠️ فشل الحفظ - تحقق من اتصالك بالإنترنت')
      }
    } else {
      console.log('⚠️ لم يتم الحفظ - isLoggedIn:', isLoggedIn, 'isDataLoaded:', isDataLoaded)
      if (!isLoggedIn) {
        showAlertMessage('⚠️ يجب تسجيل الدخول للحفظ')
      } else if (!isDataLoaded) {
        showAlertMessage('⚠️ جاري تحميل البيانات - يرجى الانتظار')
      }
    }
  }

  // حذف غرض مع حفظ سعره في تتبع الأسعار
  const deleteItem = async (id: string) => {
    // 📌 استخدام itemsRef.current للحصول على أحدث البيانات
    const currentItems = itemsRef.current
    const item = currentItems.find(i => i.id === id)
    if (!item) return

    // حفظ السعر في تتبع الأسعار قبل الحذف
    let newPriceHistory = { ...priceHistoryRef.current }
    if (item.prices && item.prices.length > 0) {
      const productKey = item.name.toLowerCase().trim()
      const existingPrices = newPriceHistory[productKey] || []
      const newPrices = [...existingPrices]
      item.prices.forEach(price => {
        const exists = newPrices.some(p => p.store === price.store && p.price === price.price)
        if (!exists) {
          newPrices.push(price)
        }
      })
      newPriceHistory[productKey] = newPrices
      // 📌 تحديث state و ref معاً
      priceHistoryRef.current = newPriceHistory
      setPriceHistory(newPriceHistory)
    }

    // تحديث القائمة محلياً - 📌 استخدام currentItems بدلاً من items
    const newItems = currentItems.filter(i => i.id !== id)
    // 📌 تحديث state و ref معاً
    itemsRef.current = newItems
    setItems(newItems)

    // 🚨 حفظ فوري على السيرفر لمنع فقدان الحذف
    if (isLoggedIn && isDataLoaded) {
      try {
        console.log('🗑️ حفظ فوري بعد الحذف...', newItems.length, 'منتجات متبقية')

        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: newItems, // ⚠️ مهم: إرسال القائمة الجديدة (قد تكون فارغة)
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: newPriceHistory,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })

        if (response.ok) {
          console.log('✅ تم حفظ الحذف على السيرفر')
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('⚠️ فشل حفظ الحذف على السيرفر:', errorData)
          showAlertMessage('⚠️ فشل حفظ الحذف - تحقق من اتصالك بالإنترنت')
        }
      } catch (error) {
        console.error('Delete save error:', error)
        showAlertMessage('⚠️ فشل حفظ الحذف - تحقق من اتصالك بالإنترنت')
      }
    } else {
      console.log('⚠️ لم يتم الحفظ - isLoggedIn:', isLoggedIn, 'isDataLoaded:', isDataLoaded)
    }
  }

  // تبديل حالة الشراء
  const togglePurchased = async (id: string) => {
    // 📌 استخدام itemsRef.current للحصول على أحدث البيانات
    const currentItems = itemsRef.current
    const item = currentItems.find(i => i.id === id)
    if (!item) return
    
    // 📌 استخدام السعر المحدد (أو الأقل إذا لم يُحدد)
    const activePrice = getActivePrice(item)
    const itemPrice = activePrice ? activePrice.price * item.quantity : 0
    
    let newSpentAmount = spentAmountRef.current
    if (!item.isPurchased && itemPrice > 0) {
      newSpentAmount = newSpentAmount + itemPrice
    } else if (item.isPurchased && itemPrice > 0) {
      newSpentAmount = Math.max(0, newSpentAmount - itemPrice)
    }
    
    // 📌 تحديث states و refs معاً - استخدام currentItems
    const newItems = currentItems.map(it => 
      it.id === id ? { ...it, isPurchased: !it.isPurchased } : it
    )
    itemsRef.current = newItems
    setItems(newItems)
    
    spentAmountRef.current = newSpentAmount
    setSpentAmount(newSpentAmount)
    
    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: newItems,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: newSpentAmount,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
      } catch (error) {
        console.error('Toggle purchased save error:', error)
      }
    }
  }

  // فتح نموذج التعديل
  const openEditModal = (item: Item) => {
    setEditingItem(item)
    setItemName(item.name)
    setItemCategory(item.category)
    setItemQuantity(item.quantity)
    setItemNotes(item.notes)
    setItemImage(item.image)
    setIsModalOpen(true)
  }

  // إغلاق النموذج
  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setItemName('')
    setItemCategory('dairy')
    setItemQuantity('')
    setItemNotes('')
    setItemImage(null)
    setClassifiedCategory(null)
  }

  // تصفية الأغراض
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.notes.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'missing' && !item.isPurchased) ||
                         (filterStatus === 'purchased' && item.isPurchased)
    return matchesSearch && matchesCategory && matchesStatus
  })

  // جميع التصنيفات (افتراضية + مخصصة) - يجب أن يكون قبل groupedItems
  const allCategories = [
    ...categories,
    ...customCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    }))
  ]

  // تجميع الأغراض حسب التصنيف
  const groupedItems = allCategories.reduce((acc, cat) => {
    const categoryItems = filteredItems.filter(item => item.category === cat.id)
    if (categoryItems.length > 0) {
      acc[cat.id] = categoryItems
    }
    return acc
  }, {} as Record<string, Item[]>)

  // الحصول على معلومات التصنيف
  const getCategoryInfo = (categoryId: string) => {
    // البحث في التصنيفات الافتراضية
    const defaultCat = categories.find(c => c.id === categoryId)
    if (defaultCat) return defaultCat
    
    // البحث في التصنيفات المخصصة
    const customCat = customCategories.find(c => c.id === categoryId)
    if (customCat) {
      const colorMap: Record<string, { color: string; lightColor: string; textColor: string; borderColor: string }> = {
        'purple': { color: 'bg-purple-500', lightColor: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
        'blue': { color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
        'green': { color: 'bg-green-500', lightColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-200' },
        'red': { color: 'bg-red-500', lightColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-200' },
        'orange': { color: 'bg-orange-500', lightColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
        'pink': { color: 'bg-pink-500', lightColor: 'bg-pink-100', textColor: 'text-pink-700', borderColor: 'border-pink-200' },
        'teal': { color: 'bg-teal-500', lightColor: 'bg-teal-100', textColor: 'text-teal-700', borderColor: 'border-teal-200' },
        'indigo': { color: 'bg-indigo-500', lightColor: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' },
      }
      const colors = colorMap[customCat.color] || colorMap['purple']
      return {
        id: customCat.id,
        name: customCat.name,
        icon: customCat.icon,
        ...colors
      }
    }
    
    return categories[categories.length - 1] // 'other'
  }

  // إحصائيات
  const totalItems = items.length
  const missingItems = items.filter(i => !i.isPurchased).length
  const purchasedItems = items.filter(i => i.isPurchased).length

  // 🛡️ حساب السعر الإجمالي بأمان
  const totalPrice = items.reduce((sum, item) => {
    try {
      const activePrice = getActivePrice(item)
      if (activePrice && typeof activePrice.price === 'number' && typeof item.quantity === 'number') {
        const itemTotal = activePrice.price * item.quantity
        console.log('📊 حساب التكلفة:', item.name, 'السعر:', activePrice.price, 'الكمية:', item.quantity, 'المجموع:', itemTotal)
        return sum + itemTotal
      }
      return sum
    } catch {
      return sum
    }
  }, 0)

  console.log('💰 التكلفة الإجمالية:', totalPrice)

  // تصدير إلى PDF
  const exportToPDF = async () => {
    if (items.length === 0) return
    
    setIsExporting(true)
    
    try {
      const groupedItemsForExport: Record<string, Item[]> = {}
      for (const cat of allCategories) {
        const categoryItems = items.filter(item => item.category === cat.id)
        if (categoryItems.length > 0) {
          groupedItemsForExport[cat.id] = categoryItems
        }
      }

      const date = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      let tableRows = ''
      let rowNum = 1
      
      for (const [categoryId, categoryItems] of Object.entries(groupedItemsForExport)) {
        const categoryInfo = getCategoryInfo(categoryId)
        
        tableRows += `
          <tr style="background-color: #f0f9ff;">
            <td colspan="7" style="padding: 12px; font-weight: bold; font-size: 14px; text-align: right; border: 1px solid #e5e7eb;">
              ${categoryInfo.icon} ${categoryInfo.name} (${categoryItems.length})
            </td>
          </tr>
        `

        for (const item of categoryItems) {
          const statusIcon = item.isPurchased ? '✅' : '🛒'
          const statusText = item.isPurchased ? 'تم الشراء' : 'ناقص'
          const textDecoration = item.isPurchased ? 'text-decoration: line-through; color: #9ca3af;' : ''

          let priceText = '-'
          let totalText = '-'
          const activePrice = getActivePrice(item)
          if (activePrice) {
            priceText = `${activePrice.price.toFixed(2)} ر.س (${activePrice.store})`
            totalText = `${(activePrice.price * item.quantity).toFixed(2)} ر.س`
          }

          const notesText = item.notes ? item.notes : '-'

          tableRows += `
            <tr>
              <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${rowNum}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; ${textDecoration}">${item.name}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">${notesText}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${statusIcon} ${statusText}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${priceText}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb; font-weight: bold; color: #059669;">${totalText}</td>
            </tr>
          `
          rowNum++
        }
      }

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>مقاضي - قائمة المشتريات</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Tajawal', 'Arial', sans-serif; }
    body { margin: 0; padding: 20px; background: white; direction: rtl; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #10b981; }
    .header h1 { color: #1f2937; margin: 0 0 10px 0; font-size: 28px; }
    .header .date { color: #6b7280; font-size: 14px; }
    .stats { display: flex; justify-content: center; gap: 30px; margin-bottom: 30px; }
    .stat-box { padding: 15px 30px; border-radius: 10px; text-align: center; }
    .stat-box.total { background: #f3f4f6; }
    .stat-box.missing { background: #fef2f2; }
    .stat-box.purchased { background: #f0fdf4; }
    .stat-box.price { background: #eff6ff; }
    .stat-box .number { font-size: 32px; font-weight: bold; }
    .stat-box .label { font-size: 14px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #10b981; color: white; padding: 12px; text-align: center; font-weight: bold; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛒 مقاضي</h1>
    <div class="date">تاريخ الطباعة: ${date}</div>
  </div>
  <div class="stats">
    <div class="stat-box total">
      <div class="number">${totalItems}</div>
      <div class="label">إجمالي الأغراض</div>
    </div>
    <div class="stat-box missing">
      <div class="number" style="color: #dc2626;">${missingItems}</div>
      <div class="label">ناقص</div>
    </div>
    <div class="stat-box purchased">
      <div class="number" style="color: #16a34a;">${purchasedItems}</div>
      <div class="label">تم الشراء</div>
    </div>
    <div class="stat-box price">
      <div class="number" style="color: #2563eb;">${totalPrice.toFixed(2)}</div>
      <div class="label">ريال (تقديري)</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>اسم الغرض</th>
        <th style="width: 50px;">الكمية</th>
        <th style="width: 120px;">ملاحظات</th>
        <th style="width: 90px;">الحالة</th>
        <th style="width: 80px;">السعر</th>
        <th style="width: 90px;">المجموع</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">تم إنشاء هذه القائمة بواسطة تطبيق مقاضي</div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
</body>
</html>
        `)
        printWindow.document.close()
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // إضافة سعر جديد
  const handleAddPrice = async () => {
    let storeName = newPriceStore
    if (showCustomStoreInput && customStoreName.trim()) {
      storeName = customStoreName.trim()
      if (!allStores.includes(storeName)) {
        const newCustomStores = [...customStoresRef.current, storeName]
        customStoresRef.current = newCustomStores
        setCustomStores(newCustomStores)
      }
    }
    
    if (!selectedItemForPrice || !storeName || !newPriceAmount) return
    
    const priceValue = parseFloat(newPriceAmount)
    const productKey = selectedItemForPrice.name.toLowerCase().trim()
    
    // التحقق من وجود السعر مسبقاً في priceHistory
    const existingInHistory = priceHistoryRef.current[productKey] || []
    const duplicateInHistory = existingInHistory.some(p => 
      p.store === storeName && p.price === priceValue
    )
    
    // التحقق من وجود السعر مسبقاً في المنتج الحالي
    const existingInItem = selectedItemForPrice.prices || []
    const duplicateInItem = existingInItem.some(p => 
      p.store === storeName && p.price === priceValue
    )
    
    // إذا كان السعر موجوداً مسبقاً، لا تضفه
    if (duplicateInHistory && duplicateInItem) {
      showAlertMessage('⚠️ هذا السعر مسجل مسبقاً لنفس المتجر')
      return
    }
    
    const newPrice: PriceEntry = {
      store: storeName,
      price: priceValue,
      date: new Date().toISOString()
    }
    
    // 📌 تحديث items و ref معاً
    const updatedItems = itemsRef.current.map(item => {
      if (item.id === selectedItemForPrice.id) {
        const currentPrices = item.prices || []
        if (!currentPrices.some(p => p.store === storeName && p.price === priceValue)) {
          return { ...item, prices: [...currentPrices, newPrice] }
        }
        return item
      }
      return item
    })
    itemsRef.current = updatedItems
    setItems(updatedItems)
    
    // 📌 تحديث priceHistory و ref معاً
    const existingPrices = priceHistoryRef.current[productKey] || []
    if (!existingPrices.some(p => p.store === storeName && p.price === priceValue)) {
      const newPriceHistory = {
        ...priceHistoryRef.current,
        [productKey]: [...existingPrices, newPrice]
      }
      priceHistoryRef.current = newPriceHistory
      setPriceHistory(newPriceHistory)
    }
    
    setNewPriceStore('')
    setNewPriceAmount('')
    setShowCustomStoreInput(false)
    setCustomStoreName('')
    setIsPriceModalOpen(false)
    setSelectedItemForPrice(null)
    
    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: updatedItems,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
      } catch (error) {
        console.error('Add price save error:', error)
      }
    }
  }

  // حذف سعر
  const deletePrice = async (itemId: string, priceIndex: number) => {
    const item = itemsRef.current.find(i => i.id === itemId)
    const priceToDelete = item?.prices?.[priceIndex]
    
    // 📌 تحديث items و ref معاً
    const updatedItems = itemsRef.current.map(it => {
      if (it.id === itemId) {
        const currentPrices = it.prices || []
        return { ...it, prices: currentPrices.filter((_, i) => i !== priceIndex) }
      }
      return it
    })
    itemsRef.current = updatedItems
    setItems(updatedItems)
    
    if (item && priceToDelete) {
      const productKey = item.name.toLowerCase().trim()
      // 📌 تحديث priceHistory و ref معاً
      const existingPrices = priceHistoryRef.current[productKey] || []
      const updatedPrices = existingPrices.filter(p =>
        !(p.store === priceToDelete.store && p.price === priceToDelete.price)
      )
      const newPriceHistory = {
        ...priceHistoryRef.current,
        [productKey]: updatedPrices
      }
      priceHistoryRef.current = newPriceHistory
      setPriceHistory(newPriceHistory)
    }
    
    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: updatedItems,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
      } catch (error) {
        console.error('Delete price save error:', error)
      }
    }
  }

  // 🏪 الحصول على السعر النشط للمنتج
  const getActivePrice = (item: Item): { price: number; store: string } | null => {
    // 🛡️ فحص آمن للأسعار
    if (!item || !item.prices || !Array.isArray(item.prices) || item.prices.length === 0) {
      console.log('⚠️ getActivePrice: لا توجد أسعار لـ', item?.name)
      return null
    }

    console.log('🔍 getActivePrice للمنتج:', item.name, 'الأسعار:', item.prices)

    // إذا كان هناك متجر محدد، ابحث عن سعره
    if (item.selectedStore) {
      const selectedPrice = item.prices.find(p => p && p.store === item.selectedStore)
      if (selectedPrice && typeof selectedPrice.price === 'number') {
        console.log('✅ السعر المختار:', selectedPrice)
        return { price: selectedPrice.price, store: selectedPrice.store }
      }
    }

    // وإلا، أرجع أقل سعر
    try {
      const validPrices = item.prices.filter(p => p && typeof p.price === 'number')
      if (validPrices.length === 0) {
        console.log('⚠️ لا توجد أسعار صالحة')
        return null
      }

      const minPrice = validPrices.reduce((min, p) => {
        if (!min || p.price < min.price) return p
        return min
      }, validPrices[0])

      console.log('✅ أقل سعر:', minPrice)
      return { price: minPrice.price, store: minPrice.store }
    } catch (e) {
      console.error('getActivePrice error:', e)
      return null
    }
  }

  // 🔄 تغيير المتجر المختار للمنتج
  const selectItemStore = async (itemId: string, storeName: string) => {
    const updatedItems = itemsRef.current.map(it => {
      if (it.id === itemId) {
        return { ...it, selectedStore: storeName }
      }
      return it
    })
    itemsRef.current = updatedItems
    setItems(updatedItems)
    
    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: updatedItems,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
      } catch (error) {
        console.error('Select store save error:', error)
      }
    }
  }

  // 🗑️ حذف متجر مخصص
  const deleteCustomStore = async (storeName: string) => {
    // التحقق من عدم استخدام المتجر في أي منتج
    const itemsUsingStore = itemsRef.current.filter(item => 
      item.prices?.some(p => p.store === storeName)
    )
    
    if (itemsUsingStore.length > 0) {
      showAlertMessage(`⚠️ لا يمكن حذف "${storeName}" - مستخدم في ${itemsUsingStore.length} منتج`)
      return
    }
    
    // حذف المتجر
    const updatedStores = customStoresRef.current.filter(s => s !== storeName)
    customStoresRef.current = updatedStores
    setCustomStores(updatedStores)
    
    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsRef.current,
            familyMembers: familyMembersRef.current,
            customStores: updatedStores,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
        showAlertMessage(`✅ تم حذف "${storeName}" من المتاجر`)
      } catch (error) {
        console.error('Delete store error:', error)
      }
    }
    
    setStoreToDelete(null)
  }

  // ➕ إضافة متجر جديد
  const addCustomStore = async (storeName: string) => {
    if (!storeName.trim()) return
    if (allStores.includes(storeName.trim())) {
      showAlertMessage('⚠️ هذا المتجر موجود بالفعل')
      return
    }
    
    const updatedStores = [...customStoresRef.current, storeName.trim()]
    customStoresRef.current = updatedStores
    setCustomStores(updatedStores)
    
    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsRef.current,
            familyMembers: familyMembersRef.current,
            customStores: updatedStores,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
        showAlertMessage(`✅ تم إضافة "${storeName}" إلى المتاجر`)
      } catch (error) {
        console.error('Add store error:', error)
      }
    }
  }

  // فتح نافذة تعديل منتج في تتبع الأسعار
  const openEditPriceProduct = (productName: string, prices: PriceEntry[]) => {
    setEditingPriceProductName(productName)
    setEditingPriceData({ newName: productName, prices: [...prices] })
    setIsEditPriceModalOpen(true)
  }

  // تحديث سعر معين في المنتج المُعدّل
  const updatePriceInEdit = (index: number, field: 'store' | 'price', value: string | number) => {
    if (!editingPriceData) return
    const updatedPrices = [...editingPriceData.prices]
    if (field === 'store') {
      updatedPrices[index] = { ...updatedPrices[index], store: value as string }
    } else {
      updatedPrices[index] = { ...updatedPrices[index], price: value as number }
    }
    setEditingPriceData({ ...editingPriceData, prices: updatedPrices })
  }

  // إضافة سعر جديد للمنتج المُعدّل
  const addPriceInEdit = () => {
    if (!editingPriceData) return
    const newPrice: PriceEntry = {
      store: '',
      price: 0,
      date: new Date().toISOString().split('T')[0]
    }
    setEditingPriceData({ ...editingPriceData, prices: [...editingPriceData.prices, newPrice] })
  }

  // حذف سعر من المنتج المُعدّل
  const removePriceInEdit = (index: number) => {
    if (!editingPriceData) return
    const updatedPrices = editingPriceData.prices.filter((_, i) => i !== index)
    setEditingPriceData({ ...editingPriceData, prices: updatedPrices })
  }

  // حفظ تعديلات المنتج
  const savePriceProductEdit = async () => {
    if (!editingPriceProductName || !editingPriceData) return
    if (!editingPriceData.newName.trim()) return

    // 📌 تحديث priceHistory و ref معاً
    const newPriceHistory = { ...priceHistoryRef.current }
    // حذف المفتاح القديم إذا تم تغيير الاسم
    if (editingPriceProductName !== editingPriceData.newName.trim()) {
      delete newPriceHistory[editingPriceProductName]
    }
    // حفظ بالاسم الجديد
    newPriceHistory[editingPriceData.newName.trim().toLowerCase()] = editingPriceData.prices.filter(p => p.store && p.price > 0)
    priceHistoryRef.current = newPriceHistory
    setPriceHistory(newPriceHistory)

    // 📌 تحديث items و ref معاً
    let newItems = itemsRef.current
    if (editingPriceProductName !== editingPriceData.newName.trim()) {
      newItems = itemsRef.current.map(item =>
        item.name.toLowerCase() === editingPriceProductName
          ? { ...item, name: editingPriceData.newName.trim() }
          : item
      )
      itemsRef.current = newItems
      setItems(newItems)
    }

    setIsEditPriceModalOpen(false)
    setEditingPriceProductName(null)
    setEditingPriceData(null)

    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: newItems,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: newPriceHistory,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
        console.log('✅ تم حفظ تعديلات المنتج على السيرفر')
      } catch (error) {
        console.error('Save price product edit error:', error)
        showAlertMessage('⚠️ فشل الحفظ - تحقق من اتصالك بالإنترنت')
      }
    }
  }

  // حذف منتج كامل من ذاكرة الأسعار
  const deletePriceProduct = async (productName: string) => {
    if (!confirm(`هل تريد حذف "${productName}" من ذاكرة الأسعار؟`)) return

    // 📌 تحديث priceHistory و ref معاً
    const newPriceHistory = { ...priceHistoryRef.current }
    delete newPriceHistory[productName]
    priceHistoryRef.current = newPriceHistory
    setPriceHistory(newPriceHistory)

    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsRef.current,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: newPriceHistory,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
        console.log('✅ تم حذف المنتج من ذاكرة الأسعار على السيرفر')
      } catch (error) {
        console.error('Delete price product error:', error)
        showAlertMessage('⚠️ فشل الحفظ - تحقق من اتصالك بالإنترنت')
      }
    }
  }

  // 🧹 تنظيف الأسعار المكررة من ذاكرة الأسعار
  const cleanupDuplicatePrices = async () => {
    let totalRemoved = 0
    let productsCleaned = 0

    // 📌 تحديث priceHistory و ref معاً
    const newState: Record<string, PriceEntry[]> = {}

    for (const [productName, prices] of Object.entries(priceHistoryRef.current)) {
      const uniquePrices: PriceEntry[] = []
      const seen = new Set<string>()

      for (const price of prices) {
        // إنشاء مفتاح فريد من المتجر والسعر
        const key = `${price.store}|${price.price}`

        if (!seen.has(key)) {
          seen.add(key)
          uniquePrices.push(price)
        } else {
          totalRemoved++
        }
      }

      if (uniquePrices.length !== prices.length) {
        productsCleaned++
      }

      newState[productName] = uniquePrices
    }

    priceHistoryRef.current = newState
    setPriceHistory(newState)

    if (totalRemoved > 0) {
      showAlertMessage(`✅ تم حذف ${totalRemoved} سعر مكرر من ${productsCleaned} منتج`)
    } else {
      showAlertMessage('✅ لا توجد أسعار مكررة')
    }

    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsRef.current,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: newState,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
        console.log('✅ تم حفظ تنظيف الأسعار المكررة على السيرفر')
      } catch (error) {
        console.error('Cleanup duplicate prices error:', error)
        showAlertMessage('⚠️ فشل الحفظ - تحقق من اتصالك بالإنترنت')
      }
    }
  }

  // إنشاء فرد عائلة جديد
  const createNewFamilyMember = async (name: string) => {
    const newMember: UserProfile = {
      id: generateId(),
      name: name,
      email: '',
      avatar: '👤',
    }
    
    // 📌 تحديث state و ref معاً
    const updatedMembers = [...familyMembersRef.current, newMember]
    familyMembersRef.current = updatedMembers
    setFamilyMembers(updatedMembers)
    
    // تحديث shoppingTurn إذا كان الأول
    const newShoppingTurn = shoppingTurnRef.current || newMember.id
    if (!shoppingTurnRef.current) {
      shoppingTurnRef.current = newShoppingTurn
      setShoppingTurn(newShoppingTurn)
    }
    
    setIsFamilyModalOpen(false)
    
    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        console.log('💾 حفظ فوري بعد إضافة فرد العائلة...', updatedMembers.length, 'أعضاء')
        
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsRef.current,
            familyMembers: updatedMembers,
            customStores: customStoresRef.current,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: newShoppingTurn
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
        
        if (response.ok) {
          console.log('✅ تم حفظ فرد العائلة على السيرفر')
        } else {
          console.error('⚠️ فشل حفظ فرد العائلة على السيرفر')
          showAlertMessage('⚠️ فشل الحفظ - تحقق من اتصالك بالإنترنت')
        }
      } catch (error) {
        console.error('Create family member save error:', error)
        showAlertMessage('⚠️ فشل الحفظ - تحقق من اتصالك بالإنترنت')
      }
    }
  }

  // تبديل المستخدم النشط (من العائلة)
  const switchActiveMember = async (member: UserProfile) => {
    // 📌 تحديث state و ref معاً
    shoppingTurnRef.current = member.id
    setShoppingTurn(member.id)
    setCurrentUser(prev => ({ ...prev!, name: member.name, avatar: member.avatar }))
    setIsUserModalOpen(false)
    
    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsRef.current,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: member.id
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
      } catch (error) {
        console.error('Switch member save error:', error)
      }
    }
  }

  // تحويل الدور للشخص التالي
  const passTurnToNext = async (currentMemberId: string) => {
    if (familyMembersRef.current.length <= 1) return
    
    const currentIndex = familyMembersRef.current.findIndex(m => m.id === currentMemberId)
    const nextIndex = (currentIndex + 1) % familyMembersRef.current.length
    const nextMember = familyMembersRef.current[nextIndex]
    
    // 📌 تحديث state و ref معاً
    shoppingTurnRef.current = nextMember.id
    setShoppingTurn(nextMember.id)
    setCurrentUser(prev => ({ ...prev!, name: nextMember.name, avatar: nextMember.avatar }))
    setShowTurnNotification(true)
    
    // تنظيف الـ timeout السابق
    if (turnNotificationTimeoutRef.current) {
      clearTimeout(turnNotificationTimeoutRef.current)
    }
    turnNotificationTimeoutRef.current = setTimeout(() => setShowTurnNotification(false), 3000)
    
    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsRef.current,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: nextMember.id
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
      } catch (error) {
        console.error('Pass turn save error:', error)
      }
    }
  }

  // الحصول على صاحب الدور الحالي
  const getCurrentTurnMember = () => {
    if (!shoppingTurn || familyMembers.length === 0) return null
    return familyMembers.find(m => m.id === shoppingTurn) || null
  }

  // الحصول على أفضل سعر
  const getBestPrice = (item: Item) => {
    return getActivePrice(item)
  }

  // إنشاء تصنيف مخصص جديد
  const createCustomCategory = () => {
    // 🛡️ حماية: لا تحفظ إذا لم يتم تحميل البيانات
    if (!isDataLoaded || !isLoggedIn) {
      showAlertMessage('يرجى الانتظار حتى يتم تحميل البيانات')
      return
    }

    if (!newCategoryName.trim()) return

    const newCategory: CustomCategory = {
      id: 'custom_' + generateId(),
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      color: newCategoryColor,
      keywords: newCategoryKeywords.split(',').map(k => k.trim()).filter(k => k)
    }

    // 📌 تحديث customCategories و ref معاً
    const updatedCategories = [...customCategoriesRef.current, newCategory]
    customCategoriesRef.current = updatedCategories
    setCustomCategories(updatedCategories)

    // حفظ فوري على السيرفر (البيانات محمية في الـ API)
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: itemsRef.current,
        familyMembers: familyMembersRef.current,
        customStores: customStoresRef.current,
        priceHistory: priceHistoryRef.current,
        budget: {
          monthlyBudget: monthlyBudgetRef.current,
          spentAmount: spentAmountRef.current,
          startDate: budgetStartDateRef.current,
          shoppingTurn: shoppingTurnRef.current
        },
        customCategories: updatedCategories,
        savedProductNames: savedProductNamesRef.current
      })
    }).then(() => {
      console.log('✅ تم حفظ التصنيف الجديد')
    }).catch(err => {
      console.error('خطأ في حفظ التصنيف:', err)
      showAlertMessage('حدث خطأ في حفظ التصنيف')
    })

    setNewCategoryName('')
    setNewCategoryIcon('📦')
    setNewCategoryColor('purple')
    setNewCategoryKeywords('')
    setIsCategoryModalOpen(false)
  }

  // حذف تصنيف مخصص
  const deleteCustomCategory = async (categoryId: string) => {
    // 🛡️ حماية: لا تحفظ إذا لم يتم تحميل البيانات
    if (!isDataLoaded || !isLoggedIn) {
      showAlertMessage('يرجى الانتظار حتى يتم تحميل البيانات')
      return
    }

    // 📌 تحديث customCategories و ref معاً
    const updatedCategories = customCategoriesRef.current.filter(c => c.id !== categoryId)
    customCategoriesRef.current = updatedCategories
    setCustomCategories(updatedCategories)

    // تحويل الأغراض في هذا التصنيف إلى 'other'
    const updatedItems = itemsRef.current.map(item =>
      item.category === categoryId ? { ...item, category: 'other' } : item
    )
    itemsRef.current = updatedItems
    setItems(updatedItems)

    // 🚨 حفظ فوري على السيرفر
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems,
          familyMembers: familyMembersRef.current,
          customStores: customStoresRef.current,
          priceHistory: priceHistoryRef.current,
          budget: {
            monthlyBudget: monthlyBudgetRef.current,
            spentAmount: spentAmountRef.current,
            startDate: budgetStartDateRef.current,
            shoppingTurn: shoppingTurnRef.current
          },
          customCategories: updatedCategories,
          savedProductNames: savedProductNamesRef.current
        })
      })
      console.log('✅ تم حذف التصنيف')
    } catch (err) {
      console.error('خطأ في حذف التصنيف:', err)
      showAlertMessage('حدث خطأ في حذف التصنيف')
    }
  }

  // حذف فرد من العائلة
  const deleteFamilyMember = async (memberId: string) => {
    if (familyMembersRef.current.length <= 1) {
      alert('لا يمكن حذف العضو الأخير')
      return
    }
    
    // 📌 تحديث familyMembers و ref معاً
    const updatedMembers = familyMembersRef.current.filter(m => m.id !== memberId)
    familyMembersRef.current = updatedMembers
    setFamilyMembers(updatedMembers)
    
    let newShoppingTurn = shoppingTurnRef.current
    if (shoppingTurnRef.current === memberId) {
      const nextMember = updatedMembers[0]
      newShoppingTurn = nextMember.id
      shoppingTurnRef.current = newShoppingTurn
      setShoppingTurn(newShoppingTurn)
      setCurrentUser(prev => ({ ...prev!, name: nextMember.name, avatar: nextMember.avatar }))
    }
    
    // 🚨 حفظ فوري على السيرفر
    if (isLoggedIn && isDataLoaded) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsRef.current,
            familyMembers: updatedMembers,
            customStores: customStoresRef.current,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: newShoppingTurn
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
      } catch (error) {
        console.error('Delete family member save error:', error)
      }
    }
  }

  // ===== Drag and Drop Functions =====
  const handleDragStart = (e: React.DragEvent, item: Item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, item: Item) => {
    e.preventDefault()
    if (draggedItem && item.id !== draggedItem.id) {
      setDragOverItem(item)
    }
  }

  const handleDragEnd = async () => {
    if (draggedItem && dragOverItem) {
      const newItems = [...itemsRef.current]
      const draggedIndex = newItems.findIndex(i => i.id === draggedItem.id)
      const overIndex = newItems.findIndex(i => i.id === dragOverItem.id)
      
      // تبديل المواضع
      const [removed] = newItems.splice(draggedIndex, 1)
      newItems.splice(overIndex, 0, removed)
      
      // 📌 تحديث state و ref معاً
      itemsRef.current = newItems
      setItems(newItems)
      
      // 🚨 حفظ فوري على السيرفر
      if (isLoggedIn && isDataLoaded) {
        try {
          await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: newItems,
              familyMembers: familyMembersRef.current,
              customStores: customStoresRef.current,
              priceHistory: priceHistoryRef.current,
              budget: {
                monthlyBudget: monthlyBudgetRef.current,
                spentAmount: spentAmountRef.current,
                startDate: budgetStartDateRef.current,
                shoppingTurn: shoppingTurnRef.current
              },
              customCategories: customCategoriesRef.current,
              savedProductNames: savedProductNamesRef.current
            })
          })
        } catch (error) {
          console.error('Drag end save error:', error)
        }
      }
    }
    setDraggedItem(null)
    setDragOverItem(null)
  }

  // ===== Receipt Scanning Functions =====
  const handleScanImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type)
    
    // التحقق من حجم الملف (أقل من 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setScanError('حجم الصورة كبير جداً. اختر صورة أصغر من 10MB')
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (!dataUrl) {
        setScanError('فشل في قراءة الصورة')
        return
      }
      
      console.log('Image loaded, size:', dataUrl.length)
      
      // ضغط الصورة
      const img = new Image()
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            // إذا فشل canvas، استخدم الصورة الأصلية
            console.log('Canvas not available, using original')
            setScannedImage(dataUrl)
            return
          }
          
          // تحديد الحد الأقصى للأبعاد
          const maxDimension = 1500
          let width = img.width
          let height = img.height
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width
              width = maxDimension
            } else {
              width = (width * maxDimension) / height
              height = maxDimension
            }
          }
          
          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)
          
          // تحويل إلى base64
          const compressedImage = canvas.toDataURL('image/jpeg', 0.8)
          console.log('Compressed size:', compressedImage.length)
          
          setScannedImage(compressedImage)
        } catch (err) {
          console.error('Compression error:', err)
          // استخدم الصورة الأصلية إذا فشل الضغط
          setScannedImage(dataUrl)
        }
      }
      
      img.onerror = () => {
        console.error('Image load error')
        setScanError('فشل في تحميل الصورة')
      }
      
      img.src = dataUrl
    }
    
    reader.onerror = () => {
      console.error('FileReader error')
      setScanError('فشل في قراءة الملف')
    }
    
    reader.readAsDataURL(file)
  }

  const scanReceipt = async () => {
    if (!scannedImage) return
    
    setIsScanning(true)
    setScanError('')
    
    try {
      console.log('Sending image for scanning, size:', scannedImage.length)
      
      // التحقق من حجم الصورة
      if (scannedImage.length > 5 * 1024 * 1024) {
        setScanError('حجم الصورة كبير جداً. اختر صورة أصغر.')
        setIsScanning(false)
        return
      }
      
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: scannedImage })
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'خطأ في الخادم' }))
        throw new Error(errorData.error || `خطأ ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Scan response:', data)
      
      if (data.success && data.items && data.items.length > 0) {
        setScannedItems(data.items)
      } else {
        setScanError(data.error || 'لم نتمكن من قراءة الفاتورة')
      }
    } catch (error: any) {
      console.error('Scan error:', error)
      
      // تحسين رسائل الخطأ
      let errorMsg = 'حدث خطأ غير متوقع'
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMsg = 'فشل الاتصال بالخادم. تحقق من الاتصال بالإنترنت.'
      } else if (error.message) {
        errorMsg = error.message
      }
      
      setScanError(errorMsg)
    } finally {
      setIsScanning(false)
    }
  }

  const addScannedItems = () => {
    // التحقق من المنتجات المكررة
    const duplicateItems: string[] = []
    const uniqueItems = scannedItems.filter(item => {
      const exists = items.some(existing => 
        existing.name.toLowerCase().trim() === item.name.toLowerCase().trim()
      )
      if (exists) {
        duplicateItems.push(item.name)
        return false
      }
      return true
    })

    // إظهار رسالة إذا كان هناك منتجات مكررة
    if (duplicateItems.length > 0) {
      showAlertMessage(`⚠️ المنتجات التالية موجودة مسبقاً:\n${duplicateItems.join('، ')}`)
    }

    if (uniqueItems.length === 0) {
      setScannedItems([])
      setScannedImage(null)
      setIsScanModalOpen(false)
      return
    }

    const newItems = uniqueItems.map((item, index) => ({
      id: generateId(),
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      notes: '',
      isPurchased: false,
      image: null,
      prices: item.price > 0 ? [{ store: 'فاتورة ممسوحة', price: item.price, date: new Date().toISOString() }] : [],
      createdAt: new Date().toISOString()
    }))

    // 📌 تحديث items و ref معاً
    const updatedItems = [...itemsRef.current, ...newItems]
    itemsRef.current = updatedItems
    setItems(updatedItems)

    // إضافة الأسعار إلى تتبع الأسعار تلقائياً
    const newPriceHistory: Record<string, PriceEntry[]> = {}
    scannedItems.forEach(item => {
      if (item.price > 0) {
        const productKey = item.name.toLowerCase().trim()
        const newPrice: PriceEntry = {
          store: 'فاتورة ممسوحة',
          price: item.price,
          date: new Date().toISOString()
        }
        if (!newPriceHistory[productKey]) {
          newPriceHistory[productKey] = []
        }
        newPriceHistory[productKey].push(newPrice)
      }
    })

    // دمج الأسعار الجديدة مع القديمة وحفظها فوراً
    // 📌 استخدام refs للبيانات
    if (Object.keys(newPriceHistory).length > 0) {
      const currentPriceHistory = priceHistoryRef.current
      const updatedPriceHistory = { ...currentPriceHistory }
      Object.entries(newPriceHistory).forEach(([key, prices]) => {
        if (!updatedPriceHistory[key]) {
          updatedPriceHistory[key] = []
        }
        prices.forEach(newPrice => {
          const exists = updatedPriceHistory[key].some(p => p.store === newPrice.store && p.price === newPrice.price)
          if (!exists) {
            updatedPriceHistory[key] = [...updatedPriceHistory[key], newPrice]
          }
        })
      })
      
      // 📌 تحديث priceHistory و ref معاً
      priceHistoryRef.current = updatedPriceHistory
      setPriceHistory(updatedPriceHistory)

      // حفظ فوري للبيانات على السيرفر - 📌 استخدام refs
      if (isLoggedIn && isDataLoaded) {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: updatedItems,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: updatedPriceHistory,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        }).then(() => {
          console.log('✅ تم حفظ الأسعار على السيرفر')
        }).catch(err => {
          console.error('خطأ في حفظ الأسعار:', err)
        })
      }
    } else {
      // حفظ الأغراض حتى لو لم تكن هناك أسعار - 📌 استخدام refs
      if (isLoggedIn && isDataLoaded) {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: updatedItems,
            familyMembers: familyMembersRef.current,
            customStores: customStoresRef.current,
            priceHistory: priceHistoryRef.current,
            budget: {
              monthlyBudget: monthlyBudgetRef.current,
              spentAmount: spentAmountRef.current,
              startDate: budgetStartDateRef.current,
              shoppingTurn: shoppingTurnRef.current
            },
            customCategories: customCategoriesRef.current,
            savedProductNames: savedProductNamesRef.current
          })
        })
      }
    }

    setScannedItems([])
    setScannedImage(null)
    setIsScanModalOpen(false)
  }

  // حذف منتج من القائمة الممسوحة
  const removeScannedItem = (index: number) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index))
  }

  // تعديل منتج في القائمة الممسوحة مع إعادة التصنيف التلقائي
  const updateScannedItem = (index: number, field: 'name' | 'quantity' | 'price', value: string | number) => {
    setScannedItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value }
        // إعادة التصنيف عند تغيير الاسم
        if (field === 'name' && typeof value === 'string') {
          updatedItem.category = classifyProduct(value)
        }
        return updatedItem
      }
      return item
    }))
  }

  // ===== Family Functions =====
  const createFamily = async () => {
    if (isFamilyLoading) return
    setIsFamilyLoading(true)
    try {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name: familyName })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setFamily(data.family)
        setIsFamilyModalOpen(false)
        setFamilyName('')
        showAlertMessage('✅ تم إنشاء العائلة بنجاح')
      } else {
        showAlertMessage(data.error || 'حدث خطأ')
      }
    } catch (error) {
      showAlertMessage('حدث خطأ أثناء إنشاء العائلة')
    }
    setIsFamilyLoading(false)
  }

  const joinFamily = async () => {
    if (isFamilyLoading) return
    setIsFamilyLoading(true)
    try {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', inviteCode })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setFamily(data.family)
        setIsFamilyModalOpen(false)
        setInviteCode('')
        showAlertMessage('✅ تم الانضمام للعائلة بنجاح')
      } else {
        showAlertMessage(data.error || 'حدث خطأ')
      }
    } catch (error) {
      showAlertMessage('حدث خطأ أثناء الانضمام للعائلة')
    }
    setIsFamilyLoading(false)
  }

  const inviteToFamily = async () => {
    try {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite', email: inviteEmail })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`تم إنشاء الدعوة! الرابط: ${data.inviteLink}`)
        setInviteEmail('')
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert('حدث خطأ')
    }
  }

  const leaveFamily = async () => {
    if (!confirm('هل تريد مغادرة العائلة؟')) return
    
    try {
      await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave' })
      })
      setFamily(null)
    } catch (error) {
      alert('حدث خطأ')
    }
  }

  // تحميل بيانات العائلة
  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/family')
        .then(res => res.json())
        .then(data => {
          if (data.family) setFamily(data.family)
        })
        .catch(console.error)
    }
  }, [isLoggedIn])

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* تنبيه المنتج المكرر */}
      {showAlert && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            color: '#92400e',
            padding: '16px 24px',
            borderRadius: '12px',
            zIndex: 999999,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            maxWidth: '90%',
            textAlign: 'center',
            fontWeight: '500',
            fontSize: '16px'
          }}
        >
          {alertMessage.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {/* شريط التاريخ المحسن */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-800 dark:via-teal-900 dark:to-emerald-900 text-white py-3 relative overflow-hidden">
        {/* تأثير الزخرفة */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-sm relative">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <span className="text-lg">📅</span>
              <span className="font-medium" suppressHydrationWarning>{gregorianDate || '...'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <span className="text-lg">🌙</span>
              <span className="font-medium" suppressHydrationWarning>{hijriDate || '...'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* زر المزامنة اليدوية */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`p-2 rounded-full transition-all duration-300 backdrop-blur-sm relative ${
                isSyncing
                  ? 'bg-emerald-500/20 cursor-wait'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              suppressHydrationWarning
              title={lastSyncTime ? `آخر مزامنة: ${lastSyncTime.toLocaleTimeString('ar-SA')}` : 'مزامنة الآن'}
            >
              <span className={`text-lg ${isSyncing ? 'animate-spin' : ''}`}>
                {isSyncing ? '⏳' : '🔄'}
              </span>
              {/* مؤشر الحفظ الصغير */}
              {isSaving && !isSyncing && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              )}
            </button>

            {/* زر التحقق من التحديثات */}
            <button
              onClick={() => checkForUpdates(true)}
              disabled={isCheckingUpdate}
              className={`p-2 rounded-full transition-all duration-300 backdrop-blur-sm relative ${
                currentVersion !== latestVersion && latestVersion !== '0.0.0'
                  ? 'bg-blue-500/20 hover:bg-blue-500/30'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              title={currentVersion !== latestVersion && latestVersion !== '0.0.0' 
                ? `تحديث جديد متاح (${latestVersion})` 
                : `الإصدار ${currentVersion}`}
            >
              <span className={`text-lg ${isCheckingUpdate ? 'animate-pulse' : ''}`}>
                {currentVersion !== latestVersion && latestVersion !== '0.0.0' ? '🔔' : '📋'}
              </span>
              {/* مؤشر التحديث المتاح */}
              {currentVersion !== latestVersion && latestVersion !== '0.0.0' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
                  <span className="absolute inset-0 bg-red-400 rounded-full animate-ping"></span>
                </span>
              )}
            </button>

            {/* زر الوضع الليلي */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
              suppressHydrationWarning
              title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              <span className="text-lg">{isDarkMode ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* الهيدر المحسن */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="text-4xl animate-float">🛒</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  مقاضي
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400" suppressHydrationWarning>
                  {isLoaded && isLoggedIn && currentUser 
                    ? `مرحباً، ${currentUser.name}` 
                    : 'تصنيف ذكي وتنظيم تلقائي'}
                  <span className="text-xs text-slate-400 dark:text-slate-500 mr-2">v{APP_VERSION}</span>
                </p>
              </div>
              {shoppingTurn && getCurrentTurnMember() && (
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm animate-fade-in">
                  <span className="text-lg">🛒</span>
                  <span>الدور: {getCurrentTurnMember()?.name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isLoggedIn ? (
                <>
                  {/* زر إضافة */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    onTouchStart={() => setIsModalOpen(true)}
                    style={{
                      background: 'linear-gradient(to right, #10b981, #14b8a6)',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>+</span>
                    <span>إضافة</span>
                  </button>

                  {/* زر المستخدم */}
                  <button
                    onClick={() => setIsUserModalOpen(true)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                    suppressHydrationWarning
                  >
                    <span className="text-xl">{currentUser?.avatar || '👤'}</span>
                    <span className="hidden sm:inline">{currentUser?.name || 'مستخدم'}</span>
                  </button>

                  {/* زر مسح الفاتورة */}
                  <button
                    onClick={() => setIsScanModalOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-purple-200/50 dark:shadow-purple-900/30 transition-all flex items-center gap-2 hover:shadow-xl hover:-translate-y-0.5"
                    suppressHydrationWarning
                    title="مسح فاتورة"
                  >
                    <span className="text-xl">📸</span>
                    <span className="hidden md:inline">مسح</span>
                  </button>

                  {/* زر العائلة */}
                  <button
                    onClick={() => setIsFamilyModalOpen(true)}
                    className={`transition-all px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:shadow-xl hover:-translate-y-0.5 ${
                      familyMembers.length > 0
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    suppressHydrationWarning
                    title="العائلة"
                  >
                    <span className="text-xl">{familyMembers.length > 0 ? '👨‍👩‍👧‍👦' : '👥'}</span>
                    <span className="hidden md:inline">{familyMembers.length > 0 ? familyMembers.length : 'عائلتي'}</span>
                  </button>

                  {/* زر حفظ PDF */}
                  {items.length > 0 && (
                    <button
                      onClick={exportToPDF}
                      disabled={isExporting}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30 transition-all flex items-center gap-2 hover:shadow-xl hover:-translate-y-0.5 disabled:translate-y-0"
                      suppressHydrationWarning
                    >
                      {isExporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">جاري...</span>
                        </>
                      ) : (
                        <>
                          <span>📄</span>
                          <span className="hidden sm:inline">PDF</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 transition-all flex items-center gap-2 hover:shadow-xl hover:-translate-y-0.5"
                    suppressHydrationWarning
                  >
                    <span>🔐</span>
                    <span>تسجيل الدخول</span>
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
                    className="bg-white dark:bg-slate-800 border-2 border-emerald-500 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 hover:shadow-lg"
                    suppressHydrationWarning
                  >
                    <span>📝</span>
                    <span>إنشاء حساب</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* محتوى غير مسجل الدخول */}
      {isLoaded && !isLoggedIn && (
        <div className="max-w-6xl mx-auto px-4 py-20 text-center animate-fade-in">
          <div className="relative inline-block mb-8">
            <span className="text-7xl animate-float">🏠</span>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
              ?
            </div>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
            مرحباً بك في مقاضي
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
            نظم قائمة مشترياتك بذكاء، تتبع الأسعار، وأدر ميزانية عائلتك بسهولة.
            سجل الدخول أو أنشئ حساباً جديداً للبدء.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 rounded-2xl font-medium shadow-xl shadow-emerald-200/50 dark:shadow-emerald-900/30 transition-all hover:shadow-2xl hover:-translate-y-1"
              suppressHydrationWarning
            >
              📝 إنشاء حساب جديد
            </button>
            <button
              onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
              className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-8 py-4 rounded-2xl font-medium shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              suppressHydrationWarning
            >
              🔐 تسجيل الدخول
            </button>
          </div>

          {/* توقيع المصمم */}
          <div className="mt-16 pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-emerald-500">✦</span>
                صُمّم بواسطة
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  رشيد الحربي
                </span>
                <span className="text-emerald-500">✦</span>
              </span>
            </p>
          </div>
        </div>
      )}

      {/* محتوى مسجل الدخول */}
      {isLoggedIn && (
        <>
          {/* التبويبات */}
          <div className="max-w-6xl mx-auto px-4 pt-4">
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('items')}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === 'items' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                suppressHydrationWarning
              >
                📋 الأغراض
                {activeTab === 'items' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('prices')}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === 'prices' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                suppressHydrationWarning
              >
                💰 تتبع الأسعار
                {activeTab === 'prices' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('family')}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === 'family' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                suppressHydrationWarning
              >
                👥 العائلة (<span suppressHydrationWarning>{familyMembers.length}</span>)
                {activeTab === 'family' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></span>
                )}
              </button>
            </div>
          </div>

          {/* محتوى الأغراض */}
          {activeTab === 'items' && (
            <>
              {/* الإحصائيات المحسنة */}
              <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 card-hover animate-fade-in" style={{ animationDelay: '0ms' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center shadow-inner">
                        <span className="text-2xl">📋</span>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">إجمالي</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalItems}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 card-hover animate-fade-in" style={{ animationDelay: '50ms' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-xl flex items-center justify-center shadow-inner">
                        <span className="text-2xl">🛒</span>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">ناقص</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{missingItems}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 card-hover animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl flex items-center justify-center shadow-inner">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">تم الشراء</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{purchasedItems}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 card-hover animate-fade-in" style={{ animationDelay: '150ms' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center shadow-inner">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">التكلفة</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalPrice.toFixed(0)} <span className="text-sm">ر.س</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* بطاقة الميزانية */}
                <div className="bg-gradient-to-r from-white to-emerald-50/30 dark:from-slate-800/50 dark:to-emerald-900/10 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <span>💰</span> ميزانية الشهر
                    </h3>
                    <button
                      onClick={() => setIsBudgetModalOpen(true)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      suppressHydrationWarning
                    >
                      {monthlyBudget === 0 ? 'تحديد الميزانية' : 'تعديل'}
                    </button>
                  </div>

                  {monthlyBudget === 0 ? (
                    <div className="text-center py-6">
                      <span className="text-4xl mb-3 block">💵</span>
                      <p className="text-slate-500 mb-3">لم يتم تحديد ميزانية شهرية</p>
                      <button
                        onClick={() => setIsBudgetModalOpen(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                        suppressHydrationWarning
                      >
                        تحديد الميزانية
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500 dark:text-slate-400">المصروفات</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">{spentAmount.toFixed(0)} / {monthlyBudget} ر.س</span>
                      </div>
                      <div className="w-full h-5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3 shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            spentAmount > monthlyBudget
                              ? 'bg-gradient-to-r from-red-400 to-red-600'
                              : spentAmount / monthlyBudget > 0.8
                                ? 'bg-gradient-to-r from-orange-400 to-red-500'
                                : spentAmount / monthlyBudget > 0.5
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                  : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                          }`}
                          style={{ width: `${Math.min(100, (spentAmount / monthlyBudget) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={`font-medium ${
                          spentAmount > monthlyBudget
                            ? 'text-red-500'
                            : spentAmount / monthlyBudget > 0.8
                              ? 'text-orange-500'
                              : spentAmount / monthlyBudget > 0.5
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                        }`}>
                          {spentAmount > monthlyBudget
                            ? '⚠️ تجاوز الميزانية!'
                            : spentAmount / monthlyBudget > 0.8
                              ? '⚡ قريب من الحد!'
                              : `✓ متبقي: ${(monthlyBudget - spentAmount).toFixed(0)} ر.س`}
                        </span>
                        <span className={`font-bold ${
                          spentAmount > monthlyBudget
                            ? 'text-red-500'
                            : spentAmount / monthlyBudget > 0.8
                              ? 'text-orange-500'
                              : spentAmount / monthlyBudget > 0.5
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                        }`}>
                          {Math.round((spentAmount / monthlyBudget) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* شريط البحث والفلترة */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="🔍 بحث في الأغراض..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                      />
                    </div>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 bg-white"
                    >
                      <option value="all">جميع التصنيفات</option>
                      <optgroup label="التصنيفات الأساسية">
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                        ))}
                      </optgroup>
                      {customCategories.length > 0 && (
                        <optgroup label="تصنيفاتي المخصصة">
                          {customCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 bg-white"
                    >
                      <option value="all">الكل</option>
                      <option value="missing">🛒 ناقص</option>
                      <option value="purchased">✅ تم الشراء</option>
                    </select>
                    <button
                      onClick={() => setGroupByCategory(!groupByCategory)}
                      className={`px-4 py-2.5 rounded-xl border transition-all ${
                        groupByCategory 
                          ? 'bg-emerald-500 text-white border-emerald-500' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      suppressHydrationWarning
                    >
                      📁 تجميع
                    </button>
                  </div>
                </div>

                {/* قائمة الأغراض */}
                {filteredItems.length === 0 ? (
                  <div className="text-center py-16">
                    <span className="text-6xl mb-4 block">📋</span>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">
                      {items.length === 0 ? 'القائمة فارغة' : 'لا توجد نتائج'}
                    </h3>
                    <p className="text-slate-500 mb-4">
                      {items.length === 0 
                        ? 'اضغط على زر إضافة لبدء إضافة الأغراض' 
                        : 'جرب تغيير معايير البحث أو الفلترة'}
                    </p>
                    {items.length === 0 && (
                      <button
                        onClick={() => {
                          console.log('Opening add modal from empty state')
                          setIsModalOpen(true)
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                        suppressHydrationWarning
                      >
                        ➕ إضافة غرض جديد
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(groupByCategory ? Object.entries(groupedItems) : [['all', filteredItems]] as [string, Item[]][]).map(([categoryId, categoryItems]) => {
                      const categoryInfo = categoryId !== 'all' ? getCategoryInfo(categoryId) : null
                      
                      return (
                        <div key={categoryId}>
                          {categoryInfo && (
                            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${categoryInfo.lightColor}`}>
                              <span className="text-xl">{categoryInfo.icon}</span>
                              <span className={`font-bold ${categoryInfo.textColor}`}>{categoryInfo.name}</span>
                              <span className="text-sm text-slate-500">({categoryItems.length})</span>
                            </div>
                          )}
                          <div className="grid gap-3">
                            {categoryItems.map(item => {
                              const catInfo = getCategoryInfo(item.category)
                              const bestPrice = getBestPrice(item)
                              
                              return (
                                <div 
                                  key={item.id} 
                                  className={`bg-white rounded-2xl p-4 shadow-sm border transition-all hover:shadow-md ${
                                    item.isPurchased ? 'opacity-60 border-slate-200' : 'border-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-4">
                                    <button
                                      onClick={() => togglePurchased(item.id)}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                        item.isPurchased 
                                          ? 'bg-green-500 text-white' 
                                          : 'border-2 border-dashed border-slate-300 hover:border-emerald-500'
                                      }`}
                                      suppressHydrationWarning
                                    >
                                      {item.isPurchased && '✓'}
                                    </button>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-lg ${item.isPurchased ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                          {item.name}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${catInfo.lightColor} ${catInfo.textColor}`}>
                                          {catInfo.icon} {catInfo.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                        <span>×{item.quantity}</span>
                                        {item.notes && <span>• {item.notes}</span>}
                                        {bestPrice && (
                                          <span className="text-emerald-600 font-medium">
                                            • {bestPrice.price.toFixed(2)} ر.س
                                            {item.quantity > 1 && (
                                              <span className="text-xs mr-1">
                                                (المجموع: {(bestPrice.price * item.quantity).toFixed(2)} ر.س)
                                              </span>
                                            )}
                                            <span className="text-xs text-slate-400 mr-1">- {bestPrice.store}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {item.image && (
                                      <img 
                                        src={item.image} 
                                        alt={item.name}
                                        className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-80"
                                        onClick={() => openImagePreview(item.image!)}
                                      />
                                    )}
                                    
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => { setSelectedItemForPrice(item); setIsPriceModalOpen(true); }}
                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                        title="إضافة سعر"
                                        suppressHydrationWarning
                                      >
                                        💰
                                      </button>
                                      <button
                                        onClick={() => openEditModal(item)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="تعديل"
                                        suppressHydrationWarning
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() => deleteItem(item.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="حذف"
                                        suppressHydrationWarning
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {item.prices && item.prices.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-slate-500">الأسعار ({item.prices.length})</span>
                                        <button
                                          onClick={() => { setSelectedItemForPrice(item); setIsPriceModalOpen(true); }}
                                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                                          suppressHydrationWarning
                                        >
                                          إدارة الأسعار
                                        </button>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {item.prices.map((price, idx) => {
                                          const isActive = item.selectedStore === price.store || 
                                            (!item.selectedStore && idx === 0)
                                          return (
                                            <button
                                              key={idx}
                                              onClick={() => selectItemStore(item.id, price.store)}
                                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                                                isActive 
                                                  ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500' 
                                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                              }`}
                                              suppressHydrationWarning
                                            >
                                              <span className="font-medium">{price.store}:</span>
                                              <span className="font-bold">{price.price.toFixed(2)} ر.س</span>
                                              {isActive && <span className="text-emerald-500">✓</span>}
                                            </button>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* محتوى تتبع الأسعار */}
            {activeTab === 'prices' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span>💰</span> ذاكرة الأسعار
                  </h3>
                  <div className="flex items-center gap-2">
                    {Object.keys(priceHistory).length > 0 && (
                      <button
                        onClick={cleanupDuplicatePrices}
                        className="px-3 py-1.5 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1"
                        title="إزالة الأسعار المكررة"
                        suppressHydrationWarning
                      >
                        <span>🧹</span>
                        <span>تنظيف المكرر</span>
                      </button>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                      Object.keys(priceHistory).length > 0
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      <span>📦</span>
                      <span>{Object.keys(priceHistory).length} منتج</span>
                    </span>
                  </div>
                </div>

                {Object.keys(priceHistory).length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-3 block">📊</span>
                    <p className="text-slate-500 dark:text-slate-400">لا توجد أسعار محفوظة</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">سيتم حفظ الأسعار تلقائياً عند إضافتها للأغراض</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="🔍 بحث في الأسعار..."
                      value={priceSearchTerm}
                      onChange={(e) => setPriceSearchTerm(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
                    />

                    {Object.entries(priceHistory)
                      .filter(([name]) => name.includes(priceSearchTerm.toLowerCase()))
                      .map(([name, prices]) => (
                      <div key={name} className="border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-slate-700 dark:text-slate-200 capitalize">{name}</h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditPriceProduct(name, prices)}
                              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded-lg transition-colors"
                              title="تعديل"
                              suppressHydrationWarning
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deletePriceProduct(name)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                              title="حذف"
                              suppressHydrationWarning
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          {prices.sort((a, b) => a.price - b.price).map((price, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg">
                              <span className="text-slate-600 dark:text-slate-300">{price.store}</span>
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">{price.price.toFixed(2)} ر.س</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* محتوى العائلة */}
            {activeTab === 'family' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span>👥</span> أفراد العائلة
                  </h3>
                  <button
                    onClick={() => setIsFamilyModalOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                    suppressHydrationWarning
                  >
                    <span>➕</span> إضافة فرد
                  </button>
                </div>
                
                {familyMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-3 block">👨‍👩‍👧‍👦</span>
                    <p className="text-slate-500 mb-3">لم يتم إضافة أفراد العائلة</p>
                    <button
                      onClick={() => setIsFamilyModalOpen(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                      suppressHydrationWarning
                    >
                      إضافة أول فرد
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {familyMembers.map(member => (
                      <div 
                        key={member.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          shoppingTurn === member.id 
                            ? 'border-amber-400 bg-amber-50' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">{member.avatar}</span>
                          <div>
                            <h4 className="font-bold text-slate-800">{member.name}</h4>
                            {shoppingTurn === member.id && (
                              <span className="text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full">
                                🛒 الدور عليه
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {shoppingTurn === member.id && familyMembers.length > 1 && (
                            <button
                              onClick={() => passTurnToNext(member.id)}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-medium transition-colors text-sm"
                              suppressHydrationWarning
                            >
                              ✓ تم
                            </button>
                          )}
                          <button
                            onClick={() => switchActiveMember(member)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg font-medium transition-colors text-sm"
                            suppressHydrationWarning
                          >
                            اختيار
                          </button>
                          <button
                            onClick={() => deleteFamilyMember(member.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded-lg transition-colors text-sm"
                            suppressHydrationWarning
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        </>
      )}

      {/* نافذة المصادقة */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md relative shadow-2xl animate-scale-in border border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                {authMode === 'login' ? '🔐 تسجيل الدخول' : '📝 إنشاء حساب جديد'}
              </h2>
              
              {authError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm border border-red-200 dark:border-red-800">
                  {authError}
                </div>
              )}
              
              <div className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الاسم</label>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="اسمك"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="example@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="••••••••"
                  />
                </div>
                
                <button
                  onClick={authMode === 'login' ? handleLogin : handleRegister}
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 text-white py-3 rounded-xl font-medium shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 hover:shadow-xl"
                  suppressHydrationWarning
                >
                  {authLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري...</span>
                    </>
                  ) : (
                    authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'
                  )}
                </button>
                
                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login')
                      setAuthError('')
                    }}
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium transition-colors"
                    suppressHydrationWarning
                  >
                    {authMode === 'login'
                      ? 'ليس لديك حساب؟ إنشاء حساب جديد'
                      : 'لديك حساب بالفعل؟ تسجيل الدخول'}
                  </button>
                </div>
              </div>

              {/* توقيع المصمم */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-emerald-500">✦</span>
                    صُمّم بواسطة
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                      رشيد الحربي
                    </span>
                    <span className="text-emerald-500">✦</span>
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsAuthModalOpen(false)
                setAuthError('')
                setAuthName('')
                setAuthEmail('')
                setAuthPassword('')
              }}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl transition-colors"
              suppressHydrationWarning
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* نافذة إضافة/تعديل غرض */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '450px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* العنوان وزر الإغلاق */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                {editingItem ? '✏️ تعديل الغرض' : '➕ إضافة غرض جديد'}
              </h2>
              <button
                onClick={closeModal}
                onTouchEnd={(e) => { e.preventDefault(); closeModal(); }}
                style={{
                  fontSize: '28px',
                  color: '#94a3b8',
                  background: 'none',
                  border: 'none',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* حقل الاسم */}
            <div style={{ marginBottom: '16px', position: 'relative' }} ref={suggestionsRef}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569', fontSize: '14px' }}>
                اسم الغرض *
              </label>
              <input
                ref={itemInputRef}
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (showSuggestions && filteredSuggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      setSelectedIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev))
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
                    } else if (e.key === 'Enter' && selectedIndex >= 0) {
                      e.preventDefault()
                      setItemName(filteredSuggestions[selectedIndex])
                      setShowSuggestions(false)
                    } else if (e.key === 'Escape') {
                      setShowSuggestions(false)
                    }
                  }
                }}
                onFocus={() => {
                  if (itemName.trim().length >= 2 && filteredSuggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '18px',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
                placeholder="مثال: حليب، خبز..."
                autoComplete="off"
                autoCorrect="off"
              />

              {/* قائمة الاقتراحات */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  maxHeight: '300px',
                  overflowY: 'auto',
                  marginTop: '4px',
                  border: '1px solid #e2e8f0'
                }}>
                  {filteredSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setItemName(suggestion)
                        setShowSuggestions(false)
                        itemInputRef.current?.focus()
                      }}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        backgroundColor: index === selectedIndex ? '#f0f9ff' : 'white',
                        borderBottom: index < filteredSuggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <span style={{ fontSize: '16px' }}>📦</span>
                      <span style={{ fontSize: '16px', color: '#334155', flex: 1 }}>{suggestion}</span>
                      <button
                        onClick={(e) => handleDeleteSuggestion(suggestion, e)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          opacity: 0.5
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                        title="حذف من الاقتراحات"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* إضافة صورة */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569', fontSize: '14px' }}>
                صورة المنتج (اختياري)
              </label>

              {itemImage ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={itemImage} alt="صورة المنتج" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '12px', flex: 1 }} />
                  <button
                    onClick={() => setItemImage(null)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: '2px solid #fca5a5',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    حذف
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  {/* زر التصوير */}
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px dashed #10b981',
                    cursor: 'pointer',
                    backgroundColor: '#ecfdf5',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setItemImage(reader.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '28px', marginBottom: '6px' }}>📷</span>
                    <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>تصوير</span>
                  </label>

                  {/* زر اختيار من الجهاز */}
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px dashed #3b82f6',
                    cursor: 'pointer',
                    backgroundColor: '#eff6ff',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setItemImage(reader.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '28px', marginBottom: '6px' }}>🖼️</span>
                    <span style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '500' }}>من الجهاز</span>
                  </label>
                </div>
              )}
            </div>

            {/* التصنيف */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569', fontSize: '14px' }}>
                التصنيف
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  style={{
                    flex: 1,
                    boxSizing: 'border-box',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                  {customCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '2px solid #10b981',
                    backgroundColor: '#ecfdf5',
                    color: '#10b981',
                    fontSize: '18px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                  title="إضافة تصنيف جديد"
                >
                  ➕ صنف
                </button>
              </div>
            </div>

            {/* الكمية */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569', fontSize: '14px' }}>
                الكمية
              </label>
              <input
                type="number"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                min="1"
                placeholder="أدخل الكمية"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '18px',
                  backgroundColor: 'white'
                }}
              />
            </div>

            {/* السعر والمتجر */}
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569', fontSize: '14px' }}>
                  السعر (اختياري)
                </label>
                <input
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                  min="0"
                  step="0.01"
                  placeholder="مثال: 15.50"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569', fontSize: '14px' }}>
                  المتجر (اختياري)
                </label>
                <select
                  value={itemPriceStore}
                  onChange={(e) => setItemPriceStore(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">اختر المتجر</option>
                  {allStores.map(store => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* الملاحظات */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569', fontSize: '14px' }}>
                ملاحظات (اختياري)
              </label>
              <textarea
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="مثال: العلامة التجارية، الحجم، أي تفاصيل إضافية..."
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>

            {/* أزرار الإضافة والإلغاء */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSubmit}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  handleSubmit(e)
                }}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: editingItem ? '#3b82f6' : '#10b981',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {editingItem ? '💾 حفظ التعديل' : '➕ إضافة'}
              </button>
              <button
                onClick={closeModal}
                onTouchEnd={(e) => { e.preventDefault(); closeModal(); }}
                style={{
                  padding: '16px 24px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#64748b',
                  fontSize: '18px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة العائلة */}
      {isFamilyModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsFamilyModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <span>👥</span>
                <span>العائلة</span>
              </h2>

              {/* أفراد العائلة */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">الأعضاء ({familyMembers.length})</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {familyMembers.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">لا يوجد أعضاء</p>
                  ) : (
                    familyMembers.map(member => (
                      <div 
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{member.avatar}</span>
                          <span className="font-medium text-slate-700 dark:text-slate-200">{member.name}</span>
                        </div>
                        {familyMembers.length > 1 && (
                          <button
                            onClick={() => deleteFamilyMember(member.id)}
                            className="text-red-500 hover:text-red-600 text-sm"
                            suppressHydrationWarning
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* إضافة عضو جديد */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">إضافة عضو جديد</h3>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.target as HTMLFormElement)
                    const name = formData.get('memberName') as string
                    if (name && name.trim()) {
                      createNewFamilyMember(name.trim())
                      ;(e.target as HTMLFormElement).reset()
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    name="memberName"
                    placeholder="اسم العضو"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                    suppressHydrationWarning
                  >
                    إضافة
                  </button>
                </form>
              </div>

              {/* زر الإغلاق */}
              <button
                onClick={() => setIsFamilyModalOpen(false)}
                className="w-full mt-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                suppressHydrationWarning
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إدارة الأسعار المحسّنة */}
      {isPriceModalOpen && selectedItemForPrice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsPriceModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* العنوان */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  💰 إدارة الأسعار
                </h2>
                <button
                  onClick={() => setIsStoresModalOpen(true)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                  suppressHydrationWarning
                >
                  🏪 إدارة المتاجر
                </button>
              </div>
              
              {/* اسم المنتج */}
              <div className="bg-slate-50 rounded-xl p-3 mb-4">
                <span className="text-slate-600 text-sm">المنتج:</span>
                <span className="font-medium text-slate-800 mr-2">{selectedItemForPrice.name}</span>
              </div>
              
              {/* الأسعار الحالية */}
              {selectedItemForPrice.prices && selectedItemForPrice.prices.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">الأسعار المسجلة:</h3>
                  <div className="space-y-2">
                    {selectedItemForPrice.prices.map((price, idx) => {
                      const isSelected = selectedItemForPrice.selectedStore === price.store || 
                        (!selectedItemForPrice.selectedStore && idx === 0)
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                            isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => selectItemStore(selectedItemForPrice.id, price.store)}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                              }`}
                              suppressHydrationWarning
                            >
                              {isSelected && <span className="text-white text-xs">✓</span>}
                            </button>
                            <div>
                              <span className="font-medium text-slate-800">{price.store}</span>
                              <span className="text-emerald-600 font-bold mr-2">{price.price.toFixed(2)} ر.س</span>
                            </div>
                          </div>
                          <button
                            onClick={() => deletePrice(selectedItemForPrice.id, idx)}
                            className="text-red-400 hover:text-red-600 p-1"
                            suppressHydrationWarning
                          >
                            🗑️
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* إضافة سعر جديد */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">إضافة سعر جديد:</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">المتجر</label>
                    {!showCustomStoreInput ? (
                      <div className="flex gap-2">
                        <select
                          value={newPriceStore}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setShowCustomStoreInput(true)
                            } else {
                              setNewPriceStore(e.target.value)
                            }
                          }}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 bg-white"
                        >
                          <option value="">اختر المتجر</option>
                          {allStores.map(store => (
                            <option key={store} value={store}>{store}</option>
                          ))}
                          <option value="__custom__">➕ متجر جديد...</option>
                        </select>
                        <button
                          onClick={() => setIsStoresModalOpen(true)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600"
                          title="إدارة المتاجر"
                          suppressHydrationWarning
                        >
                          ⚙️
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customStoreName}
                          onChange={(e) => setCustomStoreName(e.target.value)}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                          placeholder="اسم المتجر الجديد"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => { setShowCustomStoreInput(false); setCustomStoreName(''); }}
                          className="px-3 py-2 text-slate-400 hover:text-slate-600"
                          suppressHydrationWarning
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">السعر (ر.س)</label>
                    <input
                      type="number"
                      value={newPriceAmount}
                      onChange={(e) => setNewPriceAmount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              {/* أزرار الإجراءات */}
              <div className="flex gap-3 pt-4 mt-4 border-t">
                <button
                  onClick={handleAddPrice}
                  disabled={!newPriceStore && !customStoreName.trim()}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white py-3 rounded-xl font-medium transition-colors"
                  suppressHydrationWarning
                >
                  ➕ إضافة السعر
                </button>
                <button
                  onClick={() => {
                    setIsPriceModalOpen(false)
                    setSelectedItemForPrice(null)
                    setNewPriceStore('')
                    setNewPriceAmount('')
                    setShowCustomStoreInput(false)
                    setCustomStoreName('')
                  }}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  suppressHydrationWarning
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إدارة المتاجر */}
      {isStoresModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setIsStoresModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                🏪 إدارة المتاجر
              </h2>
              
              {/* إضافة متجر جديد */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  id="newStoreInput"
                  placeholder="اسم المتجر الجديد"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement
                      if (input.value.trim()) {
                        addCustomStore(input.value.trim())
                        input.value = ''
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('newStoreInput') as HTMLInputElement
                    if (input?.value.trim()) {
                      addCustomStore(input.value.trim())
                      input.value = ''
                    }
                  }}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium"
                  suppressHydrationWarning
                >
                  إضافة
                </button>
              </div>
              
              {/* المتاجر الافتراضية */}
              <div className="mb-4">
                <h3 className="text-xs text-slate-500 uppercase mb-2">المتاجر الافتراضية</h3>
                <div className="flex flex-wrap gap-2">
                  {defaultStores.map(store => (
                    <span key={store} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm">
                      {store}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* المتاجر المخصصة */}
              {customStores.length > 0 && (
                <div>
                  <h3 className="text-xs text-slate-500 uppercase mb-2">المتاجر المخصصة</h3>
                  <div className="space-y-2">
                    {customStores.map(store => (
                      <div key={store} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-700">{store}</span>
                        <button
                          onClick={() => setStoreToDelete(store)}
                          className="text-red-400 hover:text-red-600 text-sm"
                          suppressHydrationWarning
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {customStores.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">لا توجد متاجر مخصصة</p>
              )}
              
              {/* زر الإغلاق */}
              <button
                onClick={() => setIsStoresModalOpen(false)}
                className="w-full mt-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                suppressHydrationWarning
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* تأكيد حذف المتجر */}
      {storeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">⚠️ تأكيد الحذف</h3>
            <p className="text-slate-600 mb-4">
              هل أنت متأكد من حذف متجر "{storeToDelete}"؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteCustomStore(storeToDelete)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-medium"
                suppressHydrationWarning
              >
                حذف
              </button>
              <button
                onClick={() => setStoreToDelete(null)}
                className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-medium hover:bg-slate-50"
                suppressHydrationWarning
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تعديل المنتج في تتبع الأسعار */}
      {isEditPriceModalOpen && editingPriceData && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsEditPriceModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <span>✏️</span> تعديل المنتج
              </h2>

              <div className="space-y-4">
                {/* اسم المنتج */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم المنتج</label>
                  <input
                    type="text"
                    value={editingPriceData.newName}
                    onChange={(e) => setEditingPriceData({ ...editingPriceData, newName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="اسم المنتج"
                  />
                </div>

                {/* قائمة الأسعار */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">الأسعار</label>
                    <button
                      onClick={addPriceInEdit}
                      className="text-emerald-500 hover:text-emerald-600 text-sm font-medium flex items-center gap-1"
                      suppressHydrationWarning
                    >
                      <span>+</span> إضافة سعر
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editingPriceData.prices.map((price, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl">
                        <select
                          value={price.store}
                          onChange={(e) => updatePriceInEdit(idx, 'store', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        >
                          <option value="">اختر المتجر</option>
                          {[...defaultStores, ...customStores].map(store => (
                            <option key={store} value={store}>{store}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={price.price || ''}
                          onChange={(e) => updatePriceInEdit(idx, 'price', parseFloat(e.target.value) || 0)}
                          className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                          placeholder="السعر"
                          step="0.01"
                        />
                        <span className="text-slate-500 dark:text-slate-400 text-sm">ر.س</span>
                        {editingPriceData.prices.length > 1 && (
                          <button
                            onClick={() => removePriceInEdit(idx)}
                            className="text-red-500 hover:text-red-600 p-1"
                            suppressHydrationWarning
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* أزرار الحفظ والإلغاء */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={savePriceProductEdit}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-medium transition-colors"
                    suppressHydrationWarning
                  >
                    💾 حفظ التعديلات
                  </button>
                  <button
                    onClick={() => {
                      setIsEditPriceModalOpen(false)
                      setEditingPriceProductName(null)
                      setEditingPriceData(null)
                    }}
                    className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    suppressHydrationWarning
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة المستخدم */}
      {isUserModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsUserModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* معلومات المستخدم */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                <span className="text-4xl">{currentUser?.avatar || '👤'}</span>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{currentUser?.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser?.email}</p>
                </div>
              </div>

              {/* الخيارات */}
              <div className="space-y-2">
                {/* النسخ الاحتياطي */}
                <button
                  onClick={createBackup}
                  disabled={isBackupLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                  suppressHydrationWarning
                >
                  <span className="text-xl">💾</span>
                  <span className="font-medium">{isBackupLoading ? 'جاري الحفظ...' : 'إنشاء نسخة احتياطية'}</span>
                </button>

                <button
                  onClick={async () => {
                    await fetchBackups()
                    setShowBackupModal(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                  suppressHydrationWarning
                >
                  <span className="text-xl">🔄</span>
                  <span className="font-medium">استعادة نسخة احتياطية</span>
                </button>

                {/* فاصل */}
                <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>

                {/* 📤 تصدير البيانات */}
                <button
                  onClick={exportAllData}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  suppressHydrationWarning
                >
                  <span className="text-xl">📤</span>
                  <span className="font-medium">تصدير البيانات (JSON)</span>
                </button>

                {/* 📥 استيراد البيانات */}
                <label className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer">
                  <span className="text-xl">📥</span>
                  <span className="font-medium">{isBackupLoading ? 'جاري الاستيراد...' : 'استيراد البيانات (JSON)'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        importAllData(file)
                      }
                      e.target.value = ''
                    }}
                    className="hidden"
                  />
                </label>

                {/* فاصل */}
                <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>

                <button
                  onClick={() => {
                    setIsUserModalOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  suppressHydrationWarning
                >
                  <span className="text-xl">🚪</span>
                  <span className="font-medium">تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 نافذة التحديث */}
      {showUpdateModal && updateInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-xl font-bold">تحديث جديد متاح!</h3>
              <p className="text-blue-100 text-sm mt-1">الإصدار {updateInfo.version}</p>
            </div>
            
            {/* Changelog */}
            <div className="p-4 max-h-60 overflow-y-auto">
              <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">📝 التغييرات:</h4>
              {updateInfo.changelog && updateInfo.changelog.length > 0 && (
                <ul className="space-y-1">
                  {updateInfo.changelog[0].changes.map((change, index) => (
                    <li key={index} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              {updateInfo.forceUpdate && (
                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  ⚠️ هذا التحديث إجباري ويحتوي على إصلاحات أمنية مهمة
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              {!updateInfo.forceUpdate && (
                <button
                  onClick={() => {
                    // تسجيل الإصدار الجديد حتى لا تظهر الرسالة مرة أخرى
                    localStorage.setItem('appVersion', latestVersion)
                    setCurrentVersion(latestVersion)
                    setShowUpdateModal(false)
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  لاحقاً
                </button>
              )}
              <button
                onClick={applyUpdate}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition font-medium"
              >
                تحديث الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة النسخ الاحتياطية */}
      {showBackupModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowBackupModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  🔄 النسخ الاحتياطية
                </h2>
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl"
                >
                  ✕
                </button>
              </div>

              {backups.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <span className="text-4xl block mb-2">📭</span>
                  لا توجد نسخ احتياطية محفوظة
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {backup.date}
                        </p>
                      </div>
                      <button
                        onClick={() => restoreBackup(backup.id)}
                        disabled={isBackupLoading}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                        suppressHydrationWarning
                      >
                        استعادة
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowBackupModal(false)}
                className="w-full mt-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
                suppressHydrationWarning
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الميزانية */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                💰 إعداد الميزانية
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الميزانية الشهرية (ر.س)</label>
                  <input
                    type="number"
                    value={monthlyBudget || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      setMonthlyBudget(value)
                      monthlyBudgetRef.current = value
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                    placeholder="مثال: 3000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تعديل المصروفات (إضافة/خصم)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                      placeholder="مثال: 100 أو -50"
                    />
                    <button
                      onClick={async () => {
                        const amount = parseFloat(adjustAmount)
                        if (!isNaN(amount)) {
                          const newSpentAmount = Math.max(0, spentAmount + amount)
                          setSpentAmount(newSpentAmount)
                          spentAmountRef.current = newSpentAmount
                          setAdjustAmount('')
                          
                          // 🚨 حفظ فوري على السيرفر
                          if (isLoggedIn && isDataLoaded) {
                            try {
                              await fetch('/api/sync', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  items: itemsRef.current,
                                  familyMembers: familyMembersRef.current,
                                  customStores: customStoresRef.current,
                                  priceHistory: priceHistoryRef.current,
                                  budget: {
                                    monthlyBudget: monthlyBudgetRef.current,
                                    spentAmount: newSpentAmount,
                                    startDate: budgetStartDateRef.current,
                                    shoppingTurn: shoppingTurnRef.current
                                  },
                                  customCategories: customCategoriesRef.current,
                                  savedProductNames: savedProductNamesRef.current
                                })
                              })
                              console.log('✅ تم حفظ تعديل المصروفات')
                            } catch (error) {
                              console.error('Adjust spent error:', error)
                            }
                          }
                        }
                      }}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                      suppressHydrationWarning
                    >
                      تطبيق
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">أدخل رقم موجب للإضافة أو سالب للخصم</p>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-slate-500">المصروفات الحالية:</span>
                      <span className="font-bold text-slate-700 mr-2">{spentAmount.toFixed(0)} ر.س</span>
                    </div>
                    {spentAmount > 0 && (
                      <button
                        onClick={async () => {
                          if (confirm('⚠️ هل أنت متأكد من تصفير المصروفات؟\n\nسيتم إعادة تعيين المصروفات إلى صفر.')) {
                            setSpentAmount(0)
                            spentAmountRef.current = 0
                            showAlertMessage('✅ تم تصفير المصروفات')
                            
                            // 🚨 حفظ فوري على السيرفر
                            if (isLoggedIn && isDataLoaded) {
                              try {
                                await fetch('/api/sync', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    items: itemsRef.current,
                                    familyMembers: familyMembersRef.current,
                                    customStores: customStoresRef.current,
                                    priceHistory: priceHistoryRef.current,
                                    budget: {
                                      monthlyBudget: monthlyBudgetRef.current,
                                      spentAmount: 0,
                                      startDate: budgetStartDateRef.current,
                                      shoppingTurn: shoppingTurnRef.current
                                    },
                                    customCategories: customCategoriesRef.current,
                                    savedProductNames: savedProductNamesRef.current
                                  })
                                })
                                console.log('✅ تم حفظ تصفير المصروفات')
                              } catch (error) {
                                console.error('Reset spent error:', error)
                              }
                            }
                          }
                        }}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
                        suppressHydrationWarning
                      >
                        🗑️ تصفير
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={async () => {
                      // تحديث refs
                      if (monthlyBudget > 0 && !budgetStartDate) {
                        const newStartDate = new Date().toISOString().split('T')[0]
                        setBudgetStartDate(newStartDate)
                        budgetStartDateRef.current = newStartDate
                      }
                      
                      // 🚨 حفظ فوري على السيرفر
                      if (isLoggedIn && isDataLoaded) {
                        try {
                          console.log('💰 حفظ الميزانية على السيرفر...')
                          const response = await fetch('/api/sync', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              items: itemsRef.current,
                              familyMembers: familyMembersRef.current,
                              customStores: customStoresRef.current,
                              priceHistory: priceHistoryRef.current,
                              budget: {
                                monthlyBudget: monthlyBudget,
                                spentAmount: spentAmount,
                                startDate: budgetStartDateRef.current || (monthlyBudget > 0 ? new Date().toISOString().split('T')[0] : ''),
                                shoppingTurn: shoppingTurnRef.current
                              },
                              customCategories: customCategoriesRef.current,
                              savedProductNames: savedProductNamesRef.current
                            })
                          })
                          
                          if (response.ok) {
                            console.log('✅ تم حفظ الميزانية على السيرفر')
                            showAlertMessage('✅ تم حفظ الميزانية بنجاح')
                          } else {
                            console.error('⚠️ فشل حفظ الميزانية')
                            showAlertMessage('⚠️ فشل حفظ الميزانية')
                          }
                        } catch (error) {
                          console.error('Budget save error:', error)
                          showAlertMessage('⚠️ فشل الحفظ - تحقق من اتصالك')
                        }
                      }
                      
                      setIsBudgetModalOpen(false)
                    }}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-medium transition-colors"
                    suppressHydrationWarning
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setIsBudgetModalOpen(false)}
                    className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    suppressHydrationWarning
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة معاينة الصورة */}
      {isImagePreviewOpen && previewImageUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={closeImagePreview}
        >
          <img 
            src={previewImageUrl} 
            alt="معاينة" 
            className="max-w-full max-h-full rounded-lg"
          />
          <button
            onClick={closeImagePreview}
            className="absolute top-4 left-4 text-white text-2xl hover:opacity-70"
            suppressHydrationWarning
          >
            ✕
          </button>
        </div>
      )}

      {/* إشعار تغيير الدور */}
      {showTurnNotification && getCurrentTurnMember() && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-bounce">
          🛒 انتقل الدور إلى: {getCurrentTurnMember()?.name}
        </div>
      )}

      {/* نافذة إضافة تصنيف مخصص */}
      {isCategoryModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 9999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>
              🏷️ إضافة تصنيف جديد
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569', fontSize: '14px' }}>
                اسم التصنيف *
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="مثال: ألعاب، كتب، إلكترونيات..."
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569', fontSize: '14px' }}>
                الأيقونة
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['📦', '🎮', '📚', '📱', '👕', '🎨', '⚽', '🧸', '💄', '🔧', '🌱', '🎁', '💎', '🎵'].map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCategoryIcon(icon)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      fontSize: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: newCategoryIcon === icon ? '2px solid #10b981' : 'none',
                      backgroundColor: newCategoryIcon === icon ? '#d1fae5' : '#f1f5f9',
                      cursor: 'pointer'
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569', fontSize: '14px' }}>
                اللون
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'purple', color: '#a855f7' },
                  { id: 'blue', color: '#3b82f6' },
                  { id: 'green', color: '#22c55e' },
                  { id: 'red', color: '#ef4444' },
                  { id: 'orange', color: '#f97316' },
                  { id: 'pink', color: '#ec4899' },
                  { id: 'teal', color: '#14b8a6' },
                  { id: 'indigo', color: '#6366f1' },
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewCategoryColor(c.id)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: c.color,
                      cursor: 'pointer',
                      border: newCategoryColor === c.id ? '3px solid #1e293b' : 'none',
                      transform: newCategoryColor === c.id ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569', fontSize: '14px' }}>
                كلمات مفتاحية للتعرف التلقائي
                <span style={{ color: '#94a3b8', fontWeight: 'normal' }}> (اختياري)</span>
              </label>
              <input
                type="text"
                value={newCategoryKeywords}
                onChange={(e) => setNewCategoryKeywords(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="مثال: بلايستيشن, اكس بوكس, نينتندو"
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>افصل بين الكلمات بفاصلة (،)</p>
            </div>

            {/* التصنيفات المخصصة الحالية */}
            {customCategories.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569', fontSize: '14px' }}>
                  التصنيفات المخصصة الحالية
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customCategories.map(cat => (
                    <div key={cat.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}>
                      <span style={{ fontSize: '16px' }}>
                        {cat.icon} {cat.name}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`هل تريد حذف تصنيف "${cat.name}"؟`)) {
                            deleteCustomCategory(cat.id)
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid #fca5a5',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={createCustomCategory}
                disabled={!newCategoryName.trim()}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: newCategoryName.trim() ? '#10b981' : '#86efac',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: newCategoryName.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                إنشاء التصنيف
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false)
                  setNewCategoryName('')
                  setNewCategoryIcon('📦')
                  setNewCategoryColor('purple')
                  setNewCategoryKeywords('')
                }}
                style={{
                  padding: '14px 24px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#64748b',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة مسح الفاتورة */}
      {isScanModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  📸 مسح الفاتورة
                </h2>
                <button
                  onClick={() => {
                    setIsScanModalOpen(false)
                    setScannedImage(null)
                    setScannedItems([])
                    setScanError('')
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl"
                  suppressHydrationWarning
                >
                  ✕
                </button>
              </div>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                التقط صورة واضحة للفاتورة وسيتم استخراج المنتجات تلقائياً
              </p>

              {/* رفع الصورة */}
              {!scannedImage ? (
                <div className="space-y-4">
                  {/* input مخفي للكاميرا */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleScanImage}
                    className="hidden"
                    ref={cameraInputRef}
                  />
                  
                  {/* input مخفي للاستديو */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScanImage}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  
                  <div className="text-5xl text-center mb-4">📄</div>
                  <p className="text-center text-slate-600 dark:text-slate-300 font-medium mb-4">
                    اختر طريقة رفع الفاتورة
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* زر الكاميرا */}
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-xl font-medium flex flex-col items-center justify-center gap-2 hover:shadow-lg transition-all"
                      suppressHydrationWarning
                    >
                      <span className="text-3xl">📷</span>
                      <span>الكاميرا</span>
                      <span className="text-xs opacity-80">التقاط صورة</span>
                    </button>
                    
                    {/* زر الاستديو */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-medium flex flex-col items-center justify-center gap-2 hover:shadow-lg transition-all"
                      suppressHydrationWarning
                    >
                      <span className="text-3xl">🖼️</span>
                      <span>الاستديو</span>
                      <span className="text-xs opacity-80">اختيار صورة</span>
                    </button>
                  </div>
                  
                  <p className="text-center text-xs text-slate-400 mt-4">
                    ✅ تأكد من وضوح الفاتورة للحصول على أفضل نتائج
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* معاينة الصورة */}
                  <div className="relative">
                    <img 
                      src={scannedImage} 
                      alt="الفاتورة" 
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      onClick={() => {
                        setScannedImage(null)
                        setScannedItems([])
                        setScanError('')
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600"
                      suppressHydrationWarning
                    >
                      ✕
                    </button>
                  </div>

                  {/* زر المسح */}
                  {scannedItems.length === 0 && !isScanning && (
                    <button
                      onClick={scanReceipt}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                      suppressHydrationWarning
                    >
                      <span className="text-xl">🔍</span>
                      <span>تحليل الفاتورة</span>
                    </button>
                  )}

                  {/* حالة التحميل */}
                  {isScanning && (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                      <span className="mr-3 text-slate-600 dark:text-slate-300">جاري التحليل...</span>
                    </div>
                  )}

                  {/* خطأ */}
                  {scanError && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
                      ⚠️ {scanError}
                    </div>
                  )}

                  {/* النتائج */}
                  {scannedItems.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-800 dark:text-white">
                        ✅ تم العثور على {scannedItems.length} منتج:
                      </h3>
                      <p className="text-xs text-slate-500">اضغط على اسم المنتج لتعديله</p>
                      
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {scannedItems.map((item, index) => (
                          <div 
                            key={index}
                            className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-lg">{getCategoryInfo(item.category).icon}</span>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateScannedItem(index, 'name', e.target.value)}
                                  className="flex-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 dark:text-white font-medium"
                                />
                              </div>
                              <button
                                onClick={() => removeScannedItem(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                                suppressHydrationWarning
                              >
                                ✕
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-2 text-sm">
                              <div className="flex items-center gap-3">
                                <span className="text-slate-500 dark:text-slate-400">
                                  {getCategoryInfo(item.category).name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-500">الكمية:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateScannedItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-12 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded px-2 py-0.5 text-center"
                                  />
                                </div>
                              </div>
                              {item.price > 0 && (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.price}
                                    onChange={(e) => updateScannedItem(index, 'price', parseFloat(e.target.value) || 0)}
                                    className="w-20 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded px-2 py-0.5 text-center"
                                  />
                                  <span className="text-slate-500">ر.س</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={addScannedItems}
                          disabled={scannedItems.length === 0}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium"
                          suppressHydrationWarning
                        >
                          ➕ إضافة ({scannedItems.length})
                        </button>
                        <button
                          onClick={() => {
                            setScannedImage(null)
                            setScannedItems([])
                            setScanError('')
                          }}
                          className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                          suppressHydrationWarning
                        >
                          صورة أخرى
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📋 شريط الإصدار في الأسفل */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50 py-2 px-4 text-center z-30">
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>مقاضي v{APP_VERSION}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>© 2024 جميع الحقوق محفوظة</span>
          {currentVersion !== latestVersion && latestVersion !== '0.0.0' && (
            <>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <button 
                onClick={() => checkForUpdates(true)}
                className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
              >
                <span className="animate-pulse">🔔</span>
                تحديث جديد متاح
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  )
}
