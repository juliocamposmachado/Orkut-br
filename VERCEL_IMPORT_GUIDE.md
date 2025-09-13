# 📥 Guia: Como Importar Arquivo .env no Vercel

## 🚀 Arquivo Criado: `vercel.env`

Criei o arquivo `vercel.env` com todas as variáveis de ambiente necessárias para importar diretamente no Vercel Dashboard.

## 📋 Passo a Passo para Importar

### 1. **Acesse o Vercel Dashboard**
```
🌐 https://vercel.com/dashboard
```

### 2. **Vá para o Seu Projeto**
- Clique no projeto "orkut-br" (ou o nome do seu projeto)

### 3. **Acesse as Configurações**
- Clique na aba **"Settings"**

### 4. **Vá para Environment Variables**
- No menu lateral, clique em **"Environment Variables"**

### 5. **Importe o Arquivo**
- Clique em **"Import"** (botão no canto superior direito)
- Ou procure por uma opção **"Bulk Import"** ou **"Upload .env"**

### 6. **Selecione o Arquivo**
- Faça upload do arquivo `vercel.env` que está na raiz do projeto
- **Arquivo**: `C:\Orkut\vercel.env`

### 7. **Configure os Ambientes**
Certifique-se de aplicar para todos os ambientes:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development** (opcional)

## 🔄 Método Alternativo: Copiar e Colar

Se a importação de arquivo não estiver disponível:

### 1. Abra o arquivo `vercel.env`
### 2. Copie o conteúdo completo
### 3. No Vercel Dashboard:
   - Vá em **Settings** → **Environment Variables**
   - Clique em **"Add New"**
   - Cole todo o conteúdo na área de texto
   - O Vercel irá automaticamente separar as variáveis

## ⚠️ IMPORTANTE - Verifique as URLs

Após importar, **verifique e atualize** estas variáveis com seu domínio real:

```bash
NEXTAUTH_URL=https://SEU-DOMINIO.vercel.app
NEXT_PUBLIC_SITE_URL=https://SEU-DOMINIO.vercel.app
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO.vercel.app
GOOGLE_REDIRECT_URI=https://SEU-DOMINIO.vercel.app/api/import-google-contacts/callback
```

**Substitua `SEU-DOMINIO` pelo domínio real do seu projeto no Vercel.**

## 📱 Exemplos de Domínios Vercel

```bash
# Se o nome do projeto for "orkut-br"
https://orkut-br.vercel.app

# Se for um domínio personalizado
https://seusite.com.br

# Domínio de preview/desenvolvimento
https://orkut-br-git-main-seunome.vercel.app
```

## ✅ Checklist Final

Após importar as variáveis:

- [ ] ✅ Todas as variáveis importadas
- [ ] ✅ URLs atualizadas com domínio correto
- [ ] ✅ Aplicado a todos os ambientes (Production, Preview)
- [ ] ✅ Schema SQL executado no Supabase
- [ ] ✅ Deploy automático funcionando

## 🎯 Localização do Arquivo

```
📁 C:\Orkut\vercel.env
```

## 🚨 Problemas Comuns

### "Não encontro a opção Import"
- Algumas versões do Vercel podem ter a opção em locais diferentes
- Procure por: "Bulk Import", "Upload .env", ou "Import from file"
- Use o método alternativo de copiar/colar

### "Variáveis não aparecem após importar"
- Verifique se selecionou os ambientes corretos
- Recarregue a página
- Tente fazer um novo deploy

### "Erro de sintaxe no arquivo"
- Certifique-se de que não há linhas em branco no final
- Cada variável deve estar em uma linha separada
- Formato: `NOME_VARIAVEL=valor`

## 🎉 Sucesso!

Após importar e configurar, seu projeto estará pronto para deploy automático no Vercel! 🚀
