-- Tabela para armazenar preferências de tema dos usuários
CREATE TABLE public.user_theme_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  
  -- Tema de cores (light, dark, blue, etc.)
  color_theme text NOT NULL DEFAULT 'purple',
  
  -- Tema visual completo (JSON com id, name, colorTheme, wallpaper)
  visual_theme jsonb DEFAULT '{
    "id": "orkut-classic",
    "name": "Orkut Clássico",
    "description": "O visual nostálgico do Orkut original",
    "colorTheme": "purple",
    "wallpaper": {
      "type": "gradient",
      "value": "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)",
      "name": "Gradiente Orkut"
    }
  }'::jsonb,
  
  -- Wallpaper atual (JSON com type, value, name)
  wallpaper jsonb DEFAULT '{
    "type": "gradient",
    "value": "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)",
    "name": "Gradiente Orkut"
  }'::jsonb,
  
  -- Metadados adicionais
  is_dark_mode boolean DEFAULT false,
  custom_css text DEFAULT NULL,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT user_theme_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_theme_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Validações
  CONSTRAINT valid_color_theme CHECK (
    color_theme IN ('light', 'dark', 'blue', 'green', 'purple', 'pink', 'orange', 'red', 'teal', 'indigo', 'yellow', 'slate')
  ),
  
  CONSTRAINT valid_wallpaper_type CHECK (
    wallpaper->>'type' IN ('solid', 'gradient', 'pattern', 'image')
  )
);

-- Índices para performance
CREATE INDEX idx_user_theme_preferences_user_id ON public.user_theme_preferences(user_id);
CREATE INDEX idx_user_theme_preferences_color_theme ON public.user_theme_preferences(color_theme);

-- RLS (Row Level Security)
ALTER TABLE public.user_theme_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: usuários só podem ver/editar seus próprios temas
CREATE POLICY "Users can view own theme preferences"
  ON public.user_theme_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own theme preferences"
  ON public.user_theme_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own theme preferences"
  ON public.user_theme_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own theme preferences"
  ON public.user_theme_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Função para criar preferência padrão automaticamente
CREATE OR REPLACE FUNCTION public.create_default_theme_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_theme_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar preferências automaticamente quando usuário é criado
CREATE TRIGGER on_auth_user_created_create_theme_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_theme_preferences();

-- Comentários para documentação
COMMENT ON TABLE public.user_theme_preferences IS 'Armazena as preferências de tema visual de cada usuário do sistema';
COMMENT ON COLUMN public.user_theme_preferences.visual_theme IS 'Tema visual completo em JSON com todas as configurações';
COMMENT ON COLUMN public.user_theme_preferences.wallpaper IS 'Configuração do papel de parede em JSON';
COMMENT ON COLUMN public.user_theme_preferences.custom_css IS 'CSS personalizado opcional do usuário';
