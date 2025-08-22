# 🐛 Google OAuth Debug - Orkut Clone

## 📋 Credenciais Corretas (Google Cloud Console):

### **Client ID:**
```
35840253095-e0ho0qmq7q1mtv451kc6820dr68r01os.apps.googleusercontent.com
```

### **Client Secret:**
```
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
```

### **Redirect URI configurado no Google:**
```
https://woyyikaztjrhqzgvbhmn.supabase.co/auth/v1/callback
```

### **JavaScript Origins configurados no Google:**
```
https://orkut-br-oficial.vercel.app
https://woyyikaztjrhqzgvbhmn.supabase.co
```

## 🔧 Configuração Supabase:

### **No painel Authentication → Providers → Google:**
1. ✅ **Enable Sign in with Google:** ON
2. **Client ID:** `35840253095-e0ho0qmq7q1mtv451kc6820dr68r01os.apps.googleusercontent.com`
3. **Client Secret:** `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`
4. ❌ **Skip nonce verification:** OFF (desmarcado)
5. **Callback URL:** `https://woyyikaztjrhqzgvbhmn.supabase.co/auth/v1/callback`

## 🌐 Environment Variables (Vercel):

### **Verificar no Vercel Dashboard → Settings → Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://woyyikaztjrhqzgvbhmn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndveXlpa2F6dGpyaHF6Z3ZiaG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NjUwOTUsImV4cCI6MjA3MTI0MTA5NX0.rXp7c0167cjPXfp6kYDNKq6s4RrD8E7C2-NzukKPQnQ
NODE_ENV=production
```

## 🧪 Teste Checklist:

### **1. Verificar no Google Cloud Console:**
- [ ] OAuth Consent Screen configurado como "External"
- [ ] Client ID criado para "Web Application"
- [ ] JavaScript Origins corretos
- [ ] Redirect URIs corretos

### **2. Verificar no Supabase:**
- [ ] Google Provider habilitado
- [ ] Client ID correto (longo, .apps.googleusercontent.com)
- [ ] Client Secret correto (GOCSPX-)
- [ ] Skip nonce DESABILITADO

### **3. Verificar no Vercel:**
- [ ] NEXT_PUBLIC_SUPABASE_URL configurada
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY configurada
- [ ] Environment aplicada em Production

## 🚨 Possíveis Problemas:

### **Erro: "Login com Google não disponível no modo offline"**
- ❌ Environment variables não configuradas no Vercel
- ❌ Site ainda detectando modo fallback

### **Erro: "Invalid OAuth configuration"**
- ❌ Client ID/Secret incorretos no Supabase
- ❌ Redirect URI não confere

### **Erro: "Unauthorized"**
- ❌ JavaScript Origins não configurados no Google
- ❌ Site tentando de domínio não autorizado

## 🔄 Debug Steps:

1. **Testar localmente primeiro:** `npm run dev` com .env.local
2. **Verificar console do navegador** para erros
3. **Verificar Network tab** para ver chamadas de API
4. **Testar em modo incógnito** para evitar cache

## 📞 URLs para teste:

- **Local:** http://localhost:3000/login
- **Produção:** https://orkut-br-oficial.vercel.app/login
- **Supabase Auth:** https://woyyikaztjrhqzgvbhmn.supabase.co
