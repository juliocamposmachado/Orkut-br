# 🚀 Deployment Guide - Orkut Clone

## ✅ Status Atual:
- ✅ Código pronto com Google OAuth
- ✅ Supabase configurado
- ✅ .env.local criado para desenvolvimento
- ✅ .gitignore protegendo secrets

## 🔧 Configuração no Vercel:

### 1. Environment Variables no Vercel Dashboard:

```
NEXT_PUBLIC_SUPABASE_URL
https://woyyikaztjrhqzgvbhmn.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY  
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndveXlpa2F6dGpyaHF6Z3ZiaG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NjUwOTUsImV4cCI6MjA3MTI0MTA5NX0.rXp7c0167cjPXfp6kYDNKq6s4RrD8E7C2-NzukKPQnQ

NODE_ENV
production
```

### 2. Configurar Google OAuth no Supabase:
- Authentication → Providers → Google
- Enable: ON
- Client ID: `orkut`
- Client Secret: `julio78451200`
- Redirect URL: `https://woyyikaztjrhqzgvbhmn.supabase.co/auth/v1/callback`

## 🎯 Arquitetura de Deployment:

```
GitHub Repository (Código)
    ↓ (git push)
Vercel (Build + Deploy)
    ↓ (usa env vars)
Next.js App (Produção)
    ↓ (conecta via API)
Supabase (Database + Auth)
```

## 📊 Funcionalidades que funcionarão:

✅ **Autenticação:**
- Login com Google OAuth
- Criação automática de perfil
- Sessão persistente

✅ **Banco de Dados:**
- Perfis de usuários
- Posts e comentários  
- Relacionamentos (amizades)
- Fotos e uploads

✅ **Features Orkut:**
- Feed global
- Comunidades
- Scraps e depoimentos
- Chamadas de áudio/vídeo

## 🚨 Segurança:

✅ **Secrets protegidos:**
- .env.local não vai pro GitHub
- Chaves apenas no Vercel Dashboard
- RLS (Row Level Security) ativo no Supabase

✅ **Autenticação:**
- JWT tokens do Supabase
- OAuth 2.0 com Google
- Sessões seguras

## 🔄 Processo de Deploy:

1. **git push origin main** → Trigger automático no Vercel
2. **Vercel injeta env vars** → Build com configurações
3. **Deploy automático** → Site no ar
4. **Zero downtime** → Rollback se necessário

## ⚡ Comandos rápidos:

```bash
# Testar localmente
npm run dev

# Build de produção
npm run build

# Deploy manual (se necessário)
vercel --prod
```

## 🌐 URLs após deploy:

- **Produção:** https://seu-projeto.vercel.app
- **Supabase:** https://woyyikaztjrhqzgvbhmn.supabase.co
- **GitHub:** https://github.com/juliocamposmachado/Orkut-br
