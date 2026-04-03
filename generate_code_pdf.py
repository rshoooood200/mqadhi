# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.lib.units import cm
import os

# Register fonts
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))

registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Create document
doc = SimpleDocTemplate(
    "/home/z/my-project/download/Mqadhi_Full_Code.pdf",
    pagesize=A4,
    rightMargin=1.5*cm,
    leftMargin=1.5*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title="Mqadhi_Full_Code",
    author="Z.ai",
    creator="Z.ai",
    subject="تطبيق مقاضي - الكود الكامل"
)

styles = getSampleStyleSheet()

# Custom styles
cover_title = ParagraphStyle(
    name='CoverTitle',
    fontName='Microsoft YaHei',
    fontSize=36,
    leading=44,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#10b981'),
    spaceAfter=30
)

cover_subtitle = ParagraphStyle(
    name='CoverSubtitle',
    fontName='SimHei',
    fontSize=18,
    leading=26,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#333333'),
    spaceAfter=20
)

section_title = ParagraphStyle(
    name='SectionTitle',
    fontName='Microsoft YaHei',
    fontSize=16,
    leading=22,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#1F4E79'),
    spaceBefore=20,
    spaceAfter=10
)

file_path = ParagraphStyle(
    name='FilePath',
    fontName='DejaVuSans',
    fontSize=10,
    leading=14,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#059669'),
    backColor=colors.HexColor('#ECFDF5'),
    spaceBefore=15,
    spaceAfter=5,
    leftIndent=5,
    rightIndent=5
)

code_style = ParagraphStyle(
    name='CodeStyle',
    fontName='DejaVuSans',
    fontSize=7,
    leading=9,
    alignment=TA_LEFT,
    textColor=colors.black,
    backColor=colors.HexColor('#F8FAFC'),
    leftIndent=5,
    rightIndent=5,
    spaceBefore=5,
    spaceAfter=10
)

body_style = ParagraphStyle(
    name='BodyStyle',
    fontName='SimHei',
    fontSize=11,
    leading=18,
    alignment=TA_LEFT,
    textColor=colors.black,
    wordWrap='CJK'
)

story = []

# Cover page
story.append(Spacer(1, 100))
story.append(Paragraph("تطبيق مقاضي", cover_title))
story.append(Spacer(1, 20))
story.append(Paragraph("الكود الكامل للمشروع", cover_subtitle))
story.append(Spacer(1, 40))
story.append(Paragraph("تطبيق ذكي لتنظيم قائمة المشتريات", body_style))
story.append(Paragraph("وتتبع الأسعار وإدارة ميزانية العائلة", body_style))
story.append(Spacer(1, 60))
story.append(Paragraph("Next.js 15 + Prisma + SQLite", ParagraphStyle(
    name='TechStack',
    fontName='DejaVuSans',
    fontSize=12,
    leading=16,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#64748B')
)))
story.append(PageBreak())

# Table of contents
story.append(Paragraph("فهرس الملفات", section_title))
story.append(Spacer(1, 10))

files_list = [
    ("1. package.json", "إعدادات المشروع والتبعيات"),
    ("2. next.config.ts", "إعدادات Next.js"),
    ("3. tsconfig.json", "إعدادات TypeScript"),
    ("4. prisma/schema.prisma", "نموذج قاعدة البيانات"),
    ("5. src/lib/prisma.ts", "اتصال قاعدة البيانات"),
    ("6. src/app/layout.tsx", "التخطيط الرئيسي"),
    ("7. src/app/globals.css", "الأنماط العامة"),
    ("8. src/app/api/auth/register/route.ts", "API تسجيل حساب"),
    ("9. src/app/api/auth/login/route.ts", "API تسجيل دخول"),
    ("10. src/app/api/auth/logout/route.ts", "API تسجيل خروج"),
    ("11. src/app/api/auth/me/route.ts", "API المستخدم الحالي"),
    ("12. src/app/api/sync/route.ts", "API مزامنة البيانات"),
    ("13. src/app/api/suggestions/delete/route.ts", "API حذف الاقتراحات"),
    ("14. src/app/api/classify/route.ts", "API تصنيف المنتجات"),
    ("15. src/app/api/family/route.ts", "API العائلة"),
    ("16. src/app/api/invite/route.ts", "API الدعوات"),
    ("17. src/app/api/scan-receipt/route.ts", "API مسح الفواتير"),
    ("18. public/manifest.json", "ملف PWA"),
    ("19. public/sw.js", "Service Worker"),
    ("20. src/app/page.tsx", "الصفحة الرئيسية (3000+ سطر)"),
]

for file_name, description in files_list:
    story.append(Paragraph(f"<b>{file_name}</b> - {description}", body_style))

story.append(PageBreak())

# Read and add all code files
code_files = [
    ("/home/z/my-project/package.json", "1. package.json"),
    ("/home/z/my-project/next.config.ts", "2. next.config.ts"),
    ("/home/z/my-project/tsconfig.json", "3. tsconfig.json"),
    ("/home/z/my-project/prisma/schema.prisma", "4. prisma/schema.prisma"),
    ("/home/z/my-project/src/lib/prisma.ts", "5. src/lib/prisma.ts"),
    ("/home/z/my-project/src/app/layout.tsx", "6. src/app/layout.tsx"),
    ("/home/z/my-project/src/app/globals.css", "7. src/app/globals.css"),
    ("/home/z/my-project/src/app/api/auth/register/route.ts", "8. src/app/api/auth/register/route.ts"),
    ("/home/z/my-project/src/app/api/auth/login/route.ts", "9. src/app/api/auth/login/route.ts"),
    ("/home/z/my-project/src/app/api/auth/logout/route.ts", "10. src/app/api/auth/logout/route.ts"),
    ("/home/z/my-project/src/app/api/auth/me/route.ts", "11. src/app/api/auth/me/route.ts"),
    ("/home/z/my-project/src/app/api/sync/route.ts", "12. src/app/api/sync/route.ts"),
    ("/home/z/my-project/src/app/api/suggestions/delete/route.ts", "13. src/app/api/suggestions/delete/route.ts"),
    ("/home/z/my-project/src/app/api/classify/route.ts", "14. src/app/api/classify/route.ts"),
    ("/home/z/my-project/src/app/api/family/route.ts", "15. src/app/api/family/route.ts"),
    ("/home/z/my-project/src/app/api/invite/route.ts", "16. src/app/api/invite/route.ts"),
    ("/home/z/my-project/src/app/api/scan-receipt/route.ts", "17. src/app/api/scan-receipt/route.ts"),
    ("/home/z/my-project/public/manifest.json", "18. public/manifest.json"),
    ("/home/z/my-project/public/sw.js", "19. public/sw.js"),
]

for file_path_val, title in code_files:
    try:
        with open(file_path_val, 'r', encoding='utf-8') as f:
            code_content = f.read()
        
        story.append(Paragraph(title, section_title))
        story.append(Paragraph(f"📁 {file_path_val}", file_path))
        
        # Escape HTML entities
        code_escaped = code_content.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        
        # Truncate if too long
        if len(code_escaped) > 15000:
            code_escaped = code_escaped[:15000] + "\n\n... (الملف كبير، راجع الملف الأصلي)"
        
        story.append(Preformatted(code_escaped, code_style))
        story.append(PageBreak())
    except Exception as e:
        story.append(Paragraph(f"خطأ في قراءة {file_path_val}: {str(e)}", body_style))

# Add page.tsx reference
story.append(Paragraph("20. src/app/page.tsx", section_title))
story.append(Paragraph("📁 /home/z/my-project/src/app/page.tsx", file_path))
story.append(Spacer(1, 10))
story.append(Paragraph("⚠️ هذا الملف كبير جداً (أكثر من 3000 سطر)", body_style))
story.append(Paragraph("تم تضمينه في ملف منفصل: Mqadhi_page_tsx.txt", body_style))
story.append(Spacer(1, 20))
story.append(Paragraph("تعليمات التثبيت", section_title))
story.append(Paragraph("1. أنشئ مجلد جديد للمشروع", body_style))
story.append(Paragraph("2. انسخ جميع الملفات إلى مساراتها الصحيحة", body_style))
story.append(Paragraph("3. أنشئ ملف .env بمحتوى: DATABASE_URL=\"file:./dev.db\"", body_style))
story.append(Paragraph("4. شغل الأوامر:", body_style))
story.append(Preformatted("npm install\nnpx prisma generate\nnpx prisma db push\nnpm run dev", code_style))
story.append(Paragraph("5. افتح المتصفح على: http://localhost:3000", body_style))

# Build PDF
doc.build(story)
print("PDF created successfully!")
