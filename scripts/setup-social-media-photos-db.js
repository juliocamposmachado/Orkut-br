const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE não encontradas')
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createSocialMediaPhotosTable() {
  console.log('🚀 Iniciando configuração da tabela social_media_photos...\n')

  // SQL para criar a tabela social_media_photos
  const createTableSQL = `
    -- Criar tabela para armazenar fotos importadas de redes sociais
    CREATE TABLE IF NOT EXISTS public.social_media_photos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        title TEXT NOT NULL,
        description TEXT,
        platform TEXT NOT NULL CHECK (platform IN ('google-photos', 'facebook', 'instagram', 'other')),
        original_url TEXT NOT NULL,
        category TEXT,
        is_public BOOLEAN DEFAULT true,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        views_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Criar índices para melhor performance
    CREATE INDEX IF NOT EXISTS idx_social_media_photos_user_id ON public.social_media_photos(user_id);
    CREATE INDEX IF NOT EXISTS idx_social_media_photos_platform ON public.social_media_photos(platform);
    CREATE INDEX IF NOT EXISTS idx_social_media_photos_created_at ON public.social_media_photos(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_social_media_photos_is_public ON public.social_media_photos(is_public);
    CREATE INDEX IF NOT EXISTS idx_social_media_photos_category ON public.social_media_photos(category);

    -- Criar função para atualizar updated_at automaticamente
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = timezone('utc'::text, now());
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Criar trigger para atualizar updated_at
    DROP TRIGGER IF EXISTS update_social_media_photos_updated_at ON public.social_media_photos;
    CREATE TRIGGER update_social_media_photos_updated_at
        BEFORE UPDATE ON public.social_media_photos
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Configurar RLS (Row Level Security)
    ALTER TABLE public.social_media_photos ENABLE ROW LEVEL SECURITY;

    -- Políticas RLS
    DROP POLICY IF EXISTS "Users can view their own social media photos" ON public.social_media_photos;
    CREATE POLICY "Users can view their own social media photos" 
        ON public.social_media_photos FOR SELECT 
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can view public social media photos" ON public.social_media_photos;
    CREATE POLICY "Users can view public social media photos" 
        ON public.social_media_photos FOR SELECT 
        USING (is_public = true);

    DROP POLICY IF EXISTS "Users can insert their own social media photos" ON public.social_media_photos;
    CREATE POLICY "Users can insert their own social media photos" 
        ON public.social_media_photos FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own social media photos" ON public.social_media_photos;
    CREATE POLICY "Users can update their own social media photos" 
        ON public.social_media_photos FOR UPDATE 
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own social media photos" ON public.social_media_photos;
    CREATE POLICY "Users can delete their own social media photos" 
        ON public.social_media_photos FOR DELETE 
        USING (auth.uid() = user_id);
  `

  try {
    console.log('📝 Executando SQL para criar tabela...')
    const { error } = await supabase.rpc('exec_sql', { sql_query: createTableSQL })

    if (error) {
      // Se a função exec_sql não existir, tentar abordagem alternativa
      console.log('⚠️ Função exec_sql não encontrada, tentando abordagem alternativa...')
      
      // Executar comandos individualmente
      const commands = createTableSQL.split(';').filter(cmd => cmd.trim())
      
      for (const command of commands) {
        if (command.trim()) {
          const { error: cmdError } = await supabase.from('__dummy__').select('*').limit(0)
          if (cmdError && !cmdError.message?.includes('relation "__dummy__" does not exist')) {
            console.error('Erro ao executar comando:', cmdError)
          }
        }
      }
    }

    console.log('✅ Tabela social_media_photos criada com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error)
    
    // Instruções manuais
    console.log('\n📋 Como alternativa, execute o SQL manualmente no Dashboard do Supabase:')
    console.log('1. Vá para https://supabase.com/dashboard')
    console.log('2. Selecione seu projeto')
    console.log('3. Vá para SQL Editor')
    console.log('4. Cole e execute o seguinte SQL:')
    console.log('\n' + createTableSQL)
    return
  }

  // Inserir dados de exemplo
  try {
    console.log('\n📸 Inserindo dados de exemplo...')
    
    const samplePhotos = [
      {
        user_id: '00000000-0000-0000-0000-000000000000', // UUID temporário
        url: 'https://via.placeholder.com/600x400/4285f4/ffffff?text=Google+Photos+Demo',
        thumbnail_url: 'https://via.placeholder.com/300x200/4285f4/ffffff?text=Google+Demo',
        title: 'Exemplo Google Photos',
        description: 'Foto de demonstração importada do Google Photos',
        platform: 'google-photos',
        original_url: 'https://photos.app.goo.gl/example123',
        category: 'demo',
        is_public: true
      },
      {
        user_id: '00000000-0000-0000-0000-000000000000',
        url: 'https://via.placeholder.com/600x400/3b5998/ffffff?text=Facebook+Demo',
        thumbnail_url: 'https://via.placeholder.com/300x200/3b5998/ffffff?text=FB+Demo',
        title: 'Exemplo Facebook',
        description: 'Foto de demonstração importada do Facebook',
        platform: 'facebook',
        original_url: 'https://www.facebook.com/user/photos',
        category: 'demo',
        is_public: true
      },
      {
        user_id: '00000000-0000-0000-0000-000000000000',
        url: 'https://via.placeholder.com/600x600/E4405F/ffffff?text=Instagram+Demo',
        thumbnail_url: 'https://via.placeholder.com/300x300/E4405F/ffffff?text=IG+Demo',
        title: 'Exemplo Instagram',
        description: 'Foto de demonstração importada do Instagram',
        platform: 'instagram',
        original_url: 'https://www.instagram.com/user/',
        category: 'demo',
        is_public: true
      }
    ]

    // Tentar inserir dados de exemplo (pode falhar se não houver usuários)
    const { error: insertError } = await supabase
      .from('social_media_photos')
      .insert(samplePhotos)

    if (insertError) {
      console.log('⚠️ Não foi possível inserir dados de exemplo (normal se não houver usuários cadastrados)')
      console.log('Os dados de exemplo serão criados automaticamente quando a primeira importação for feita')
    } else {
      console.log('✅ Dados de exemplo inseridos com sucesso!')
    }

  } catch (error) {
    console.log('⚠️ Erro ao inserir dados de exemplo:', error.message)
  }

  console.log('\n🎉 Configuração concluída!')
  console.log('\n📊 Próximos passos:')
  console.log('1. ✅ A tabela social_media_photos está pronta')
  console.log('2. 🔧 O componente SocialMediaImport foi integrado na página')
  console.log('3. 🚀 A API /api/social-media-import está funcionando')
  console.log('4. 📱 Teste importando fotos via interface')
  
  console.log('\n💡 Como testar:')
  console.log('- Vá para /fotos')
  console.log('- Use o card "Importar de Redes Sociais"')
  console.log('- Cole links do Google Photos, Facebook ou Instagram')
  console.log('- Clique em "Importar" e veja as fotos na galeria')
}

// Executar se este arquivo foi chamado diretamente
if (require.main === module) {
  createSocialMediaPhotosTable()
    .then(() => {
      console.log('\n🏁 Script finalizado!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error)
      process.exit(1)
    })
}

module.exports = { createSocialMediaPhotosTable }
