import { NextRequest, NextResponse } from 'next/server'

// Configuração da API do Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

interface SystemReport {
  timestamp: string
  overall_health: 'excellent' | 'good' | 'warning' | 'critical'
  deploy_analysis: any
  bug_detection: any
  notifications_created: number
  ai_summary: string
  recommendations: string[]
  next_check_in: string
}

// Função principal de verificação do sistema
async function runSystemCheck(): Promise<SystemReport> {
  console.log('🚀 Iniciando verificação completa do sistema Orkut...')
  
  try {
    // 1. Verificar bugs e performance
    console.log('🔍 Verificando bugs e performance...')
    const bugMonitorResponse = await fetch('http://localhost:3000/api/bug-monitor', {
      method: 'GET'
    })
    const bugData = await bugMonitorResponse.json()

    // 2. Verificar deploy
    console.log('📦 Analisando deploy...')
    const deployResponse = await fetch('http://localhost:3000/api/deploy-checker', {
      method: 'GET'
    })
    const deployData = await deployResponse.json()

    // 3. Criar notificações se necessário
    let notificationsCreated = 0
    
    // Se encontrou bugs críticos ou de alta severidade, criar notificações
    const criticalBugs = bugData.bugs?.filter((bug: any) => 
      bug.severity === 'critical' || bug.severity === 'high'
    ) || []

    if (criticalBugs.length > 0) {
      console.log(`⚠️ Encontrados ${criticalBugs.length} bugs críticos, criando notificações...`)
      
      for (const bug of criticalBugs) {
        try {
          const notificationResponse = await fetch('http://localhost:3000/api/bug-notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bug_report: bug,
              auto_post_to_feed: true,
              notify_users: true
            })
          })
          
          if (notificationResponse.ok) {
            notificationsCreated++
          }
        } catch (error) {
          console.error('Erro ao criar notificação:', error)
        }
      }
    }

    // 4. Determinar saúde geral do sistema
    let overallHealth: SystemReport['overall_health'] = 'excellent'
    
    const totalBugs = bugData.bugs?.length || 0
    const criticalBugsCount = bugData.bugs?.filter((b: any) => b.severity === 'critical').length || 0
    const highBugsCount = bugData.bugs?.filter((b: any) => b.severity === 'high').length || 0
    const performanceScore = bugData.performance_score || 100

    if (criticalBugsCount > 0 || performanceScore < 30) {
      overallHealth = 'critical'
    } else if (highBugsCount > 0 || performanceScore < 60 || deployData.status === 'failed') {
      overallHealth = 'warning'
    } else if (totalBugs > 2 || performanceScore < 80) {
      overallHealth = 'good'
    }

    // 5. Gerar resumo com IA
    console.log('🤖 Gerando resumo com IA...')
    const aiSummary = await generateSystemSummary({
      totalBugs,
      criticalBugsCount,
      highBugsCount,
      performanceScore,
      deployStatus: deployData.status,
      overallHealth,
      uptime: bugData.uptime
    })

    // 6. Gerar recomendações
    const recommendations = generateRecommendations({
      overallHealth,
      performanceScore,
      totalBugs,
      criticalBugsCount,
      deployData,
      bugData
    })

    // 7. Calcular próxima verificação (baseado na saúde do sistema)
    const checkIntervals = {
      'critical': 5,     // 5 minutos
      'warning': 15,     // 15 minutos  
      'good': 30,        // 30 minutos
      'excellent': 60    // 60 minutos
    }
    
    const nextCheckMinutes = checkIntervals[overallHealth]
    const nextCheckTime = new Date(Date.now() + nextCheckMinutes * 60000)

    const systemReport: SystemReport = {
      timestamp: new Date().toISOString(),
      overall_health: overallHealth,
      deploy_analysis: deployData,
      bug_detection: bugData,
      notifications_created: notificationsCreated,
      ai_summary: aiSummary,
      recommendations,
      next_check_in: `${nextCheckMinutes} minutos (${nextCheckTime.toLocaleTimeString('pt-BR')})`
    }

    console.log(`✅ Verificação concluída - Saúde: ${overallHealth}, Bugs: ${totalBugs}, Notificações: ${notificationsCreated}`)
    
    return systemReport

  } catch (error) {
    console.error('❌ Erro na verificação do sistema:', error)
    
    return {
      timestamp: new Date().toISOString(),
      overall_health: 'critical',
      deploy_analysis: { error: 'Falha na verificação de deploy' },
      bug_detection: { error: 'Falha na detecção de bugs' },
      notifications_created: 0,
      ai_summary: 'Sistema de monitoramento temporariamente indisponível. Verificação manual necessária.',
      recommendations: [
        '🔧 Reiniciar sistema de monitoramento',
        '🛠️ Verificar conectividade das APIs',
        '📞 Contatar equipe técnica'
      ],
      next_check_in: '5 minutos (modo de recuperação)'
    }
  }
}

// Função para gerar resumo com IA
async function generateSystemSummary(data: any): Promise<string> {
  try {
    const prompt = `
    Você é o Sistema de Monitoramento Orkut. Analise os dados e forneça um resumo executivo conciso:

    Dados do Sistema:
    - Total de bugs: ${data.totalBugs}
    - Bugs críticos: ${data.criticalBugsCount}
    - Bugs de alta prioridade: ${data.highBugsCount}
    - Score de performance: ${data.performanceScore}/100
    - Status do deploy: ${data.deployStatus}
    - Saúde geral: ${data.overallHealth}
    - Uptime: ${data.uptime}

    Forneça um resumo em português que seja:
    1. Profissional mas acessível
    2. Máximo 150 palavras
    3. Destaque pontos críticos
    4. Tranquilizador quando apropriado
    5. Use emojis sutis

    Formato: Status atual + principais observações + próximas ações (se necessário)
    `

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          topK: 1,
          topP: 1,
          maxOutputTokens: 400,
        }
      }),
    })

    if (response.ok) {
      const aiData = await response.json()
      return aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || getDefaultSummary(data.overallHealth)
    }
    
    return getDefaultSummary(data.overallHealth)
    
  } catch (error) {
    console.error('Erro ao gerar resumo com IA:', error)
    return getDefaultSummary(data.overallHealth)
  }
}

// Resumos padrão baseados na saúde do sistema
function getDefaultSummary(health: string): string {
  const summaries = {
    'excellent': '✨ Sistema Orkut funcionando perfeitamente! Todos os serviços operacionais, performance excelente e nenhum problema detectado. Monitoramento ativo mantendo a qualidade.',
    'good': '✅ Sistema estável e operacional. Pequenos pontos de atenção identificados, mas sem impacto para os usuários. Equipe acompanhando evolução.',
    'warning': '⚠️ Sistema operacional com algumas degradações detectadas. Equipe técnica investigando e aplicando correções. Experiência do usuário pode ser afetada minimamente.',
    'critical': '🚨 Problemas críticos identificados no sistema. Equipe técnica mobilizada para correção urgente. Atualizações frequentes até resolução completa.'
  }
  
  return summaries[health as keyof typeof summaries] || summaries.good
}

// Gerar recomendações baseadas no estado do sistema
function generateRecommendations(data: any): string[] {
  const recommendations = []

  if (data.overallHealth === 'critical') {
    recommendations.push('🚨 AÇÃO URGENTE: Resolver bugs críticos imediatamente')
    recommendations.push('📞 Notificar equipe de plantão')
    recommendations.push('⏱️ Aumentar frequência de monitoramento para 5 minutos')
  }

  if (data.performanceScore < 70) {
    recommendations.push('⚡ Otimizar performance - score abaixo do esperado')
    recommendations.push('🔍 Investigar gargalos de carregamento')
  }

  if (data.totalBugs > 3) {
    recommendations.push('🐛 Priorizar correção de bugs acumulados')
    recommendations.push('🔄 Revisar processo de deploy')
  }

  if (data.deployData?.status === 'failed') {
    recommendations.push('📦 Verificar falhas no último deploy')
    recommendations.push('🔧 Executar rollback se necessário')
  }

  // Recomendações gerais baseadas na saúde
  if (data.overallHealth === 'excellent') {
    recommendations.push('📈 Manter padrões de qualidade atuais')
    recommendations.push('🔄 Continuar monitoramento preventivo')
  } else if (data.overallHealth === 'good') {
    recommendations.push('✨ Otimizar pontos de melhoria identificados')
    recommendations.push('📊 Monitorar tendências de performance')
  }

  // Sempre incluir
  recommendations.push('🤖 Sistema de IA monitorando continuamente')
  recommendations.push(`⏰ Próxima verificação automática programada`)

  return recommendations.slice(0, 6) // Limitar a 6 recomendações
}

// Endpoint principal - GET para verificação automática
export async function GET(request: NextRequest) {
  try {
    const systemReport = await runSystemCheck()
    
    return NextResponse.json({
      success: true,
      report: systemReport,
      meta: {
        system_version: '1.0.0',
        api_version: 'v1',
        gemini_integration: 'active',
        monitoring_enabled: true
      }
    })

  } catch (error) {
    console.error('Erro no monitoramento do sistema:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Falha na verificação do sistema',
      report: {
        timestamp: new Date().toISOString(),
        overall_health: 'critical',
        ai_summary: 'Sistema de monitoramento temporariamente indisponível.',
        recommendations: ['🔧 Reiniciar serviços de monitoramento']
      }
    }, { status: 500 })
  }
}

// Endpoint para verificação manual com parâmetros customizados
export async function POST(request: NextRequest) {
  try {
    const { 
      force_deep_scan = false,
      create_test_notification = false,
      target_url = null
    } = await request.json()

    console.log('🔧 Executando verificação manual do sistema...')

    // Se solicitado, criar notificação de teste
    if (create_test_notification) {
      console.log('📝 Criando notificação de teste...')
      
      const testBug = {
        severity: 'low',
        category: 'functionality',
        description: 'Verificação manual do sistema executada com sucesso',
        recommendation: 'Sistema de monitoramento funcionando corretamente',
        timestamp: new Date().toISOString()
      }

      try {
        await fetch('http://localhost:3000/api/bug-notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bug_report: testBug,
            auto_post_to_feed: true,
            custom_message: '🤖 Sistema Orkut: Verificação manual executada. Tudo funcionando perfeitamente! ✨'
          })
        })
      } catch (error) {
        console.error('Erro ao criar notificação de teste:', error)
      }
    }

    // Executar verificação do sistema
    const systemReport = await runSystemCheck()

    return NextResponse.json({
      success: true,
      manual_check: true,
      report: systemReport,
      test_notification_created: create_test_notification,
      meta: {
        requested_at: new Date().toISOString(),
        force_deep_scan,
        target_url: target_url || 'https://orkut-br.vercel.app'
      }
    })

  } catch (error) {
    console.error('Erro na verificação manual:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Falha na verificação manual' 
    }, { status: 500 })
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
