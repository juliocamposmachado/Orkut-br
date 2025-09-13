-- 🗄️ SCHEMA COMPLETO - ORKUT PROJETO
-- Execute este script no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/wjglxlnbizbqwpkvihsy/sql

-- =====================================================================================
-- TABELAS PRINCIPAIS
-- =====================================================================================

-- Perfis de usuários (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  photo_url text DEFAULT 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'::text,
  relationship text DEFAULT 'Solteiro(a)'::text,
  location text DEFAULT ''::text,
  birthday date,
  bio text DEFAULT ''::text,
  fans_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  posts_count integer DEFAULT 0,
  email text,
  phone text,
  role text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Posts do feed
CREATE TABLE IF NOT EXISTS public.posts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  author uuid NOT NULL,
  content text NOT NULL,
  photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  author_name text,
  author_photo text,
  visibility text DEFAULT 'public'::text,
  shares_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_hidden boolean DEFAULT false,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_author_fkey FOREIGN KEY (author) REFERENCES public.profiles(id)
);

-- Comentários
CREATE TABLE IF NOT EXISTS public.comments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  post_id bigint NOT NULL,
  profile_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT comments_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

-- Curtidas
CREATE TABLE IF NOT EXISTS public.likes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  post_id bigint NOT NULL,
  profile_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT likes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT likes_unique UNIQUE (post_id, profile_id)
);

-- Amizades
CREATE TABLE IF NOT EXISTS public.friendships (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'blocked'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT friendships_pkey PRIMARY KEY (id),
  CONSTRAINT friendships_addressee_id_fkey FOREIGN KEY (addressee_id) REFERENCES public.profiles(id),
  CONSTRAINT friendships_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.profiles(id),
  CONSTRAINT friendships_unique UNIQUE (requester_id, addressee_id)
);

-- Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  from_profile_id uuid NOT NULL,
  to_profile_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_from_profile_id_fkey FOREIGN KEY (from_profile_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_to_profile_id_fkey FOREIGN KEY (to_profile_id) REFERENCES public.profiles(id)
);

-- Comunidades
CREATE TABLE IF NOT EXISTS public.communities (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  description text DEFAULT ''::text,
  category text DEFAULT 'Geral'::text,
  owner uuid,
  members_count integer DEFAULT 0,
  photo_url text DEFAULT 'https://images.pexels.com/photos/1595391/pexels-photo-1595391.jpeg?auto=compress&cs=tinysrgb&w=200'::text,
  created_at timestamp with time zone DEFAULT now(),
  visibility text DEFAULT 'public'::text CHECK (visibility = ANY (ARRAY['public'::text, 'private'::text, 'restricted'::text])),
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT communities_pkey PRIMARY KEY (id),
  CONSTRAINT communities_owner_fkey FOREIGN KEY (owner) REFERENCES auth.users(id)
);

-- Membros das comunidades
CREATE TABLE IF NOT EXISTS public.community_members (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  community_id bigint NOT NULL,
  profile_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'member'::text CHECK (role = ANY (ARRAY['member'::text, 'moderator'::text, 'admin'::text])),
  is_banned boolean DEFAULT false,
  CONSTRAINT community_members_pkey PRIMARY KEY (id),
  CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT community_members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT community_members_unique UNIQUE (community_id, profile_id)
);

-- Posts das comunidades
CREATE TABLE IF NOT EXISTS public.community_posts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  community_id bigint NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_posts_pkey PRIMARY KEY (id),
  CONSTRAINT community_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id),
  CONSTRAINT community_posts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id)
);

-- Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  profile_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['like'::text, 'comment'::text, 'friend_request'::text, 'mention'::text, 'community_activity'::text])),
  payload jsonb NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES auth.users(id)
);

-- =====================================================================================
-- RLS POLICIES
-- =====================================================================================

-- Ativar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies para posts
CREATE POLICY "Public posts are viewable by everyone" ON public.posts FOR SELECT USING (visibility = 'public' OR author = auth.uid());
CREATE POLICY "Users can insert their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author);

-- Policies para comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = profile_id);

-- Policies para likes
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING (auth.uid() = profile_id);

-- Policies para notificações
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = profile_id);

-- =====================================================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================================================

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name', new.email);
  RETURN new;
END;
$$;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================================================

CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts (author);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments (post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes (post_id);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships (requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships (addressee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON public.notifications (profile_id);

-- =====================================================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================================================

-- Criar uma tabela de exemplo para testar
CREATE TABLE IF NOT EXISTS public.todos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  content text,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own todos" ON public.todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own todos" ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todos" ON public.todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own todos" ON public.todos FOR DELETE USING (auth.uid() = user_id);
