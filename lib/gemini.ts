'use client'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDaFdQ0tlAMSiSQU2u9Qwctbb2MfDTg3VQ'

export interface GeminiAction {
  name: string
  args: Record<string, any>
}

export class GeminiConcierge {
  private availableActions = [
    {
      name: "post_update",
      description: "Criar um post no feed do usuário",
      args: { content: "string", visibility: "public|friends" }
    },
    {
      name: "reply_post",
      description: "Responder a um post específico",
      args: { post_id: "number", content: "string" }
    },
    {
      name: "send_scrap",
      description: "Enviar um scrap para outro usuário",
      args: { to_username: "string", content: "string" }
    },
    {
      name: "send_message",
      description: "Enviar mensagem privada para outro usuário",
      args: { to_username: "string", content: "string" }
    },
    {
      name: "congratulate_birthday",
      description: "Parabenizar alguém pelo aniversário",
      args: { to_username: "string", age: "number", channel: "scrap|dm" }
    },
    {
      name: "call_user",
      description: "Fazer chamada de áudio ou vídeo",
      args: { to_username: "string", type: "audio|video" }
    },
    {
      name: "read_feed",
      description: "Ler posts do feed em voz alta",
      args: { limit: "number" }
    },
    {
      name: "navigate",
      description: "Navegar para uma página específica",
      args: { route: "string" }
    },
    {
      name: "toggle_voice_mode",
      description: "Ligar ou desligar modo de voz",
      args: { enabled: "boolean" }
    }
  ]

  async processCommand(userInput: string, context: {
    userName: string
    currentPage: string
    recentPosts?: any[]
    friends?: any[]
  }): Promise<{ response: string; actions: GeminiAction[] }> {
    try {
      const prompt = this.buildPrompt(userInput, context)
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const data = await response.json()
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!result) {
        throw new Error('No response from Gemini API')
      }

      return this.parseResponse(result)
    } catch (error) {
      console.error('Error processing command with Gemini:', error)
      return {
        response: "Desculpe, não consegui processar sua solicitação no momento.",
        actions: []
      }
    }
  }

  private buildPrompt(userInput: string, context: any): string {
    return `
Você é o Orky, assistente de voz do Orkut Retrô. Responda de forma natural e amigável em português brasileiro.

CONTEXTO:
- Usuário: ${context.userName}
- Página atual: ${context.currentPage}
- Ações disponíveis: ${JSON.stringify(this.availableActions)}

ENTRADA DO USUÁRIO: "${userInput}"

INSTRUÇÕES:
1. Analise a intenção do usuário
2. Responda de forma conversacional e amigável
3. Se necessário, sugira ou execute ações
4. Confirme ações sensíveis antes de executar
5. Use linguagem natural como um amigo do Orkut

FORMATO DA RESPOSTA:
{
  "response": "sua resposta amigável aqui",
  "actions": [
    {
      "name": "nome_da_acao",
      "args": {"parametro": "valor"}
    }
  ]
}

Exemplos de comandos:
- "Dê os parabéns ao Paulo" → congratulate_birthday
- "Poste que estou feliz hoje" → post_update
- "Leia meu feed" → read_feed
- "Ligar para Maria" → call_user

Responda APENAS com o JSON válido.
`
  }

  private parseResponse(response: string): { response: string; actions: GeminiAction[] } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          response: parsed.response || "Comando processado.",
          actions: parsed.actions || []
        }
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error)
    }

    // Fallback: return the response as-is
    return {
      response: response || "Comando recebido.",
      actions: []
    }
  }

  async generateGreeting(userName: string): Promise<string> {
    const hour = new Date().getHours()
    let timeGreeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
    
    const greetings = [
      `${timeGreeting}, ${userName}! Como posso ajudar você no Orkut hoje?`,
      `Olá, ${userName}! O que vamos fazer agora? Quer que eu leia seu feed?`,
      `E aí, ${userName}! Pronto para usar o Orkut com comando de voz?`,
      `${timeGreeting}! Sou seu assistente Orky. Em que posso ajudá-lo?`
    ]
    
    return greetings[Math.floor(Math.random() * greetings.length)]
  }
}

export const geminiConcierge = new GeminiConcierge()