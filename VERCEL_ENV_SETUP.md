# 🚀 Configuração de Variáveis de Ambiente no Vercel

## ⚠️ IMPORTANTE - Configure no Dashboard do Vercel

Para garantir que o deploy automático funcione corretamente, você precisa configurar as seguintes variáveis de ambiente no **Dashboard do Vercel**:

### 🔗 Acesse: https://vercel.com/dashboard

1. Vá para o seu projeto
2. Clique em **Settings**
3. Vá para **Environment Variables**
4. Adicione as seguintes variáveis:

## 📝 Variáveis Obrigatórias

### Supabase (NOVA CONFIGURAÇÃO)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://wjglxlnbizbqwpkvihsy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZ2x4bG5iaXpicXdwa3ZpaHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MTk4NDUsImV4cCI6MjA3MzI5NTg0NX0.d3xjt__Qv88opoNyjE_kvo2OGIKxG5giP_uQOaUEphQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZ2x4bG5iaXpicXdwa3ZpaHN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcxOTg0NSwiZXhwIjoyMDczMjk1ODQ1fQ.-Zoe9vvC7J6P7wmf-nSd_NaJcJNbFWcQfk7c14AgVs0
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZ2x4bG5iaXpicXdwa3ZpaHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MTk4NDUsImV4cCI6MjA3MzI5NTg0NX0.d3xjt__Qv88opoNyjE_kvo2OGIKxG5giP_uQOaUEphQ
```

### NextAuth.js
```bash
NEXTAUTH_SECRET=14TLTswZEfXT3g87OpzHJeuThukZuLJPBDGzf7xAtrkI68Z+lX29zH9gG/Ebo31DLY8Ku3gcIbYEwvgluEAABA==
NEXTAUTH_URL=https://seu-dominio.vercel.app
```

### URLs do Site
```bash
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

### Google OAuth (se necessário)
```bash
GOOGLE_CLIENT_ID=1022420342862-fc0jqm51g7v83vsu61bqo73o8b9b0iti.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://seu-dominio.vercel.app/api/import-google-contacts/callback
```

### Mercado Pago (se necessário)
```bash
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-436753351552579-082917-794b33c29ac6b9a059716d36f4ff258c-29008060
MERCADO_PAGO_PUBLIC_KEY=APP_USR-c86e8a7b-b2cc-47c7-824a-b8e817b001f2
MERCADO_PAGO_CLIENT_ID=436753351552579
MERCADO_PAGO_CLIENT_SECRET=w6rUzoNLRkwGGIiLJmU4pFkFgSrEDeu7
MERCADO_PAGO_WEBHOOK_SECRET=924128aabcd4764c8406aae5b97e6ebf7bf3af3b1e4d0c4dc0c177afbac2e0e4
```

## 🎯 Configurações Importantes

### Ambientes
Configure as variáveis para todos os ambientes:
- ✅ **Production**
- ✅ **Preview** 
- ✅ **Development**

### URLs Dinâmicas
Para `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL`, você pode usar:
- O domínio personalizado se tiver um
- Ou o domínio padrão do Vercel: `https://orkut-br.vercel.app`

## ✅ Checklist Pré-Deploy

- [ ] Todas as variáveis configuradas no Vercel
- [ ] Build local testado com sucesso ✅
- [ ] Schema SQL executado no Supabase
- [ ] URLs atualizadas para produção
- [ ] Domínios configurados no next.config.js ✅

## 🚨 Problemas Comuns

### Build Error: "Missing environment variable"
- Verifique se todas as variáveis estão configuradas
- Certifique-se de que não há espaços em branco

### Database Connection Error
- Execute o schema SQL em: https://supabase.com/dashboard/project/wjglxlnbizbqwpkvihsy/sql
- Verifique se as tabelas foram criadas

### CORS Error
- Verifique se o domínio está configurado no Supabase
- Confirme as URLs no next.config.js

## 🎉 Deploy Automático

Após configurar as variáveis, o Vercel fará deploy automático sempre que você fizer push para a branch `main`.

Monitor o deploy em: https://vercel.com/dashboard
