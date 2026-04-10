import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import db from '@/lib/db'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface User {
  id: string
  email: string
  name: string
  avatar: string
}

export interface DecodedToken {
  userId: string
  email: string
}

// إنشاء معرف فريد
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// تشفير كلمة المرور
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// التحقق من كلمة المرور
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// إنشاء رمز JWT
export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' })
}

// التحقق من الرمز
export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken
  } catch {
    return null
  }
}

// الحصول على المستخدم الحالي من الطلب
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null

    const decoded = verifyToken(token)
    if (!decoded) return null

    const user = db.prepare('SELECT id, email, name, avatar FROM users WHERE id = ?').get(decoded.userId) as User | undefined
    return user || null
  } catch {
    return null
  }
}

// إنشاء مستخدم جديد
export function createUser(email: string, password: string, name: string): User {
  const id = generateId()
  const stmt = db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)')
  stmt.run(id, email, password, name)
  
  return { id, email, name, avatar: '👤' }
}

// البحث عن مستخدم بالبريد الإلكتروني
export function findUserByEmail(email: string): (User & { password: string }) | null {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as (User & { password: string }) | undefined
  return user || null
}

// البحث عن مستخدم بالمعرف
export function findUserById(id: string): User | null {
  const user = db.prepare('SELECT id, email, name, avatar FROM users WHERE id = ?').get(id) as User | undefined
  return user || null
}

// تعيين كوكي المصادقة
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 يوم
  })
}

// حذف كوكي المصادقة
export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}
