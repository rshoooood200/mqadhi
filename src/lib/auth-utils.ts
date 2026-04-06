import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

// عدد جولات التشفير (كلما زاد، كان أأمن لكن أبطأ)
const SALT_ROUNDS = 12

// تشفير كلمة المرور بشكل آمن
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// التحقق من كلمة المرور القديمة (للتوافق مع الحسابات القديمة)
function verifyOldPassword(password: string, hashedPassword: string): boolean {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hashedPassword.startsWith(hash.toString(36))
}

// التحقق من كلمة المرور (تدعم الطريقتين القديمة والجديدة)
export async function verifyPassword(password: string, hashedPassword: string): Promise<{ isValid: boolean; needsRehash: boolean; newHash?: string }> {
  try {
    // الطريقة الجديدة (bcrypt) - التحقق من وجود $2a$ أو $2b$ في بداية الـ hash
    if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')) {
      const isValid = await bcrypt.compare(password, hashedPassword)
      return { isValid, needsRehash: false }
    }
    
    // الطريقة القديمة - للتوافق مع الحسابات القديمة
    const isValid = verifyOldPassword(password, hashedPassword)
    
    if (isValid) {
      // ترحيل كلمة المرور للطريقة الجديدة
      const newHash = await hashPassword(password)
      return { isValid: true, needsRehash: true, newHash }
    }
    
    return { isValid: false, needsRehash: false }
  } catch {
    return { isValid: false, needsRehash: false }
  }
}

// توليد session token آمن
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

// توليد كود دعوة آمن (16 حرف)
export function generateInviteCode(): string {
  return randomBytes(8).toString('hex').toUpperCase()
}

// التحقق من قوة كلمة المرور
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
  }
  
  if (password.length > 128) {
    errors.push('كلمة المرور طويلة جداً')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// التحقق من صحة البريد الإلكتروني
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

// تنظيف المدخلات من الأحرف الخطرة
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, '') // إزالة control characters
}

// Rate Limiting بسيط (in-memory) - يعمل فقط في نفس العملية
// ملاحظة: في Vercel، كل request قد تكون في عملية مختلفة
// لذا هذا Rate Limiting أساسي وليس مضموناً 100%
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000 // دقيقة
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs }
  }
  
  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true, remaining: maxAttempts - record.count, resetTime: record.resetTime }
}

// تنظيف الـ rate limit store - يتم استدعاؤها يدوياً
// ملاحظة: تم إزالة setInterval لأنها تسبب مشاكل في serverless
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}
