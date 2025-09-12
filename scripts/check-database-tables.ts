/**
 * Script para verificar se as tabelas necessárias existem no banco de dados
 * Execute no console do navegador ou como script Node.js
 */

import { supabase } from '@/lib/supabase'

interface DatabaseCheckResult {
  tableName: string
  exists: boolean
  sampleCount: number
  structure?: any[]
  error?: string
}

/**
 * Verifica se uma tabela existe e retorna informações básicas
 */
async function checkTable(tableName: string): Promise<DatabaseCheckResult> {
  try {
    console.log(`🔍 Verificando tabela: ${tableName}`)
    
    // Tentar fazer uma query para verificar se a tabela existe
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(0)
    
    if (error) {
      console.error(`❌ Erro ao verificar ${tableName}:`, error)
      return {
        tableName,
        exists: false,
        sampleCount: 0,
        error: error.message
      }
    }
    
    // Se chegou até aqui, a tabela existe
    console.log(`✅ Tabela ${tableName} existe com ${count || 0} registros`)
    
    return {
      tableName,
      exists: true,
      sampleCount: count || 0
    }
    
  } catch (error) {
    console.error(`❌ Erro inesperado ao verificar ${tableName}:`, error)
    return {
      tableName,
      exists: false,
      sampleCount: 0,
      error: (error as Error).message
    }
  }
}

/**
 * Obtém amostra de dados da tabela para verificar estrutura
 */
async function getTableSample(tableName: string, limit = 1) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit)
    
    if (error) {
      console.warn(`⚠️ Não foi possível obter amostra de ${tableName}:`, error)
      return null
    }
    
    return data
  } catch (error) {
    console.error(`❌ Erro ao obter amostra de ${tableName}:`, error)
    return null
  }
}

/**
 * Função principal para verificar todas as tabelas necessárias
 */
export async function checkDatabaseTables() {
  console.log('🚀 Iniciando verificação das tabelas do banco de dados...')
  
  const requiredTables = [
    'profiles',
    'notifications', 
    'call_signals',
    'user_presence',
    'calls',
    'friends',
    'photos'
  ]
  
  const results: DatabaseCheckResult[] = []
  
  for (const tableName of requiredTables) {
    const result = await checkTable(tableName)
    results.push(result)
    
    // Se a tabela existe, obter uma amostra
    if (result.exists && result.sampleCount > 0) {
      const sample = await getTableSample(tableName)
      if (sample && sample.length > 0) {
        result.structure = Object.keys(sample[0])
        console.log(`📊 Estrutura de ${tableName}:`, result.structure)
      }
    }
    
    // Delay pequeno para não sobrecarregar o banco
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Relatório final
  console.log('\n📋 RELATÓRIO DE VERIFICAÇÃO DO BANCO DE DADOS')
  console.log('=' .repeat(50))
  
  const existingTables = results.filter(r => r.exists)
  const missingTables = results.filter(r => !r.exists)
  
  console.log(`✅ Tabelas encontradas: ${existingTables.length}/${requiredTables.length}`)
  console.log(`❌ Tabelas ausentes: ${missingTables.length}`)
  
  if (existingTables.length > 0) {
    console.log('\n🟢 TABELAS EXISTENTES:')
    existingTables.forEach(table => {
      console.log(`  • ${table.tableName}: ${table.sampleCount} registros`)
      if (table.structure) {
        console.log(`    Campos: ${table.structure.join(', ')}`)
      }
    })
  }
  
  if (missingTables.length > 0) {
    console.log('\n🔴 TABELAS AUSENTES:')
    missingTables.forEach(table => {
      console.log(`  • ${table.tableName}: ${table.error || 'Não encontrada'}`)
    })
    
    console.log('\n💡 SUGESTÕES PARA CORRIGIR:')
    console.log('1. Verifique se as migrações do Supabase foram executadas')
    console.log('2. Execute os scripts SQL de criação das tabelas')
    console.log('3. Verifique as permissões RLS (Row Level Security)')
  }
  
  return {
    total: requiredTables.length,
    existing: existingTables.length,
    missing: missingTables.length,
    results
  }
}

/**
 * Verifica especificamente as tabelas relacionadas às chamadas
 */
export async function checkCallTables() {
  console.log('📞 Verificando tabelas específicas de chamadas...')
  
  const callTables = ['notifications', 'call_signals', 'user_presence']
  
  for (const tableName of callTables) {
    const result = await checkTable(tableName)
    
    if (result.exists) {
      // Verificações específicas para cada tabela
      switch (tableName) {
        case 'notifications':
          await checkNotificationStructure()
          break
        case 'call_signals':
          await checkCallSignalStructure()
          break
        case 'user_presence':
          await checkUserPresenceStructure()
          break
      }
    }
  }
}

/**
 * Verifica estrutura da tabela notifications
 */
async function checkNotificationStructure() {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('type')
      .eq('type', 'incoming_call')
      .limit(1)
    
    if (error) {
      console.warn('⚠️ Tabela notifications pode não ter campo "type" ou valor "incoming_call"')
    } else {
      console.log('✅ Tabela notifications configurada corretamente para chamadas')
    }
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura da tabela notifications')
  }
}

/**
 * Verifica estrutura da tabela call_signals
 */
async function checkCallSignalStructure() {
  try {
    const { data, error } = await supabase
      .from('call_signals')
      .select('signal_type')
      .limit(1)
    
    if (error) {
      console.warn('⚠️ Tabela call_signals pode não ter estrutura adequada')
    } else {
      console.log('✅ Tabela call_signals está acessível')
    }
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura da tabela call_signals')
  }
}

/**
 * Verifica estrutura da tabela user_presence
 */
async function checkUserPresenceStructure() {
  try {
    const { data, error } = await supabase
      .from('user_presence')
      .select('is_online')
      .limit(1)
    
    if (error) {
      console.warn('⚠️ Tabela user_presence pode não ter estrutura adequada')
    } else {
      console.log('✅ Tabela user_presence está acessível')
    }
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura da tabela user_presence')
  }
}

/**
 * Função para executar no console do navegador
 */
export async function runDatabaseCheck() {
  console.log('🔧 VERIFICAÇÃO DO BANCO DE DADOS - SISTEMA DE CHAMADAS')
  console.log('Executando em:', new Date().toLocaleString())
  
  try {
    const result = await checkDatabaseTables()
    
    if (result.missing > 0) {
      console.log('\n⚠️ AÇÃO NECESSÁRIA: Algumas tabelas estão ausentes')
      console.log('Execute os scripts de criação do banco de dados')
    } else {
      console.log('\n🎉 SUCESSO: Todas as tabelas necessárias estão presentes')
    }
    
    // Verificar tabelas específicas de chamadas
    await checkCallTables()
    
    return result
  } catch (error) {
    console.error('❌ Erro na verificação do banco de dados:', error)
    throw error
  }
}

// Se executado diretamente no console
if (typeof window !== 'undefined') {
  (window as any).checkDatabase = runDatabaseCheck
  console.log('💡 Execute "checkDatabase()" no console para verificar o banco de dados')
}
