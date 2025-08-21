# 🤖 Letreiro Inteligente com Gemini AI

## 📋 Visão Geral

O Orkut Retrô agora possui um **letreiro dinâmico** powered by **Google Gemini AI** que gera mensagens personalizadas sobre o desenvolvimento do site e acalma os usuários sobre eventuais instabilidades.

## ✨ Funcionalidades

### 🔄 **Mensagens Dinâmicas**
- Mensagens geradas automaticamente pelo Gemini AI
- Conteúdo personalizado sobre desenvolvimento e funcionalidades
- Tom positivo e tranquilizador para os usuários

### ⚡ **Rotação Automática**
- Mensagens rotacionam a cada 30 segundos
- Atualizações automáticas a cada 10 minutos
- Sistema de fallback com mensagens padrão

### 🎯 **Integração Inteligente**
- API endpoint `/api/gemini/messages` para geração de conteúdo
- Indicador visual quando IA está ativa
- Fallback gracioso se Gemini não estiver disponível

## 🛠️ Configuração

### 1. **Variáveis de Ambiente**

Adicione no seu arquivo `.env`:

```bash
# Google Gemini AI (para letreiro dinâmico)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. **Obter Chave API do Gemini**

1. Acesse [Google AI Studio](https://makersuite.google.com/)
2. Faça login com sua conta Google
3. Clique em "Get API Key"
4. Crie uma nova chave API
5. Copie a chave e adicione ao `.env`

### 3. **Teste da Configuração**

Se tudo estiver configurado corretamente, você verá:
- ✅ Ícone "AI" no canto superior direito do letreiro
- ✅ Mensagens personalizadas sobre desenvolvimento
- ✅ Log no console: "✅ Mensagens do Gemini carregadas"

## 📂 Arquivos Criados/Modificados

### 🆕 **Novos Arquivos**
- `components/ui/marquee-banner.tsx` - Componente principal do letreiro
- `app/api/gemini/messages/route.ts` - API para integração com Gemini
- `.env.example` - Exemplo de configuração

### 🔄 **Arquivos Modificados**
- `app/page.tsx` - Implementação do novo componente
- Removida seção "Atividade Recente" da sidebar

## 🎨 Tipos de Mensagens Geradas

O Gemini AI gera mensagens com:

- **🚧 Status de desenvolvimento** - Informações sobre progresso
- **⚡ Melhorias chegando** - Novidades em desenvolvimento  
- **🎵 Funcionalidades** - Destaque para recursos como DJ Orky
- **💬 Comunidades** - Incentivo à participação
- **🌟 Agradecimentos** - Reconhecimento aos usuários
- **📱 Próximas versões** - Informações sobre mobile/updates

## 🔧 Fallback System

Se o Gemini AI não estiver disponível:

1. **Mensagens padrão** são exibidas automaticamente
2. **Sem quebras** na interface
3. **Log informativo** no console
4. **Tentativas automáticas** de reconexão

## 📊 Monitoramento

### Logs do Console:
```javascript
// Sucesso
"✅ Mensagens do Gemini carregadas: 10"

// Fallback
"Gemini indisponível, usando mensagens de fallback"

// Erro
"Erro ao gerar mensagens com Gemini: [detalhes]"
```

### Indicadores Visuais:
- **🌟 Sparkles + "AI"** = Gemini ativo
- **⚡ Loading spinner** = Gerando novas mensagens
- **Sem indicador** = Usando fallback

## ⚙️ Personalização

### Modificar Frequência de Atualização:

```typescript
// No arquivo marquee-banner.tsx
const updateInterval = setInterval(() => {
  generateGeminiMessages()
}, 10 * 60 * 1000) // 10 minutos - altere aqui
```

### Personalizar Prompt do Gemini:

```typescript
// No arquivo marquee-banner.tsx, função generateGeminiMessages
prompt: `Seu prompt personalizado aqui...`
```

### Adicionar Mensagens de Fallback:

```typescript
// No arquivo marquee-banner.tsx
const fallbackMessages = [
  "🆕 Sua nova mensagem aqui",
  "⭐ Outra mensagem personalizada",
  // ... adicione mais
]
```

## 🚨 Resolução de Problemas

### Problema: Letreiro não mostra mensagens do Gemini
**Solução:**
1. Verifique se `GEMINI_API_KEY` está no `.env`
2. Confirme que a chave está válida
3. Verifique logs do console no navegador

### Problema: Erro "GEMINI_API_KEY não configurada"
**Solução:**
1. Adicione a chave no arquivo `.env`
2. Reinicie o servidor de desenvolvimento
3. Limpe cache do navegador

### Problema: API do Gemini retorna erro 401
**Solução:**
1. Verifique se a chave API está correta
2. Confirme que a API do Gemini está ativa na sua conta Google
3. Verifique se há cotas/limites excedidos

## 💡 Dicas de Otimização

1. **Cache Local**: As mensagens são armazenadas temporariamente
2. **Rate Limiting**: Atualizações limitadas a 10 minutos para economizar API calls
3. **Graceful Degradation**: Sistema sempre funciona, mesmo sem IA
4. **Performance**: Zero impacto no carregamento inicial da página

## 🔮 Próximas Melhorias

- [ ] Personalização por horário do dia
- [ ] Mensagens baseadas em eventos do site
- [ ] Integração com analytics para mensagens mais relevantes
- [ ] Suporte a múltiplos idiomas
- [ ] Dashboard admin para gerenciar mensagens

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
- Verifique os logs do console
- Consulte a documentação do Gemini AI
- Abra uma issue no repositório

**Desenvolvido com ❤️ para o Orkut Retrô**
