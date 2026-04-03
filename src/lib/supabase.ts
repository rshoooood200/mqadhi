import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not set')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

// أنواع البيانات
export interface DbUser {
  id: string
  email: string
  name: string
  created_at: string
}

export interface DbItem {
  id: string
  user_id: string
  name: string
  category: string
  quantity: number
  notes: string
  is_purchased: boolean
  image: string | null
  created_at: string
}

export interface DbPrice {
  id: string
  item_id: string
  store: string
  price: number
  date: string
}

export interface DbFamilyMember {
  id: string
  user_id: string
  name: string
  avatar: string
}

export interface DbBudget {
  id: string
  user_id: string
  monthly_budget: number
  spent_amount: number
  start_date: string | null
  shopping_turn: string | null
}

export interface DbCustomCategory {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  keywords: string
}

export interface DbPriceHistory {
  id: string
  user_id: string
  product_name: string
  store: string
  price: number
  date: string
}

export interface DbCustomStore {
  id: string
  user_id: string
  name: string
}
