const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupPhotosDatabase() {
  console.log('🔧 Configurando banco de dados para sistema de fotos...')
  
  try {
    // 1. Verificar se a tabela user_photos existe
    console.log('📊 Verificando tabelas existentes...')
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['user_photos', 'photo_likes', 'photo_comments'])
    
    console.log('Tabelas encontradas:', tables?.map(t => t.table_name) || [])
    
    // 2. Criar bucket de storage se não existir
    console.log('🗂️ Configurando storage bucket...')
    const { data: buckets } = await supabase.storage.listBuckets()
    const photoBucket = buckets?.find(b => b.name === 'user-photos')
    
    if (!photoBucket) {
      console.log('📁 Criando bucket user-photos...')
      const { error: bucketError } = await supabase.storage.createBucket('user-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
        fileSizeLimit: 10485760 // 10MB
      })
      
      if (bucketError) {
        console.error('Erro ao criar bucket:', bucketError)
      } else {
        console.log('✅ Bucket user-photos criado com sucesso!')
      }
    } else {
      console.log('✅ Bucket user-photos já existe!')
    }
    
    // 3. Executar funções SQL
    console.log('⚙️ Criando função get_photos_optimized...')
    const { error: funcError1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_photos_optimized(
          p_user_id uuid DEFAULT NULL,
          p_category text DEFAULT NULL,
          p_limit integer DEFAULT 20,
          p_offset integer DEFAULT 0,
          p_public_only boolean DEFAULT true
        )
        RETURNS TABLE (
          id uuid,
          user_id uuid,
          url text,
          thumbnail_url text,
          preview_url text,
          title varchar,
          description text,
          category varchar,
          likes_count integer,
          comments_count integer,
          views_count integer,
          created_at timestamptz,
          user_name text,
          user_avatar text
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            p.id,
            p.user_id,
            p.url,
            p.thumbnail_url,
            p.preview_url,
            p.title,
            p.description,
            p.category,
            COALESCE(likes.count, 0)::integer as likes_count,
            COALESCE(comments.count, 0)::integer as comments_count,
            p.views_count,
            p.created_at,
            prof.display_name as user_name,
            prof.photo_url as user_avatar
          FROM user_photos p
          LEFT JOIN profiles prof ON p.user_id = prof.id
          LEFT JOIN (
            SELECT photo_id, COUNT(*) as count
            FROM photo_likes
            GROUP BY photo_id
          ) likes ON p.id = likes.photo_id
          LEFT JOIN (
            SELECT photo_id, COUNT(*) as count  
            FROM photo_comments
            WHERE is_deleted = false
            GROUP BY photo_id
          ) comments ON p.id = comments.photo_id
          WHERE 
            p.is_deleted = false
            AND p.is_processed = true
            AND (p_public_only = false OR p.is_public = true)
            AND (p_user_id IS NULL OR p.user_id = p_user_id)
            AND (p_category IS NULL OR p.category = p_category)
          ORDER BY p.created_at DESC
          LIMIT p_limit
          OFFSET p_offset;
        END;
        $$;
      `
    })
    
    if (funcError1) {
      console.warn('⚠️ Função get_photos_optimized não pôde ser criada via RPC')
    } else {
      console.log('✅ Função get_photos_optimized criada!')
    }
    
    // 4. Criar função increment_photo_views
    console.log('⚙️ Criando função increment_photo_views...')
    const { error: funcError2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION increment_photo_views(
          p_photo_id uuid
        )
        RETURNS void
        LANGUAGE plpgsql
        AS $$
        BEGIN
          UPDATE user_photos 
          SET views_count = views_count + 1
          WHERE id = p_photo_id
            AND is_deleted = false;
        END;
        $$;
      `
    })
    
    if (funcError2) {
      console.warn('⚠️ Função increment_photo_views não pôde ser criada via RPC')
    } else {
      console.log('✅ Função increment_photo_views criada!')
    }
    
    // 5. Verificar se as tabelas têm dados
    console.log('📊 Verificando dados existentes...')
    const { data: photosCount } = await supabase
      .from('user_photos')
      .select('id', { count: 'exact' })
      .limit(1)
    
    console.log(`📷 Fotos existentes: ${photosCount?.length || 0}`)
    
    // 6. Testar a função
    console.log('🧪 Testando função get_photos_optimized...')
    const { data: testPhotos, error: testError } = await supabase
      .rpc('get_photos_optimized', {
        p_limit: 5,
        p_offset: 0,
        p_public_only: true
      })
    
    if (testError) {
      console.error('❌ Erro ao testar função:', testError.message)
      console.log('💡 A função pode precisar ser criada manualmente no Supabase Dashboard')
    } else {
      console.log('✅ Função testada com sucesso!')
      console.log(`📊 Retornou ${testPhotos?.length || 0} fotos`)
    }
    
    console.log('\n🎉 Configuração do banco de dados concluída!')
    console.log('🔧 Se as funções não foram criadas automaticamente, execute o SQL manualmente no Supabase Dashboard:')
    console.log('   1. Acesse https://supabase.com/dashboard')
    console.log('   2. Vá em SQL Editor')
    console.log('   3. Execute o conteúdo do arquivo sql/create_photos_functions.sql')
    
  } catch (error) {
    console.error('❌ Erro durante configuração:', error)
    process.exit(1)
  }
}

// Executar setup
setupPhotosDatabase()
