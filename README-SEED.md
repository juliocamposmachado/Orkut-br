# 🚀 Orkut BR - Guia de Seed e Build Estático

Este guia explica como popular o banco de dados e gerar páginas estáticas para o Orkut BR.

## 📊 Scripts de Seed (População do Banco)

### 1. Seed Completo do Banco de Dados
```bash
npm run db:seed-complete
```
**O que faz:**
- Popula todas as tabelas do Supabase com dados realistas
- Cria 8 usuários brasileiros com perfis completos
- Adiciona 6 comunidades temáticas
- Insere fotos variadas nos álbuns
- Gera posts e atividades sociais
- Adiciona estações de rádio brasileiras
- Cria interações (amizades, curtidas)

### 2. Seed Apenas Local (Backup)
```bash
npm run db:seed-local
```
**O que faz:**
- Gera dados em arquivos JSON locais
- Usado quando o Supabase não está configurado
- Cria backup em `data/complete-database-backup.json`
- Atualiza `data/photos-feed.json` para compatibilidade

### 3. Seed Apenas Fotos (Legacy)
```bash
npm run db:seed-photos
```
**O que faz:**
- Script antigo apenas para fotos
- Use `db:seed-complete` ou `db:seed-local` para dados completos

## 🏗️ Build e Deploy

### 1. Build Otimizado Completo
```bash
npm run build:static
```
**O que faz:**
- Verifica se os dados locais existem
- Limpa cache automaticamente
- Executa build do Next.js
- Mostra estatísticas do build
- Verifica páginas principais
- **Resultado:** 115+ páginas geradas, ~800MB de build otimizado

### 2. Build Simples
```bash
npm run build
```
**O que faz:**
- Build básico do Next.js sem verificações extras

### 3. Deploy no Vercel
```bash
npm run deploy
```
**O que faz:**
- Faz deploy de produção no Vercel
- Use após `npm run build:static` para garantir dados populados

## 📋 Dados Gerados

### 👥 Usuários (8 perfis realistas)
- **Julio Campos Machado** - Admin/Criador
- **Rádio Tatuapé FM** - Perfil de rádio
- **Aildo César** - Advogado do RJ
- **Maria dos Santos** - Professora de BH
- **Carlos Baterista** - Músico de POA
- **Ana Paula Design** - Designer de Curitiba
- **Pedro Culinarista** - Chef de Salvador
- **Fernanda Zen** - Instrutora de Yoga de Brasília

### 🏘️ Comunidades (6 temáticas)
- **Eu amo o Brasil** (1.250 membros)
- **Nostalgia dos Anos 90** (890 membros)
- **Programadores Brasil** (567 membros)
- **Música Brasileira** (2.100 membros)
- **Culinária Caseira** (345 membros)
- **São Paulo Capital** (1.800 membros)

### 📸 Fotos e Álbuns
- 5 fotos temáticas por usuário
- Metadados realistas (likes, comentários, visualizações)
- Tags brasileiras e descrições autênticas
- Links do Imgur funcionais

### 📝 Posts Sociais
- Posts variados por usuário
- Interações realistas
- Posts em comunidades
- Atividades recentes

### 📻 Rádios (4 estações)
- **Rádio Tatuapé FM** - MPB
- **Jovem Pan FM** - Pop/Rock
- **Antena 1** - Clássicos
- **Mix FM** - Dance/Pop

## 🔧 Fluxo Recomendado

### Para Development:
```bash
# 1. Popular dados
npm run db:seed-local

# 2. Iniciar desenvolvimento
npm run dev
```

### Para Production:
```bash
# 1. Popular dados completos
npm run db:seed-complete

# 2. Build otimizado
npm run build:static

# 3. Testar localmente
npm run start

# 4. Deploy
npm run deploy
```

## 📁 Estrutura de Arquivos Gerados

```
data/
├── complete-database-backup.json    # Backup completo de todos os dados
├── photos-feed.json                 # Fotos compatíveis com API existente
└── (outros backups automáticos)

.next/
├── static/                          # Arquivos estáticos gerados
├── server/                          # Páginas server-side
└── (build completo ~800MB)
```

## ⚠️ Notas Importantes

1. **Supabase vs Local**: O script detecta automaticamente se o Supabase está configurado
2. **Compatibilidade**: Os dados locais são compatíveis com as APIs existentes
3. **Performance**: O build gera 115+ páginas estáticas para máxima performance
4. **Realismo**: Todos os dados são brasileiros e realistas para autenticidade

## 🐛 Troubleshooting

### Erro no Seed
```bash
# Forçar seed local se Supabase não funcionar
npm run db:seed-local
```

### Erro no Build
```bash
# Limpar cache e tentar novamente
npm run clean
npm run build:static
```

### Páginas Não Geradas
- Algumas páginas podem ser dinâmicas (normal)
- O build indica quais páginas foram geradas como estáticas

## 📊 Estatísticas do Build

- **Páginas Estáticas**: 115+
- **Tamanho Total**: ~800MB
- **APIs**: 50+ endpoints
- **Usuários Mock**: 8
- **Comunidades**: 6
- **Fotos**: 40+ (5 por usuário)
- **Posts**: 40+ variados

---

✅ **Pronto!** Agora você tem um Orkut BR completamente populado e pronto para deploy, igual às imagens mostradas!
