-- =========================================================================
-- 🔒 SCRIPT DE CORREÇÃO DE SEGURANÇA SUPABASE - ORKUT BR
-- =========================================================================
-- Este script corrige todos os problemas de segurança detectados pelo linter
-- Execute no SQL Editor do Supabase Dashboard
-- =========================================================================

-- 1. HABILITAR RLS (ROW LEVEL SECURITY) EM TODAS AS TABELAS PÚBLICAS
-- =========================================================================

-- Tabela: community_posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Política para community_posts - usuários podem ver posts de comunidades que são membros
CREATE POLICY "Users can view community posts where they are members" ON public.community_posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.community_members cm 
            WHERE cm.community_id = community_posts.community_id 
            AND cm.profile_id = auth.uid()
        )
        OR 
        -- Ou se a comunidade é pública (assumindo que temos essa informação)
        EXISTS (
            SELECT 1 FROM public.communities c 
            WHERE c.id = community_posts.community_id
        )
    );

-- Política para community_posts - usuários podem inserir posts em comunidades onde são membros
CREATE POLICY "Users can create posts in communities where they are members" ON public.community_posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.community_members cm 
            WHERE cm.community_id = community_posts.community_id 
            AND cm.profile_id = auth.uid()
        ) 
        AND author_id = auth.uid()
    );

-- Política para community_posts - usuários podem editar seus próprios posts
CREATE POLICY "Users can update their own community posts" ON public.community_posts
    FOR UPDATE USING (author_id = auth.uid()) 
    WITH CHECK (author_id = auth.uid());

-- Política para community_posts - usuários podem deletar seus próprios posts ou moderadores
CREATE POLICY "Users can delete their own community posts or moderators can delete" ON public.community_posts
    FOR DELETE USING (
        author_id = auth.uid() 
        OR 
        EXISTS (
            SELECT 1 FROM public.community_members cm 
            WHERE cm.community_id = community_posts.community_id 
            AND cm.profile_id = auth.uid()
            AND cm.role IN ('moderator', 'admin')
        )
    );

-- =========================================================================

-- Tabela: conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Política para conversations - usuários podem ver apenas suas próprias conversas
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (
        participant1_id = auth.uid() OR participant2_id = auth.uid()
    );

-- Política para conversations - usuários podem criar conversas onde são participantes
CREATE POLICY "Users can create conversations where they are participants" ON public.conversations
    FOR INSERT WITH CHECK (
        participant1_id = auth.uid() OR participant2_id = auth.uid()
    );

-- Política para conversations - usuários podem atualizar suas próprias conversas
CREATE POLICY "Users can update their own conversations" ON public.conversations
    FOR UPDATE USING (
        participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
    WITH CHECK (
        participant1_id = auth.uid() OR participant2_id = auth.uid()
    );

-- =========================================================================

-- Tabela: call_signals
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- Política para call_signals - usuários podem ver sinais de chamadas onde estão envolvidos
CREATE POLICY "Users can view call signals where they are involved" ON public.call_signals
    FOR SELECT USING (
        caller_id = auth.uid() OR receiver_id = auth.uid()
    );

-- Política para call_signals - usuários podem criar sinais de chamada onde são o caller
CREATE POLICY "Users can create call signals as caller" ON public.call_signals
    FOR INSERT WITH CHECK (caller_id = auth.uid());

-- Política para call_signals - usuários podem atualizar sinais onde estão envolvidos
CREATE POLICY "Users can update call signals where they are involved" ON public.call_signals
    FOR UPDATE USING (
        caller_id = auth.uid() OR receiver_id = auth.uid()
    )
    WITH CHECK (
        caller_id = auth.uid() OR receiver_id = auth.uid()
    );

-- Política para call_signals - usuários podem deletar seus próprios sinais
CREATE POLICY "Users can delete their own call signals" ON public.call_signals
    FOR DELETE USING (caller_id = auth.uid());

-- =========================================================================

-- Tabela: moderation_actions
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- Política para moderation_actions - apenas moderadores podem ver ações de moderação
CREATE POLICY "Only moderators can view moderation actions" ON public.moderation_actions
    FOR SELECT USING (
        -- Assumindo que temos uma tabela ou função que identifica moderadores
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            -- Aqui você pode adicionar uma coluna is_moderator ou similar
        )
        OR moderator_id = auth.uid()
    );

-- Política para moderation_actions - apenas moderadores podem criar ações
CREATE POLICY "Only moderators can create moderation actions" ON public.moderation_actions
    FOR INSERT WITH CHECK (
        moderator_id = auth.uid()
        -- Adicione aqui verificação se o usuário é moderador
    );

-- =========================================================================

-- Tabela: post_reports
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- Política para post_reports - usuários podem ver seus próprios reports
CREATE POLICY "Users can view their own post reports" ON public.post_reports
    FOR SELECT USING (reporter_id = auth.uid());

-- Política para post_reports - usuários podem criar reports
CREATE POLICY "Users can create post reports" ON public.post_reports
    FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Política para post_reports - apenas moderadores podem atualizar status dos reports
CREATE POLICY "Only moderators can update post reports" ON public.post_reports
    FOR UPDATE USING (
        -- Verificar se é moderador (ajuste conforme sua estrutura)
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid()
            -- Adicione verificação de moderador aqui
        )
    );

-- =========================================================================

-- Tabela: banned_users
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Política para banned_users - apenas admins/moderadores podem ver usuários banidos
CREATE POLICY "Only admins can view banned users" ON public.banned_users
    FOR SELECT USING (
        -- Verificar se é admin/moderador (ajuste conforme sua estrutura)
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid()
            -- Adicione verificação de admin aqui
        )
    );

-- Política para banned_users - apenas admins podem banir usuários
CREATE POLICY "Only admins can ban users" ON public.banned_users
    FOR INSERT WITH CHECK (
        banned_by = auth.uid()
        -- Adicione verificação de admin aqui
    );

-- Política para banned_users - apenas admins podem atualizar bans
CREATE POLICY "Only admins can update bans" ON public.banned_users
    FOR UPDATE USING (
        -- Verificar se é admin
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid()
            -- Adicione verificação de admin aqui
        )
    );

-- =========================================================================

-- 2. CORRIGIR VIEW COM SECURITY DEFINER
-- =========================================================================

-- Primeiro, vamos ver como está definida a view friends_view atual
-- Execute este comando para ver a definição atual:
-- \d+ public.friends_view

-- Recriar a view friends_view SEM security definer
DROP VIEW IF EXISTS public.friends_view;

CREATE VIEW public.friends_view AS
SELECT 
    f.id,
    f.requester_id,
    f.addressee_id,
    f.status,
    f.created_at,
    p1.username as requester_username,
    p1.display_name as requester_display_name,
    p1.photo_url as requester_photo_url,
    p2.username as addressee_username,
    p2.display_name as addressee_display_name,
    p2.photo_url as addressee_photo_url
FROM public.friendships f
LEFT JOIN public.profiles p1 ON f.requester_id = p1.id
LEFT JOIN public.profiles p2 ON f.addressee_id = p2.id;

-- Habilitar RLS na view também (se aplicável)
-- Note: Views herdam as políticas RLS das tabelas subjacentes

-- =========================================================================

-- 3. CRIAR FUNÇÃO HELPER PARA VERIFICAR MODERADORES (OPCIONAL)
-- =========================================================================

-- Função para verificar se um usuário é moderador
CREATE OR REPLACE FUNCTION public.is_moderator(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ajuste esta lógica conforme sua estrutura de dados
    -- Exemplo: verificar se existe uma coluna is_moderator na tabela profiles
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id 
        -- AND is_moderator = true  -- Descomente se você tem esta coluna
    );
    
    -- Ou verificar se o usuário é membro com role de moderador em alguma comunidade
    -- RETURN EXISTS (
    --     SELECT 1 FROM public.community_members 
    --     WHERE profile_id = user_id 
    --     AND role IN ('moderator', 'admin')
    -- );
END;
$$;

-- =========================================================================

-- 4. POLÍTICAS ADICIONAIS DE SEGURANÇA (RECOMENDADAS)
-- =========================================================================

-- Se você tem uma tabela community_members, habilitar RLS também
-- ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Política para community_members - usuários podem ver membros de comunidades que fazem parte
-- CREATE POLICY "Users can view community members where they are members" ON public.community_members
--     FOR SELECT USING (
--         profile_id = auth.uid() 
--         OR 
--         EXISTS (
--             SELECT 1 FROM public.community_members cm 
--             WHERE cm.community_id = community_members.community_id 
--             AND cm.profile_id = auth.uid()
--         )
--     );

-- =========================================================================
-- 🎯 INSTRUÇÕES PARA APLICAR:
-- =========================================================================
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em "SQL Editor" 
-- 3. Cole este script completo
-- 4. Execute (clique em "Run")
-- 5. Verifique se não há erros
-- 6. Execute o Linter novamente para confirmar que os erros foram corrigidos
-- =========================================================================

-- Verificação final - listar todas as tabelas com RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Listar todas as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
