# 📱 Importação de Fotos de Redes Sociais

Este documento explica o novo recurso de importação de fotos de redes sociais no Orkut.

## 🎯 Objetivo

Permitir que os usuários importem fotos públicas diretamente de suas redes sociais (Google Photos, Facebook, Instagram) para a galeria do Orkut com apenas alguns cliques.

## 🚀 Recursos Implementados

### 1. **Componente de Interface**
- **Arquivo**: `components/photos/social-media-import.tsx`
- **Funcionalidades**:
  - Interface intuitiva para adicionar links
  - Detecção automática da plataforma (Google Photos, Facebook, Instagram)
  - Validação de URLs em tempo real
  - Preview das fotos importadas
  - Status de progresso durante importação

### 2. **API de Processamento**
- **Arquivo**: `app/api/social-media-import/route.ts`
- **Endpoints**:
  - `POST /api/social-media-import` - Importar fotos de um link
  - `GET /api/social-media-import` - Listar fotos importadas
- **Funcionalidades**:
  - Validação de URLs por plataforma
  - Extração de metadados (título, descrição)
  - Fallback para tabela principal se tabela específica não existir

### 3. **Banco de Dados**
- **Tabela**: `social_media_photos`
- **Script**: `scripts/setup-social-media-photos-db.js`
- **Campos**:
  - `id` - UUID único
  - `user_id` - Referência ao usuário
  - `url` - URL da foto
  - `thumbnail_url` - URL da miniatura
  - `title` - Título da foto
  - `description` - Descrição
  - `platform` - Plataforma de origem
  - `original_url` - URL original do link
  - `category` - Categoria
  - `is_public` - Visibilidade
  - `likes_count`, `comments_count`, `views_count` - Estatísticas
  - `created_at`, `updated_at` - Timestamps

## 📋 Como Usar

### Para Usuários

1. **Acesse a página de Fotos** (`/fotos`)
2. **Encontre o card "Importar de Redes Sociais"**
3. **Cole o link da sua rede social**:
   - **Google Photos**: `https://photos.app.goo.gl/DAKV2gftsTfQVtxV9`
   - **Facebook**: `https://www.facebook.com/usuario/photos`
   - **Instagram**: `https://www.instagram.com/usuario/`
4. **Clique em "Adicionar"** para adicionar à lista
5. **Clique em "Importar"** para processar todos os links
6. **Aguarde o processamento** e veja as fotos na galeria

### Para Desenvolvedores

#### 1. Configurar Banco de Dados

```bash
# Executar o script de configuração
node scripts/setup-social-media-photos-db.js
```

#### 2. Usar o Componente

```tsx
import { SocialMediaImport } from '@/components/photos/social-media-import'

<SocialMediaImport 
  onImportComplete={(photos) => {
    console.log('Fotos importadas:', photos)
    // Atualizar galeria, mostrar notificação, etc.
  }}
/>
```

#### 3. API Usage

```typescript
// Importar fotos
const response = await fetch('/api/social-media-import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://photos.app.goo.gl/example',
    platform: 'google-photos',
    title: 'Meu álbum',
    description: 'Fotos das férias'
  })
})

// Listar fotos importadas
const photos = await fetch('/api/social-media-import?platform=instagram&public=true')
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Dependências

```json
{
  "@supabase/supabase-js": "^2.x.x",
  "lucide-react": "^0.x.x",
  "sonner": "^1.x.x"
}
```

## 🔍 Plataformas Suportadas

### Google Photos
- **URLs suportadas**:
  - `https://photos.app.goo.gl/[ID]`
  - `https://photos.google.com/share/[ID]`
  - Links diretos do Google Drive
- **Limitações**: Por políticas do Google, importa dados simulados. Para produção, usar Google Photos API.

### Facebook
- **URLs suportadas**:
  - `https://www.facebook.com/[usuario]/photos`
  - `https://facebook.com/[usuario]/photos`
- **Limitações**: Por políticas do Facebook, importa dados simulados. Para produção, usar Graph API.

### Instagram
- **URLs suportadas**:
  - `https://www.instagram.com/[usuario]/`
  - `https://instagram.com/[usuario]/`
- **Limitações**: Por políticas do Instagram, importa dados simulados. Para produção, usar Instagram Basic Display API.

## ⚠️ Limitações Atuais

### 1. **APIs Simuladas**
- Por limitações de CORS e políticas das redes sociais
- Retorna dados de demonstração (placeholders)
- Em produção, seria necessário usar APIs oficiais

### 2. **Apenas Fotos Públicas**
- Só é possível importar conteúdo público
- Requer autenticação específica para conteúdo privado

### 3. **Rate Limiting**
- Sem limitação de taxa implementada
- Pode ser necessário em produção

## 🚀 Melhorias Futuras

### 1. **APIs Reais**
```typescript
// Google Photos API
const googlePhotos = new GooglePhotos(accessToken)
const photos = await googlePhotos.getAlbumPhotos(albumId)

// Facebook Graph API  
const facebook = new FacebookAPI(accessToken)
const photos = await facebook.getPhotos(userId)

// Instagram Basic Display API
const instagram = new InstagramAPI(accessToken)
const media = await instagram.getUserMedia(userId)
```

### 2. **Processamento em Background**
- Queue system (Bull, Agenda)
- Progress tracking
- Error handling e retry

### 3. **Mais Plataformas**
- Flickr
- 500px
- Pinterest
- Twitter/X

### 4. **Features Avançadas**
- Sync automático
- Duplicate detection
- Bulk operations
- Advanced filtering

## 🔐 Segurança

### 1. **Row Level Security (RLS)**
- Usuários só veem suas próprias fotos
- Fotos públicas visíveis para todos
- Políticas automáticas no Supabase

### 2. **Validação**
- URLs validadas no client e server
- Sanitização de dados
- Type checking

### 3. **Rate Limiting** (Futuro)
```typescript
// Implementar rate limiting
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10 // máximo 10 importações por janela
}
```

## 📊 Monitoramento

### 1. **Logs**
```typescript
console.log('📱 Fotos importadas:', {
  platform: 'instagram',
  count: photos.length,
  user: user.id
})
```

### 2. **Métricas** (Futuro)
- Número de importações por plataforma
- Taxa de sucesso/falha
- Tempo médio de processamento

## 🐛 Troubleshooting

### 1. **Erro de CORS**
```
Access to fetch at '...' has been blocked by CORS policy
```
**Solução**: Normal para APIs externas. Use APIs oficiais em produção.

### 2. **Tabela não encontrada**
```
relation "social_media_photos" does not exist
```
**Solução**: Execute o script de setup:
```bash
node scripts/setup-social-media-photos-db.js
```

### 3. **URLs inválidas**
```
URL não é válida para a plataforma selecionada
```
**Solução**: Verifique o formato da URL e tente novamente.

## 📝 Changelog

### v1.0.0 (2024-01-XX)
- ✅ Componente SocialMediaImport criado
- ✅ API /api/social-media-import implementada
- ✅ Tabela social_media_photos configurada
- ✅ Integração na página /fotos
- ✅ Suporte para Google Photos, Facebook, Instagram
- ✅ Fallback para tabela photos existente
- ✅ RLS e políticas de segurança
- ✅ Interface responsiva e intuitiva

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch para sua feature
3. Implemente os testes
4. Faça commit das mudanças
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License.
