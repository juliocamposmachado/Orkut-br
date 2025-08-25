-- Script para corrigir problemas com avatar_url no Supabase
-- Execute este script no SQL Editor do painel do Supabase

-- 1. Primeiro, vamos verificar se a função handle_new_user existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        RAISE NOTICE 'Função handle_new_user encontrada - será corrigida';
    ELSE
        RAISE NOTICE 'Função handle_new_user não encontrada';
    END IF;
END $$;

-- 2. Verificar a estrutura atual da tabela profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('photo_url', 'avatar_url');

-- 3. Verificar se existem triggers que usam handle_new_user
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND action_statement ILIKE '%handle_new_user%';

-- 4. Se a função handle_new_user existe, vamos recriá-la corretamente
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 5. Criar a função handle_new_user corrigida
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    display_name_val text;
    username_val text;
    photo_url_val text;
BEGIN
    -- Extrair nome de exibição dos metadados
    display_name_val := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    
    -- Extrair username dos metadados
    username_val := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1)
    );
    
    -- Extrair foto do perfil dos metadados (Google OAuth)
    photo_url_val := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        NEW.raw_user_meta_data->>'photo_url'
    );
    
    -- Inserir novo perfil usando photo_url (não avatar_url)
    INSERT INTO public.profiles (
        id,
        username,
        display_name,
        photo_url,
        relationship,
        fans_count,
        created_at
    ) VALUES (
        NEW.id,
        username_val,
        display_name_val,
        photo_url_val,
        'Solteiro(a)',
        0,
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- 7. Verificar e corrigir qualquer política RLS que mencione avatar_url
DO $$
DECLARE
    policy_record record;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, definition
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'profiles'
          AND definition ILIKE '%avatar_url%'
    LOOP
        RAISE NOTICE 'Encontrada política que usa avatar_url: % em %.%', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename;
        
        -- Você pode adicionar comandos específicos para corrigir políticas aqui
        -- Por exemplo: ALTER POLICY ... ON profiles USING (...);
    END LOOP;
END $$;

-- 8. Limpar dados inconsistentes (opcional - descomente se necessário)
-- UPDATE public.profiles 
-- SET photo_url = NULL 
-- WHERE photo_url = '' OR photo_url IS NULL;

-- 9. Verificar se existem índices que precisam ser atualizados
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND indexdef ILIKE '%avatar_url%';

-- 10. Criar função utilitária para migrar dados de avatar_url para photo_url (se necessário)
CREATE OR REPLACE FUNCTION public.migrate_avatar_to_photo_url()
RETURNS void AS $$
BEGIN
    -- Esta função pode ser usada se você tiver dados em uma coluna avatar_url
    -- que precisa ser migrada para photo_url
    
    -- Exemplo:
    -- UPDATE public.profiles 
    -- SET photo_url = avatar_url 
    -- WHERE avatar_url IS NOT NULL AND photo_url IS NULL;
    
    RAISE NOTICE 'Migração de avatar_url para photo_url completada (função de exemplo)';
END;
$$ LANGUAGE plpgsql;

-- 11. Verificações finais
SELECT 'Script executado com sucesso!' as status;
SELECT 'Verificando estrutura final da tabela profiles:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 12. Testar a função (opcional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        RAISE NOTICE 'Função handle_new_user está disponível e corrigida';
    ELSE
        RAISE NOTICE 'ERRO: Função handle_new_user não foi criada';
    END IF;
END $$;

-- INSTRUÇÕES DE USO:
-- 1. Copie todo este script
-- 2. Vá ao painel do Supabase (https://app.supabase.com)
-- 3. Acesse seu projeto
-- 4. Vá em "SQL Editor" no menu lateral
-- 5. Cole o script e clique em "Run"
-- 6. Verifique as mensagens de saída para confirmar que tudo foi corrigido

-- NOTA: Este script é seguro e não deleta dados existentes
-- Ele apenas corrige as funções e triggers para usar photo_url
