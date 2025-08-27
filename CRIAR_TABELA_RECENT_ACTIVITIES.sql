-- Script para criar a tabela recent_activities
-- Execute este script no seu banco Supabase para habilitar as atividades recentes

-- Criar tabela recent_activities
CREATE TABLE IF NOT EXISTS recent_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('post', 'like', 'comment', 'friend_request', 'friend_accepted', 'community_joined', 'photo_added', 'profile_updated')),
  activity_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca eficiente por profile_id e data
CREATE INDEX IF NOT EXISTS idx_recent_activities_profile_id_created_at 
ON recent_activities(profile_id, created_at DESC);

-- Criar índice para busca por tipo de atividade
CREATE INDEX IF NOT EXISTS idx_recent_activities_type 
ON recent_activities(activity_type);

-- Adicionar RLS (Row Level Security)
ALTER TABLE recent_activities ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam suas próprias atividades
CREATE POLICY "Users can view own activities" ON recent_activities
    FOR SELECT USING (auth.uid() = profile_id);

-- Política para permitir que usuários criem suas próprias atividades
CREATE POLICY "Users can create own activities" ON recent_activities
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Política para permitir que usuários atualizem suas próprias atividades
CREATE POLICY "Users can update own activities" ON recent_activities
    FOR UPDATE USING (auth.uid() = profile_id);

-- Política para permitir que usuários deletem suas próprias atividades
CREATE POLICY "Users can delete own activities" ON recent_activities
    FOR DELETE USING (auth.uid() = profile_id);

-- Verificar se a tabela foi criada
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'recent_activities' 
AND table_schema = 'public';

-- Mostrar estrutura da tabela
\d recent_activities;
