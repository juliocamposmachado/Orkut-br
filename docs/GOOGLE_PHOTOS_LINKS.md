# Sistema de Links do Google Photos

## 📖 Visão Geral

Este sistema permite aos usuários do Orkut adicionar fotos do Google Photos através de links compartilháveis, sem precisar fazer upload físico dos arquivos. As fotos são exibidas em uma galeria integrada que puxa os dados diretamente dos links salvos.

## ✨ Funcionalidades

### 🎯 Principais Recursos
- **Drag & Drop**: Arraste links do Google Photos diretamente para o componente
- **Input Manual**: Cole links manualmente com título e categoria opcionais
- **Galeria Integrada**: Visualize todas as fotos em um formato responsivo
- **Filtros Inteligentes**: Busque por título, categoria ou usuário
- **Estatísticas**: Veja curtidas, visualizações e análise por categoria
- **Gerenciamento**: Adicione e remova fotos facilmente

### 🔧 Componentes Implementados

1. **GooglePhotosDragDrop** (`components/photos/google-photos-drag-drop.tsx`)
   - Interface para adicionar links
   - Suporte a drag & drop
   - Validação de URLs
   - Formulário com campos opcionais

2. **GooglePhotosGallery** (`components/photos/google-photos-gallery.tsx`)
   - Exibição em grid ou lista
   - Filtros de busca e categoria
   - Estatísticas em tempo real
   - Interação com fotos

3. **API de Links** (`app/api/google-photos-links/route.ts`)
   - CRUD completo para links
   - Políticas de segurança (RLS)
   - Validação de URLs
   - Suporte a paginação

4. **Hook personalizado** (`hooks/use-google-photos-links.ts`)
   - Gerenciamento de estado
   - Cache automático
   - Error handling
   - Estatísticas em tempo real

## 🗄️ Estrutura do Banco de Dados

### Tabela: `google_photos_links`

```sql
CREATE TABLE google_photos_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Segurança (RLS)
- Usuários veem apenas suas fotos privadas + todas as públicas
- Apenas o proprietário pode modificar/deletar suas fotos
- Políticas automáticas de controle de acesso

## 📝 Como Usar

### 1. Configuração Inicial

Execute a migração SQL no Supabase:
```bash
# Copie o conteúdo de supabase/migrations/20240107000000_create_google_photos_links_table.sql
# Cole no editor SQL do Supabase e execute
```

### 2. Adicionando Fotos

#### Via Interface Web:
1. Acesse `/fotos` no Orkut
2. Localize o card "Adicionar do Google Photos"
3. Abra o Google Photos em nova aba
4. Compartilhe uma foto → Copiar link
5. Cole o link no campo ou arraste para a área pontilhada
6. (Opcional) Adicione título e categoria
7. Clique em "Adicionar Foto"

#### Via API Direta:
```javascript
const response = await fetch('/api/google-photos-links', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://photos.google.com/share/AF1QipN...',
    title: 'Minha Foto Incrível',
    category: 'Natureza',
    isPublic: true
  })
})
```

### 3. Visualizando a Galeria

A galeria aparece automaticamente na página `/fotos` e inclui:
- **Suas fotos**: Links que você adicionou
- **Fotos públicas**: Links compartilhados por outros usuários
- **Filtros**: Busca por título, categoria, etc.
- **Estatísticas**: Contadores e métricas

### 4. Usando os Componentes

#### GooglePhotosDragDrop
```tsx
import { GooglePhotosDragDrop } from '@/components/photos/google-photos-drag-drop'

<GooglePhotosDragDrop
  showGallery={false}          // Mostrar lista de fotos adicionadas
  maxPhotos={50}               // Limite de fotos por usuário
  onPhotoAdded={(url) => {     // Callback quando foto é adicionada
    console.log('Nova foto:', url)
  }}
/>
```

#### GooglePhotosGallery
```tsx
import { GooglePhotosGallery } from '@/components/photos/google-photos-gallery'

<GooglePhotosGallery
  showUserPhotos={true}        // Mostrar fotos do usuário
  showPublicPhotos={true}      // Mostrar fotos públicas
  showSearch={true}            // Habilitar busca
  viewMode="grid"              // "grid" ou "list"
  onPhotoClick={(photo) => {   // Callback quando foto é clicada
    console.log('Foto clicada:', photo)
  }}
/>
```

#### Hook useGooglePhotosLinks
```tsx
import { useGooglePhotosLinks } from '@/hooks/use-google-photos-links'

const {
  links,                       // Array de fotos
  loading,                     // Estado de carregamento
  addLink,                     // Função para adicionar
  removeLink,                  // Função para remover
  refresh,                     // Recarregar dados
  stats                        // Estatísticas
} = useGooglePhotosLinks({
  publicOnly: false,           // Apenas fotos públicas
  limit: 20,                   // Limite por página
  autoFetch: true              // Buscar automaticamente
})
```

## ⚠️ Considerações Importantes

### URLs Suportadas
- `https://photos.google.com/share/...`
- `https://photos.app.goo.gl/...`
- `https://lh3.googleusercontent.com/...`
- `https://drive.google.com/...` (parcial)

### Limitações
1. **Álbuns Privados**: Fotos privadas não são exibidas para outros usuários
2. **Links Temporários**: Alguns links do Google podem expirar
3. **CORS**: Não é possível fazer preview direto das imagens
4. **Dependência Externa**: Funcionalidade depende do Google Photos

### Boas Práticas

#### Para Usuários:
- Configure álbuns como **públicos** para compartilhamento
- Use títulos descritivos para facilitar busca
- Organize fotos em categorias
- Evite links muito longos ou complexos

#### Para Desenvolvedores:
- Sempre valide URLs antes de salvar
- Implemente cache para melhor performance
- Use error boundaries para problemas de rede
- Considere fallbacks para links quebrados

## 🔧 Configurações Avançadas

### Personalizar Validação de URLs
```typescript
// Em app/api/google-photos-links/route.ts
function isValidGooglePhotosUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'photos.google.com' || 
           urlObj.hostname.includes('photos.app.goo.gl') ||
           // Adicione outros domínios aqui
  } catch {
    return false
  }
}
```

### Customizar Extração de Títulos
```typescript
function extractPhotoTitle(url: string): string {
  try {
    // Lógica personalizada para extrair títulos
    // Ex: usar metadados, APIs, etc.
    return customTitleLogic(url)
  } catch {
    return 'Foto do Google Photos'
  }
}
```

## 📊 Monitoramento e Analytics

### Métricas Disponíveis
- Total de fotos por usuário
- Fotos mais visualizadas
- Categorias populares
- Taxa de links quebrados
- Engagement (curtidas, comentários)

### Queries SQL Úteis
```sql
-- Top 10 fotos mais visualizadas
SELECT title, views_count, user_id 
FROM google_photos_links 
ORDER BY views_count DESC 
LIMIT 10;

-- Categorias mais populares
SELECT category, COUNT(*) as total
FROM google_photos_links 
WHERE category IS NOT NULL
GROUP BY category 
ORDER BY total DESC;

-- Links adicionados por período
SELECT DATE_TRUNC('day', created_at) as day, COUNT(*)
FROM google_photos_links
GROUP BY day
ORDER BY day DESC;
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **"URL inválida"**
   - Verifique se o link é do Google Photos
   - Certifique-se que o álbum está público
   - Tente gerar um novo link de compartilhamento

2. **"Foto não carrega"**
   - Verifique permissões do álbum
   - Link pode ter expirado
   - Problemas de CORS são esperados

3. **"Limite de fotos atingido"**
   - Configure `maxPhotos` no componente
   - Remova fotos antigas
   - Implemente paginação

4. **"Erro ao salvar no banco"**
   - Verifique configuração do Supabase
   - Confirme que as migrations foram executadas
   - Verifique políticas RLS

### Debug Mode
```typescript
// Ative logs detalhados
const { links, error } = useGooglePhotosLinks({ 
  autoFetch: true 
})

console.log('Links:', links)
console.log('Erro:', error)
```

## 🚀 Roadmap

### Próximas Funcionalidades
- [ ] Preview de imagens (quando possível)
- [ ] Integração com Google Photos API
- [ ] Sincronização automática
- [ ] Backup de links
- [ ] Modo offline
- [ ] Suporte a vídeos
- [ ] Albums integrados
- [ ] Comentários em fotos
- [ ] Sistema de tags avançado
- [ ] Compartilhamento social

---

## 💡 Exemplo Completo

Aqui está um exemplo completo de como implementar a funcionalidade:

```tsx
'use client'

import { GooglePhotosDragDrop, GooglePhotosGallery } from '@/components/photos'

export default function MyPhotosPage() {
  return (
    <div className="space-y-6">
      {/* Componente para adicionar fotos */}
      <GooglePhotosDragDrop
        maxPhotos={50}
        showGallery={false}
        onPhotoAdded={(url) => {
          console.log('Nova foto adicionada:', url)
        }}
      />
      
      {/* Galeria para visualizar fotos */}
      <GooglePhotosGallery
        showUserPhotos={true}
        showPublicPhotos={true}
        onPhotoClick={(photo) => {
          // Abrir modal personalizado ou navegar
          window.open(photo.url, '_blank')
        }}
      />
    </div>
  )
}
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este documento primeiro
2. Consulte os logs do console
3. Teste com URLs diferentes
4. Verifique configurações do Supabase

---

Agora você tem um sistema completo para gerenciar fotos do Google Photos no Orkut! 🎉
