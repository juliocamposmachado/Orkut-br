# 🗂️ GitHub Feed Storage para Orkut

Sistema para usar o GitHub como banco de dados para posts do Orkut, permitindo geração de sites estáticos com feed dinâmico.

## ✨ Como Funciona

1. **Publicação**: Posts são salvos como arquivos JSON no repositório via API do GitHub
2. **Indexação**: Um arquivo `posts/index.json` mantém o índice de todos os posts
3. **Leitura**: Scripts buscam o feed do GitHub para construir páginas estáticas
4. **Versionamento**: Todo histórico fica no Git com commits automáticos

## 📁 Estrutura no Repositório

```
posts/
├── index.json                    # Índice com resumo dos posts
├── 2024/
│   ├── 01/
│   │   ├── abc123-post1.json    # Post individual
│   │   └── def456-post2.json
│   └── 02/
│       └── ghi789-post3.json
└── 2025/
    └── 01/
        └── jkl012-post4.json
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

No **PowerShell**:

```powershell
# Token do GitHub (obrigatório)
$env:GITHUB_TOKEN = "ghp_sua_token_do_github_aqui"

# Configurações do repositório (obrigatório)
$env:GITHUB_OWNER = "seu-usuario"
$env:GITHUB_REPO = "orkut-posts"

# Branch (opcional, padrão: main)
$env:GITHUB_BRANCH = "main"
```

### 2. Como Gerar o Token do GitHub

1. Acesse [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Clique em "Generate new token (classic)"
3. Selecione as permissões:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access public repositories)
4. Copie o token gerado

### 3. Criar Repositório

```bash
# Criar repositório público ou privado para armazenar posts
gh repo create orkut-posts --public
# ou
gh repo create orkut-posts --private
```

## 🚀 Scripts Disponíveis

### 📝 publishPost.mjs - Publicar Posts

Adiciona um novo post ao repositório e atualiza o índice.

```powershell
# Exemplo básico
node publishPost.mjs --user-id=123 --user-name="João Silva" --content="Olá pessoal!"

# Post com imagem
node publishPost.mjs --user-id=123 --user-name="João" --content="Foto do meu almoço" --image-url="https://example.com/foto.jpg"

# Post em comunidade
node publishPost.mjs --user-id=123 --user-name="João" --content="Discussão interessante" --community-id=456 --community-name="Programadores"

# Post com tags
node publishPost.mjs --user-id=123 --user-name="João" --content="Aprendendo JavaScript" --tags="javascript,programação,estudos"

# Post privado
node publishPost.mjs --user-id=123 --user-name="João" --content="Mensagem pessoal" --private
```

### 📖 fetchLatest.mjs - Ler Posts

Busca posts do repositório para construir a página estática.

```powershell
# Buscar últimos 10 posts (apenas resumo)
node fetchLatest.mjs --limit=10

# Buscar últimos 5 posts com conteúdo completo
node fetchLatest.mjs --limit=5 --with-content

# Posts de um usuário específico
node fetchLatest.mjs --user-id=123 --limit=20 --with-content

# Posts de uma comunidade
node fetchLatest.mjs --community-id=456 --with-content

# Buscar um post específico
node fetchLatest.mjs --post-id=abc123-xyz
```

## 🔄 Integração com o Orkut

### 1. No Frontend (quando usuário posta)

```javascript
// Na função de publicar post do seu frontend
async function publicarPost(userId, userName, content, imageUrl = null) {
    // Salvar no Supabase (banco principal)
    const supabaseResult = await supabase
        .from('posts')
        .insert([{ user_id: userId, content, image_url: imageUrl }]);
    
    // Salvar no GitHub (para site estático)
    const githubResult = await fetch('/api/publish-to-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            userName,
            content,
            imageUrl
        })
    });
    
    return { supabaseResult, githubResult };
}
```

### 2. API Route do Next.js (/api/publish-to-github.js)

```javascript
import { publishPost } from '../../scripts/github-feed/publishPost.mjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { userId, userName, content, imageUrl, communityId } = req.body;
    
    try {
        const result = await publishPost({
            userId,
            userName, 
            content,
            imageUrl,
            communityId
        });
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
```

### 3. Build do Site Estático

```javascript
// pages/index.js ou app/page.js
import { fetchLatestPosts } from '../scripts/github-feed/fetchLatest.mjs';

export async function getStaticProps() {
    const feedData = await fetchLatestPosts({ 
        limit: 50, 
        withContent: true 
    });
    
    return {
        props: {
            posts: feedData.posts,
            lastUpdated: feedData.lastUpdated
        },
        revalidate: 60 // Rebuildar a cada minuto
    };
}
```

## ⚡ Performance

### Vantagens:
- ✅ **CDN Global**: GitHub Pages/Vercel servem arquivos muito rápido
- ✅ **Cache**: Arquivos JSON ficam em cache por muito tempo
- ✅ **Versionamento**: Histórico completo de mudanças
- ✅ **Backup**: Dados seguros no Git
- ✅ **Escalabilidade**: GitHub aguenta muito tráfego

### Limitações:
- ⚠️ **Rate Limit**: 5000 requests/hora por token
- ⚠️ **Tamanho**: Arquivos máximo 100MB
- ⚠️ **Latência**: API do GitHub pode ter delay de 1-2 segundos

## 📊 Monitoramento

```powershell
# Ver quantos posts existem
node fetchLatest.mjs --limit=1 | jq '.totalPosts'

# Ver último post
node fetchLatest.mjs --limit=1 --with-content | jq '.posts[0]'

# Posts de hoje
$today = (Get-Date).ToString("yyyy-MM-dd")
node fetchLatest.mjs --limit=100 --with-content | jq ".posts[] | select(.createdAt | startswith(\"$today\"))"
```

## 🔒 Segurança

- **Token**: Use Personal Access Token com escopo mínimo necessário
- **Repositório**: Pode ser privado para dados sensíveis
- **Validação**: Scripts validam dados antes de salvar
- **Rate Limiting**: Implementar delays entre requests se necessário

## 🚦 Exemplo de Uso Completo

```powershell
# 1. Definir variáveis
$env:GITHUB_TOKEN = "ghp_seu_token"
$env:GITHUB_OWNER = "seu-usuario"
$env:GITHUB_REPO = "orkut-posts"

# 2. Publicar alguns posts
node publishPost.mjs --user-id=1 --user-name="Ana" --content="Primeiro post!"
node publishPost.mjs --user-id=2 --user-name="Carlos" --content="JavaScript é incrível" --tags="javascript,web"
node publishPost.mjs --user-id=1 --user-name="Ana" --content="Foto do pôr do sol" --image-url="https://example.com/sunset.jpg"

# 3. Ler feed
node fetchLatest.mjs --limit=10 --with-content > feed.json

# 4. Ver resultado
Get-Content feed.json | ConvertFrom-Json | Select-Object -ExpandProperty posts | Select-Object userName, content, createdAt
```

## 🆘 Solução de Problemas

### Erro: "GitHub API Error: 401"
- Verifique se o token está correto e não expirou
- Confirme se as variáveis de ambiente estão definidas

### Erro: "GitHub API Error: 403" 
- Rate limit excedido - aguarde 1 hora ou use outro token
- Permissões insuficientes no token

### Posts não aparecem
- Verifique se o repositório e branch existem
- Confirme se o arquivo `posts/index.json` foi criado

---

**💡 Dica**: Este sistema permite que o Orkut tenha um feed ultra-rápido servido via CDN, mantendo os dados principais no Supabase para funcionalidades interativas!
