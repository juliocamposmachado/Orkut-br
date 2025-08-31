import { NextRequest, NextResponse } from 'next/server'

// Configuração da API do Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

interface BugReport {
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'performance' | 'ui' | 'functionality' | 'security' | 'accessibility'
  description: string
  recommendation: string
  timestamp: string
  url?: string
}

interface DeployCheckResult {
  status: 'healthy' | 'warning' | 'error'
  bugs: BugReport[]
  performance_score: number
  uptime: string
  last_check: string
  suggestions: string[]
}

// Função para verificar performance e status do site
async function checkSiteHealth(url: string = 'https://orkut-br.vercel.app'): Promise<Partial<DeployCheckResult>> {
  try {
    const start = Date.now()
    
    // Verificar se o site está online
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    const responseTime = Date.now() - start
    const isOnline = response.ok
    
    // Calcular score de performance baseado no tempo de resposta
    let performanceScore = 100
    if (responseTime > 5000) performanceScore = 20
    else if (responseTime > 3000) performanceScore = 40
    else if (responseTime > 2000) performanceScore = 60
    else if (responseTime > 1000) performanceScore = 80
    
    return {
      performance_score: performanceScore,
      uptime: isOnline ? '✅ Online' : '❌ Offline',
      last_check: new Date().toISOString()
    }
  } catch (error) {
    return {
      performance_score: 0,
      uptime: '❌ Offline - Erro de conexão',
      last_check: new Date().toISOString()
    }
  }
}

// Função para analisar bugs usando Gemini AI
async function analyzeBugsWithAI(siteData: any): Promise<BugReport[]> {
  try {
    const prompt = `
    Você é um especialista em análise de bugs e performance de websites. Analise as informações fornecidas do site Orkut e identifique possíveis bugs ou problemas:

    Dados do site:
    - Performance Score: ${siteData.performance_score}/100
    - Status: ${siteData.uptime}
    - Tempo de verificação: ${siteData.last_check}
    - URL: https://orkut-br.vercel.app

    Com base nestas informações e no conhecimento sobre sites sociais como o Orkut, identifique possíveis bugs ou áreas de melhoria. 

    Retorne APENAS um JSON válido no seguinte formato (sem markdown ou outras formatações):
    {
      "bugs": [
        {
          "severity": "low|medium|high|critical",
          "category": "performance|ui|functionality|security|accessibility",
          "description": "Descrição clara do problema",
          "recommendation": "Recomendação para correção",
          "timestamp": "${new Date().toISOString()}"
        }
      ]
    }

    Considere problemas comuns como:
    - Performance lenta (se score < 70)
    - Problemas de conectividade 
    - Possíveis melhorias de UX
    - Otimizações de segurança
    - Acessibilidade

    Retorne no máximo 5 bugs/melhorias mais relevantes.
    `

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro da API do Gemini: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Nenhuma resposta gerada pelo Gemini')
    }

    const generatedText = data.candidates[0].content.parts[0].text
    
    // Tentar extrair JSON da resposta
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsedResponse = JSON.parse(jsonMatch[0])
      return parsedResponse.bugs || []
    }
    
    return []

  } catch (error) {
    console.error('Erro ao analisar bugs com AI:', error)
    
    // Retornar bugs padrão baseados na performance
    const bugs: BugReport[] = []
    
    if (siteData.performance_score < 50) {
      bugs.push({
        severity: 'high',
        category: 'performance',
        description: 'Performance muito baixa detectada - site respondendo lentamente',
        recommendation: 'Otimizar carregamento de recursos, implementar cache e comprimir imagens',
        timestamp: new Date().toISOString()
      })
    }
    
    if (siteData.uptime.includes('Offline')) {
      bugs.push({
        severity: 'critical',
        category: 'functionality',
        description: 'Site inacessível - possível problema no servidor',
        recommendation: 'Verificar logs do servidor e status da hospedagem',
        timestamp: new Date().toISOString()
      })
    }
    
    return bugs
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando verificação de bugs do sistema...')
    
    // Verificar saúde do site
    const siteHealth = await checkSiteHealth()
    
    // Analisar bugs com IA
    const bugs = await analyzeBugsWithAI(siteHealth)
    
    // Determinar status geral
    let status: 'healthy' | 'warning' | 'error' = 'healthy'
    
    const criticalBugs = bugs.filter(bug => bug.severity === 'critical').length
    const highBugs = bugs.filter(bug => bug.severity === 'high').length
    
    if (criticalBugs > 0) {
      status = 'error'
    } else if (highBugs > 0 || siteHealth.performance_score! < 70) {
      status = 'warning'
    }
    
    // Gerar sugestões gerais
    const suggestions = [
      '🔧 Executar verificações automáticas a cada 30 minutos',
      '📊 Monitorar métricas de performance continuamente',
      '🛡️ Implementar alertas para bugs críticos',
      '⚡ Otimizar recursos para melhor performance',
      '🔄 Agendar manutenção preventiva regular'
    ]

    const result: DeployCheckResult = {
      status,
      bugs,
      performance_score: siteHealth.performance_score || 0,
      uptime: siteHealth.uptime || 'Verificando...',
      last_check: siteHealth.last_check || new Date().toISOString(),
      suggestions
    }
    
    console.log(`✅ Verificação concluída - Status: ${status}, Bugs encontrados: ${bugs.length}`)
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro na verificação de bugs:', error)
    
    return NextResponse.json({
      status: 'error',
      bugs: [{
        severity: 'medium',
        category: 'functionality',
        description: 'Erro interno no sistema de monitoramento',
        recommendation: 'Verificar logs do sistema e conectividade da API',
        timestamp: new Date().toISOString()
      }],
      performance_score: 0,
      uptime: 'Erro na verificação',
      last_check: new Date().toISOString(),
      suggestions: ['🔄 Reiniciar sistema de monitoramento']
    } as DeployCheckResult, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, force_check } = await request.json()
    
    console.log('🔄 Executando verificação manual de bugs...')
    
    // Verificar saúde do site (com URL customizada se fornecida)
    const siteHealth = await checkSiteHealth(url)
    
    // Analisar bugs com IA
    const bugs = await analyzeBugsWithAI(siteHealth)
    
    // Se force_check estiver ativo, simular bugs adicionais para demonstração
    if (force_check) {
      bugs.push({
        severity: 'low',
        category: 'ui',
        description: 'Verificação manual solicitada - sistema funcionando corretamente',
        recommendation: 'Continuar monitoramento regular',
        timestamp: new Date().toISOString()
      })
    }
    
    let status: 'healthy' | 'warning' | 'error' = 'healthy'
    const criticalBugs = bugs.filter(bug => bug.severity === 'critical').length
    const highBugs = bugs.filter(bug => bug.severity === 'high').length
    
    if (criticalBugs > 0) {
      status = 'error'
    } else if (highBugs > 0 || siteHealth.performance_score! < 70) {
      status = 'warning'
    }

    const result: DeployCheckResult = {
      status,
      bugs,
      performance_score: siteHealth.performance_score || 0,
      uptime: siteHealth.uptime || 'Verificando...',
      last_check: new Date().toISOString(),
      suggestions: [
        '🤖 Verificação manual executada com sucesso',
        '📈 Dados atualizados em tempo real',
        '🔔 Notificações ativadas para próximos checks'
      ]
    }
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro na verificação manual:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Configurar CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
