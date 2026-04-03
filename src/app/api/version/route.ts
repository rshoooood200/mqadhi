import { NextResponse } from 'next/server'
import { getVersionInfo } from '@/lib/version'

// GET - الحصول على معلومات الإصدار الحالي
export async function GET() {
  try {
    const versionInfo = getVersionInfo()
    
    // إضافة headers لمنع التخزين المؤقت
    const response = NextResponse.json(versionInfo)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Version check error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
