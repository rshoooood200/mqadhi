-- إصلاح updatedAt لتحديث تلقائي في PostgreSQL

-- إنشاء دالة لتحديث updatedAt تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إضافة triggers لجميع الجداول التي تحتوي على updatedAt

-- User table
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Family table
DROP TRIGGER IF EXISTS update_family_updated_at ON "Family";
CREATE TRIGGER update_family_updated_at
    BEFORE UPDATE ON "Family"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- FamilyInvitation table
DROP TRIGGER IF EXISTS update_family_invitation_updated_at ON "FamilyInvitation";
CREATE TRIGGER update_family_invitation_updated_at
    BEFORE UPDATE ON "FamilyInvitation"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
