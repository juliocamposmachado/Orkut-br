# 🌟 Orkut.br - Nostalgia Revival

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/juliocamposmachado/Orkut.br)

## 📸 Preview

Uma recriação moderna do clássico Orkut, construída with tecnologias atuais e design nostálgico.

🔗 **Demo ao vivo:** https://orkut-br-oficial.vercel.app

## ✨ Funcionalidades

### 🎯 **Implementado:**
- ✅ **Sistema de autenticação completo (LOGIN FUNCIONAL!)**
  - 🔐 Login com Google OAuth 2.0 funcionando 100%
  - 🔑 Autenticação tradicional (email/senha)
  - 👤 Criação automática de perfis
  - 🔒 Integração total com Supabase Auth
- ✅ Perfis de usuário com criação automática
- ✅ Comunidades com dados demo
- ✅ Interface nostálgica do Orkut
- ✅ Sistema de navegação responsivo
- ✅ Integração com Supabase
- ✅ Segurança RLS (Row Level Security)
- ✅ Assistente de voz (Orky)
- ✅ Content Security Policy configurado
- ✅ **Sistema completo de chamadas WebRTC**
  - 📞 Chamadas de áudio com controles avançados
  - 📹 Chamadas de vídeo com compartilhamento de tela
  - 🔔 Notificações com ringtone personalizado
  - 🟢 Status online em tempo real
  - 📱 Interface responsiva para mobile

### 🚧 **Em desenvolvimento:**
- 🔄 Sistema de posts e comentários
- 🔄 Sistema de amizades
- 🔄 Scraps e depoimentos
- 🔄 Mensagens privadas
- 🔄 Sistema de notificações push

## 🛠️ Tecnologias

- **Frontend:** Next.js 13, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **UI Components:** Radix UI + shadcn/ui
- **Deploy:** Vercel
- **Versionamento:** Git + GitHub

## 🚀 Deploy Rápido

### Opção 1: Deploy Automático
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/juliocamposmachado/Orkut.br)

### Opção 2: Deploy Manual

1. **Clone o repositório:**
```bash
git clone https://github.com/juliocamposmachado/Orkut.br.git
cd Orkut.br
```

2. **Instale dependências:**
```bash
npm install
```

3. **Configure Supabase:**
- Crie projeto em [supabase.com](https://supabase.com)
- Execute o script SQL em `SCRIPT_SIMPLES_SUPABASE.sql`
- Configure variáveis de ambiente

4. **Configure ambiente:**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
```

5. **Execute localmente:**
```bash
npm run dev
```

## 🗄️ Configuração do Banco de Dados

### Pré-requisitos
- Projeto Supabase criado
- Acesso ao SQL Editor do Supabase

### Setup Automático
Execute o script incluído no projeto:

```bash
node setup-database-direct.js
```

### Setup Manual
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Execute o conteúdo de `SCRIPT_SIMPLES_SUPABASE.sql` parte por parte
4. Verifique se as tabelas foram criadas em **Database > Tables**

### Tabelas Criadas
- `profiles` - Perfis de usuários
- `communities` - Comunidades
- `posts` - Sistema de posts (preparado)
- `likes` - Sistema de likes (preparado)

## 🔧 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Servidor de produção
- `npm run lint` - Verificação de código
- `npm run type-check` - Verificação de tipos TypeScript

### Deploy
- `npm run deploy` - Deploy de produção no Vercel
- `npm run deploy-preview` - Deploy de preview no Vercel
- `./deploy.ps1` - Script automatizado de deploy (Windows)

### Utilidades
- `npm run clean` - Limpar cache de build
- `npm run analyze` - Análise do bundle
- `node setup-database-direct.js` - Verificar/configurar banco

## 🎨 Design System

### Cores
- **Primárias:** Purple/Pink gradient (nostálgico)
- **Secundárias:** Gray scale para texto
- **Accent:** Purple-600 para destacar

### Componentes
- **OrkutCard:** Componente base nostálgico
- **Navbar:** Navegação com gradiente
- **Avatar:** Sistema de perfil
- **Badge:** Status e categorias

## 📁 Estrutura do Projeto

```
├── app/                 # Pages (App Router)
├── components/          # Componentes React
│   ├── ui/             # Componentes base
│   ├── layout/         # Layout components
│   └── voice/          # Assistente de voz
├── contexts/           # Context providers
├── lib/                # Utilitários e configurações
├── hooks/              # Custom hooks
└── supabase/           # Migrações SQL
```

## 🔐 Segurança

- ✅ **RLS habilitado** em todas as tabelas
- ✅ **Políticas de acesso** configuradas
- ✅ **CSP (Content Security Policy)** ativo
- ✅ **Autenticação obrigatória** para ações sensíveis
- ✅ **Validação de tipos** TypeScript

## 🐛 Troubleshooting

### Problemas Comuns

**❌ "Could not find table 'profiles'"**
- Execute `node setup-database-direct.js`
- Ou execute manualmente `SCRIPT_SIMPLES_SUPABASE.sql`

**❌ "Auth error" / Login não funciona**
- Verifique variáveis de ambiente
- Confirme URLs do Supabase

**❌ "CSP violation"**
- Configuração já incluída no `next.config.js`

**❌ Build falha no Vercel**
- Todas as correções de TypeScript já implementadas
- Variáveis de ambiente já configuradas

## 📝 Changelog

### v2.3.0 - Google OAuth 2.0 Funcionando! (22/08/2025)
- 🎉 **LOGIN COM GOOGLE OAUTH 100% FUNCIONAL!**
- ✅ **Autenticação Google** integrada e testada em produção
- ✅ **Redirect URLs** configuradas corretamente no Supabase
- ✅ **Google Cloud Console** totalmente configurado
- ✅ **Páginas legais** criadas (/privacy e /terms)
- ✅ **Variáveis de ambiente** otimizadas para produção/desenvolvimento
- ✅ **Deploy inteligente** com URLs dinâmicas
- ✅ **Integração perfeita** Supabase + Google + Vercel

### v2.2.0 - Correções de Produção & Deploy (22/01/2025)
- ✅ **Supabase null checks** implementados em todos os componentes
- ✅ **Verificações de produção** adicionadas nos cronjobs
- ✅ **Deploy duplo resolvido** - GitHub Integration otimizada
- ✅ **Build errors eliminados** - Supabase undefined errors corrigidos
- ✅ **Orky Bot aprimorado** com verificações robustas
- ✅ **Production-ready** com error handling completo
- ✅ **Node.js 22.x** compatibility confirmada
- ✅ **Execution policies** contornadas no Windows

### v2.1.0 - Performance & UX Improvements
- ✅ **Correção de loops infinitos** nos contextos
- ✅ **Otimização de polling** da API da rádio (2min)
- ✅ **Melhoria dos links** da navbar com feedback visual
- ✅ **Redução do carregamento** contínuo da página
- ✅ **Layout da página de login** reorganizado
- ✅ **Cache otimizado** nas APIs
- ✅ **Script automatizado** de deploy (deploy.ps1)

### v2.0.0 - Sistema WebRTC Completo
- ✅ Chamadas de áudio e vídeo implementadas
- ✅ Compartilhamento de tela funcional
- ✅ Status online em tempo real
- ✅ Notificações com ringtone personalizado
- ✅ Interface responsiva para mobile
- ✅ Auto-away após inatividade
- ✅ Servidor de signaling Socket.io integrado

### v1.2.0 - Database Setup
- ✅ Sistema de banco configurado
- ✅ Tabelas essenciais criadas
- ✅ Triggers automáticos funcionando
- ✅ Dados demo inseridos

### v1.1.0 - TypeScript Fixes
- ✅ Todos os erros de compilação corrigidos
- ✅ Tipos adequados para Supabase
- ✅ CSP configurado

### v1.0.0 - Initial Release
- ✅ Interface básica do Orkut
- ✅ Autenticação implementada
- ✅ Design nostálgico

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🎉 Créditos

- **Design inspirado em:** Orkut original (Google)
- **Desenvolvido por:** Julio Campos Machado
- **UI Framework:** shadcn/ui
- **Ícones:** Lucide React
- **Hospedagem:** Vercel + Supabase

---

⭐ **Gostou do projeto? Deixe uma estrela!**

🐛 **Encontrou um bug?** [Abra uma issue](https://github.com/juliocamposmachado/Orkut.br/issues)

💡 **Tem uma sugestão?** [Inicie uma discussão](https://github.com/juliocamposmachado/Orkut.br/discussions)
