import { NextRequest, NextResponse } from 'next/server'
import { SupabaseToPasteDBMigrator, runMigration, checkMigrationStatus } from '@/lib/supabase-to-pastedb-migrator'

// 🚀 API ENDPOINT PARA MIGRAÇÃO SUPABASE → PASTEDB
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando processo de migração Supabase → PasteDB...')

    // Verificar status atual antes da migração
    const statusBefore = await checkMigrationStatus()
    console.log('📊 Status antes da migração:', statusBefore)

    // Executar migração completa
    const result = await runMigration({
      batchSize: 100,
      delayBetweenBatches: 500,
      enableBackup: true,
      skipExisting: false
    })

    // Verificar status após migração
    const statusAfter = await checkMigrationStatus()
    console.log('📊 Status após migração:', statusAfter)

    return NextResponse.json({
      success: result.success,
      message: result.success ? 
        `✅ Migração concluída com sucesso! ${result.migratedRecords}/${result.totalRecords} registros migrados` :
        `❌ Migração parcialmente concluída com erros`,
      result,
      statusBefore,
      statusAfter,
      summary: {
        totalTime: `${(result.duration / 1000).toFixed(2)}s`,
        successRate: `${((result.migratedRecords / result.totalRecords) * 100).toFixed(1)}%`,
        recordsMigrated: result.migratedRecords,
        recordsFailed: result.failedRecords
      }
    }, { 
      status: result.success ? 200 : 206 // 206 = Partial Content (sucesso parcial)
    })

  } catch (error) {
    console.error('❌ Erro na migração:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno durante a migração',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// GET - Verificar status da migração
export async function GET() {
  try {
    console.log('📊 Verificando status da migração...')

    const status = await checkMigrationStatus()
    
    const needsMigration = Object.values(status.missingRecords).some(count => count > 0)
    const totalSupabase = Object.values(status.supabaseRecords).reduce((a, b) => a + b, 0)
    const totalPasteDB = Object.values(status.pastedbRecords).reduce((a, b) => a + b, 0)
    const totalMissing = Object.values(status.missingRecords).reduce((a, b) => a + b, 0)

    return NextResponse.json({
      status: 'success',
      needsMigration,
      summary: {
        totalSupabaseRecords: totalSupabase,
        totalPasteDBRecords: totalPasteDB,
        totalMissingRecords: totalMissing,
        migrationProgress: totalSupabase > 0 ? `${((totalPasteDB / totalSupabase) * 100).toFixed(1)}%` : '0%'
      },
      details: status,
      recommendations: needsMigration ? [
        'Execute POST /api/migration/run para migrar dados em falta',
        'Ou execute POST /api/migration/incremental para migração incremental'
      ] : [
        'Todos os dados estão sincronizados! 🎉',
        'Execute migrações incrementais periodicamente para manter atualizado'
      ]
    })

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Erro ao verificar status da migração',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
