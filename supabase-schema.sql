-- تفعيل امتداد UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- جدول المستخدمين (للبيانات الإضافية)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الأغراض
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  quantity INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  is_purchased BOOLEAN DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الأسعار
CREATE TABLE IF NOT EXISTS prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
  store TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول أفراد العائلة
CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '👤'
);

-- جدول الميزانية
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  monthly_budget DECIMAL(10,2) DEFAULT 0,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  shopping_turn TEXT
);

-- جدول التصنيفات المخصصة
CREATE TABLE IF NOT EXISTS custom_categories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT 'purple',
  keywords TEXT DEFAULT ''
);

-- جدول سجل الأسعار
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  store TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المتاجر المخصصة
CREATE TABLE IF NOT EXISTS custom_stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL
);

-- تفعيل Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_stores ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمستخدم (كل مستخدم يرى بياناته فقط)

-- profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- items
CREATE POLICY "Users can view own items" ON items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON items FOR DELETE USING (auth.uid() = user_id);

-- prices
CREATE POLICY "Users can view own prices" ON prices FOR SELECT USING (
  EXISTS (SELECT 1 FROM items WHERE items.id = prices.item_id AND items.user_id = auth.uid())
);
CREATE POLICY "Users can insert own prices" ON prices FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM items WHERE items.id = prices.item_id AND items.user_id = auth.uid())
);
CREATE POLICY "Users can delete own prices" ON prices FOR DELETE USING (
  EXISTS (SELECT 1 FROM items WHERE items.id = prices.item_id AND items.user_id = auth.uid())
);

-- family_members
CREATE POLICY "Users can view own family" ON family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own family" ON family_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own family" ON family_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own family" ON family_members FOR DELETE USING (auth.uid() = user_id);

-- budgets
CREATE POLICY "Users can view own budget" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budget" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budget" ON budgets FOR UPDATE USING (auth.uid() = user_id);

-- custom_categories
CREATE POLICY "Users can view own categories" ON custom_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON custom_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON custom_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON custom_categories FOR DELETE USING (auth.uid() = user_id);

-- price_history
CREATE POLICY "Users can view own price history" ON price_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own price history" ON price_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own price history" ON price_history FOR DELETE USING (auth.uid() = user_id);

-- custom_stores
CREATE POLICY "Users can view own stores" ON custom_stores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stores" ON custom_stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stores" ON custom_stores FOR DELETE USING (auth.uid() = user_id);

-- إنشاء trigger لإنشاء profile تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'مستخدم'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف trigger القديم إن وجد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- إنشاء trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_prices_item_id ON prices(item_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_categories_user_id ON custom_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_price_history_user_id ON price_history(user_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_name);
CREATE INDEX IF NOT EXISTS idx_custom_stores_user_id ON custom_stores(user_id);
