-- ========================================
-- CORREÇÃO DOS WARNINGS DE SEGURANÇA DO SUPABASE
-- ========================================
-- Este script corrige os warnings de segurança identificados pelo Security Advisor

-- 1. Corrigir função set_updated_at (adicionar search_path seguro)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Corrigir função send_friend_request_notification (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_friend_request_notification') THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.send_friend_request_notification(
          addressee_id UUID,
          requester_data JSONB
        )
        RETURNS VOID 
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public, pg_catalog
        AS $func$
        BEGIN
          INSERT INTO notifications (
            profile_id,
            type,
            payload,
            read,
            created_at
          ) VALUES (
            addressee_id,
            ''friend_request'',
            requester_data,
            false,
            NOW()
          );
        END;
        $func$;';
    END IF;
END
$$;

-- 3. Corrigir função handle_new_friend_request (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_friend_request') THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.handle_new_friend_request()
        RETURNS TRIGGER 
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public, pg_catalog
        AS $func$
        DECLARE
          requester_info RECORD;
        BEGIN
          -- Buscar informações do solicitante
          SELECT id, display_name, username, photo_url
          INTO requester_info
          FROM profiles
          WHERE id = NEW.requester_id;
          
          -- Criar notificação se for um novo pedido
          IF NEW.status = ''pending'' THEN
            INSERT INTO notifications (
              profile_id,
              type,
              payload,
              read,
              created_at
            ) VALUES (
              NEW.addressee_id,
              ''friend_request'',
              jsonb_build_object(
                ''friendship_id'', NEW.id,
                ''from_user'', jsonb_build_object(
                  ''id'', requester_info.id,
                  ''display_name'', requester_info.display_name,
                  ''username'', requester_info.username,
                  ''photo_url'', requester_info.photo_url
                )
              ),
              false,
              NOW()
            );
          END IF;
          
          RETURN NEW;
        END;
        $func$;';
    END IF;
END
$$;

-- 4. Corrigir função debug_auth_context (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'debug_auth_context') THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.debug_auth_context()
        RETURNS JSON
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public, pg_catalog
        AS $func$
        BEGIN
          RETURN json_build_object(
            ''current_user'', current_user,
            ''current_role'', current_setting(''role'', true),
            ''auth_uid'', auth.uid(),
            ''auth_role'', auth.role(),
            ''current_setting_jwt_claims'', current_setting(''request.jwt.claims'', true)::json
          );
        EXCEPTION
          WHEN OTHERS THEN
            RETURN json_build_object(
              ''error'', SQLERRM,
              ''current_user'', current_user
            );
        END;
        $func$;';
    END IF;
END
$$;

-- 5. Criar uma função helper para definir search_path seguro em todas as funções
CREATE OR REPLACE FUNCTION public.fix_all_function_search_paths()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    func_record RECORD;
    result_text TEXT := '';
    fixed_count INTEGER := 0;
BEGIN
    -- Buscar todas as funções no schema public que não têm search_path definido
    FOR func_record IN
        SELECT 
            p.proname as function_name,
            p.oid,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname NOT IN ('fix_all_function_search_paths') -- Excluir esta própria função
        AND NOT EXISTS (
            SELECT 1 FROM pg_proc_config(p.oid) 
            WHERE split_part(unnest, '=', 1) = 'search_path'
        )
    LOOP
        BEGIN
            -- Tentar definir search_path para a função
            EXECUTE format(
                'ALTER FUNCTION public.%I(%s) SET search_path = public, pg_catalog',
                func_record.function_name,
                func_record.args
            );
            
            fixed_count := fixed_count + 1;
            result_text := result_text || format('✓ Fixed: %s(%s)' || chr(10), 
                func_record.function_name, func_record.args);
                
        EXCEPTION
            WHEN OTHERS THEN
                result_text := result_text || format('✗ Failed: %s(%s) - %s' || chr(10), 
                    func_record.function_name, func_record.args, SQLERRM);
        END;
    END LOOP;
    
    result_text := format('Security fix completed! Fixed %s functions:' || chr(10) || '%s', 
        fixed_count, result_text);
    
    RETURN result_text;
END;
$$;

-- 6. Executar a correção automática de todas as funções
SELECT fix_all_function_search_paths();

-- 7. Remover a função helper após o uso
DROP FUNCTION IF EXISTS public.fix_all_function_search_paths();

-- ========================================
-- INSTRUÇÕES PARA HABILITAR LEAKED PASSWORD PROTECTION
-- ========================================

/*
IMPORTANTE: Para corrigir o warning "Leaked Password Protection Disabled", 
siga estes passos no Dashboard do Supabase:

1. Vá para o Dashboard do Supabase (https://supabase.com/dashboard)
2. Selecione seu projeto: Orkut-Br
3. No menu lateral, clique em "Authentication" 
4. Clique em "Settings"
5. Na seção "Security", encontre "Password protection"
6. Ative a opção "Enable HaveIBeenPwned integration"
7. Clique em "Save" para salvar as configurações

Esta opção impede que usuários usem senhas que foram comprometidas em vazamentos 
de dados conhecidos, melhorando significativamente a segurança do sistema.

Alternativamente, você pode habilitar via API REST:
curl -X PUT 'https://api.supabase.com/v1/projects/YOUR_PROJECT_ID/config/auth' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password_protection": {"haveibeenpwned": true}}'
*/

-- ========================================
-- VERIFICAÇÃO DOS RESULTADOS
-- ========================================

-- Verificar se as funções agora têm search_path definido
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as args,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc_config(p.oid) 
            WHERE split_part(unnest, '=', 1) = 'search_path'
        ) THEN '✓ Fixed'
        ELSE '✗ Still needs fix'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'set_updated_at',
    'send_friend_request_notification', 
    'handle_new_friend_request',
    'debug_auth_context'
)
ORDER BY p.proname;

-- Listar todas as funções públicas e seu status de search_path
SELECT 
    p.proname as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc_config(p.oid) 
            WHERE split_part(unnest, '=', 1) = 'search_path'
        ) THEN '✓ Secure'
        ELSE '⚠ Needs attention'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
