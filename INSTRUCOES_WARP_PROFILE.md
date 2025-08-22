# 🤖 Criando Perfil do Warp - Instruções

## 📋 Passos para Executar

### 1. Acesse o Supabase
- Abra seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
- Vá em **SQL Editor**

### 2. Execute o Script Principal
- Copie TODO o conteúdo de `CREATE_WARP_PROFILE_COMPLETE.sql`
- Cole no SQL Editor do Supabase
- Clique em **RUN** 

### 3. Verifique se Funcionou
- Copie o conteúdo de `VERIFY_WARP_PROFILE.sql`
- Execute no SQL Editor
- Deve mostrar:
  - ✅ Perfil do Warp criado
  - ✅ 6 posts do Warp
  - ✅ 3 fotos do Warp
  - ✅ Estrutura da tabela atualizada

## 🎯 O que o Script Faz

### Atualiza Banco de Dados:
- ✅ Adiciona campos necessários na tabela `posts`
- ✅ Cria índices para performance
- ✅ Configura políticas de segurança (RLS)

### Cria Perfil do Warp:
- **Username:** `warp_ai_terminal`
- **Nome:** Warp AI Terminal  
- **Bio:** Terminal de IA que ama tecnologia
- **Localização:** Nuvem ☁️ - Servidores Globais
- **Stats:** 128 fãs, 42 scraps, 1337 visualizações

### Cria 6 Posts Únicos:
1. 🎉 Post de apresentação
2. 💻 Elogio ao projeto
3. 🤔 Sobre suas habilidades técnicas
4. 🎵 Elogio ao DJ Orky
5. 🌍 Sobre o feed global
6. 🚀 Sobre colaboração open source

### Adiciona 3 Fotos:
- Setup de trabalho
- Programando
- Explorando tecnologias

## ⚡ Teste Rápido

Após executar, teste no browser:

```javascript
// No console do browser em localhost:3000
fetch('/api/posts-db')
  .then(r => r.json())
  .then(data => {
    console.log('Posts encontrados:', data.posts.length);
    console.log('Posts do Warp:', 
      data.posts.filter(p => p.author_name === 'Warp AI Terminal').length
    );
  });
```

## 🎉 Resultado Esperado

No feed global você deve ver:
- ✅ Posts do Warp misturados com outros posts
- ✅ Avatar do Warp (desenvolvedor com óculos)
- ✅ Nome "Warp AI Terminal"
- ✅ Conteúdo sobre tecnologia e IA
- ✅ Curtidas e comentários simulados

## 🚨 Se Algo Der Errado

1. **Erro de permissão**: Execute como owner/admin do projeto
2. **Tabela não existe**: Execute primeiro os scripts de criação básica
3. **UUID conflict**: Normal, o script ignora conflitos
4. **RLS error**: Também normal, o script recria as políticas

## 📊 Dados do Perfil Criado

```
ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Username: warp_ai_terminal
Email: warp@ai-terminal.dev
Telefone: +55 11 99999-0001
Status: Relacionamento Complicado (com códigos 💻)
```

---

**🎯 Objetivo:** Testar o feed global com um perfil real e posts interessantes!

**✅ Status:** Pronto para execução!
