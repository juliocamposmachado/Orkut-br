-- Função para buscar logins recentes das tabelas de autenticação
-- Esta função deve ser executada no Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_recent_logins(since_time timestamptz)
RETURNS TABLE (
  session_id uuid,
  user_id uuid,
  display_name text,
  username text,
  photo_url text,
  login_time timestamptz,
  last_activity timestamptz,
  user_agent text,
  ip inet,
  status text,
  user_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as session_id,
    s.user_id,
    COALESCE(
      u.raw_user_meta_data->>'display_name',
      u.raw_user_meta_data->>'full_name',
      split_part(u.email, '@', 1),
      'Usuário'
    ) as display_name,
    COALESCE(
      u.raw_user_meta_data->>'username',
      split_part(u.email, '@', 1),
      'usuario'
    ) as username,
    COALESCE(
      u.raw_user_meta_data->>'photo_url',
      u.raw_user_meta_data->>'avatar_url',
      ''
    ) as photo_url,
    s.created_at as login_time,
    COALESCE(s.refreshed_at, s.updated_at) as last_activity,
    s.user_agent,
    s.ip,
    CASE 
      WHEN COALESCE(s.refreshed_at, s.updated_at) > NOW() - INTERVAL '5 minutes' THEN 'online'
      WHEN COALESCE(s.refreshed_at, s.updated_at) > NOW() - INTERVAL '30 minutes' THEN 'away'
      ELSE 'offline'
    END as status,
    u.created_at as user_created_at
  FROM auth.sessions s
  JOIN auth.users u ON s.user_id = u.id
  WHERE s.created_at >= since_time
    AND u.deleted_at IS NULL
  ORDER BY s.created_at DESC
  LIMIT 20;
END;
$$;

-- Dar permissão para a função ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION get_recent_logins(timestamptz) TO authenticated;

-- Comentários para documentação
COMMENT ON FUNCTION get_recent_logins(timestamptz) IS 'Busca logins recentes das tabelas de autenticação do Supabase';
