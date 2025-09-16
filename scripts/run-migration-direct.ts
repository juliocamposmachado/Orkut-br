import { runMigration, checkMigrationStatus } from '../lib/supabase-to-pastedb-migrator'

async function runMigrationDirect() {
  try {
    console.log('🚀 Executando migração direta...')
    
    // Verificar status antes
    console.log('📊 Verificando status antes da migração...')
    const statusBefore = await checkMigrationStatus()
    console.log('Status antes:', JSON.stringify(statusBefore, null, 2))
    
    // Executar migração
    console.log('🔄 Iniciando migração completa...')
    const result = await runMigration({
      batchSize: 10,
      delayBetweenBatches: 100,
      enableBackup: false, // Desabilitar backup para debug
      skipExisting: false
    })
    
    console.log('📋 Resultado da migração:')
    console.log(JSON.stringify(result, null, 2))
    
    // Verificar status depois
    console.log('📊 Verificando status após migração...')
    const statusAfter = await checkMigrationStatus()
    console.log('Status depois:', JSON.stringify(statusAfter, null, 2))
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A')
  }
}

runMigrationDirect()
