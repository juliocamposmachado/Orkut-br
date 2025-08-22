-- Script para configurar Google OAuth no Supabase
-- Cole este código no SQL Editor do Supabase

-- 1. Verificar se a tabela profiles existe e tem as colunas necessárias
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Se a tabela profiles não existir, criar ela
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    photo_url TEXT,
    bio TEXT,
    location TEXT,
    birthday DATE,
    relationship TEXT DEFAULT 'Solteiro(a)',
    fans_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS (Row Level Security) na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Política para usuários poderem ver todos os perfis públicos
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- 5. Política para usuários editarem apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 6. Política para inserir perfil próprio
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para executar a função quando novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9. Verificar usuários existentes
SELECT id, email, raw_user_meta_data, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 10. Verificar perfis existentes
SELECT id, username, display_name, photo_url, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 11. Script para limpar dados de teste (CUIDADO - só use se necessário)
-- DELETE FROM profiles WHERE username LIKE 'test%';
-- DELETE FROM auth.users WHERE email LIKE 'test%';

COMMENT ON TABLE profiles IS 'Tabela de perfis de usuários com suporte a OAuth do Google';
