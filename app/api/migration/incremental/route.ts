import { NextRequest, NextResponse } from 'next/server'
import { runIncrementalMigration, checkMigrationStatus } from '@/lib/supabase-to-pastedb-migrator'

// 🔄 API ENDPOINT PARA MIGRAÇÃO INCREMENTAL SUPABASE → PASTEDB
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando migração incremental Supabase → PasteDB...')

    // Verificar o que precisa ser migrado
    const statusBefore = await checkMigrationStatus()
    console.log('📊 Status antes da migração incremental:', statusBefore)

    const totalMissing = Object.values(statusBefore.missingRecords).reduce((a, b) => a + b, 0)
    
    if (totalMissing === 0) {
      return NextResponse.json({
        success: true,
        message: '✅ Nenhum registro novo para migrar - tudo já está sincronizado!',
        result: {
          totalRecords: 0,
          migratedRecords: 0,
          failedRecords: 0,
          duration: 0,
          errors: []
        },
        statusBefore,
        statusAfter: statusBefore
      })
    }

    console.log(`📋 Encontrados ${totalMissing} registros para migração incremental`)

    // Executar migração incremental
    const result = await runIncrementalMigration()

    // Verificar status após migração
    const statusAfter = await checkMigrationStatus()
    console.log('📊 Status após migração incremental:', statusAfter)

    return NextResponse.json({
      success: result.success,
      message: result.success ? 
        `✅ Migração incremental concluída! ${result.migratedRecords}/${result.totalRecords} registros migrados` :
        `⚠️ Migração incremental com alguns erros`,
      result,
      statusBefore,
      statusAfter,
      summary: {
        totalTime: `${(result.duration / 1000).toFixed(2)}s`,
        successRate: result.totalRecords > 0 ? `${((result.migratedRecords / result.totalRecords) * 100).toFixed(1)}%` : '100%',
        recordsMigrated: result.migratedRecords,
        recordsFailed: result.failedRecords,
        recordsAlreadySynced: totalMissing - result.totalRecords
      }
    }, { 
      status: result.success ? 200 : 206
    })

  } catch (error) {
    console.error('❌ Erro na migração incremental:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno durante a migração incremental',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// GET - Verifica quais dados precisam de migração incremental
export async function GET() {
  try {
    console.log('🔍 Verificando dados pendentes para migração incremental...')

    const status = await checkMigrationStatus()
    
    const pendingMigrations = Object.entries(status.missingRecords)
      .filter(([table, count]) => count > 0)
      .map(([table, count]) => ({ table, pendingRecords: count }))

    const totalPending = Object.values(status.missingRecords).reduce((a, b) => a + b, 0)

    return NextResponse.json({
      status: 'success',
      hasPendingMigrations: totalPending > 0,
      totalPendingRecords: totalPending,
      pendingByTable: pendingMigrations,
      fullStatus: status,
      recommendations: totalPending > 0 ? [
        `Execute POST /api/migration/incremental para migrar ${totalPending} registros pendentes`,
        'Migração incremental é mais rápida e segura para atualizações'
      ] : [
        '🎉 Nenhuma migração pendente - sistema totalmente sincronizado!',
        'Execute verificações periódicas para manter os dados atualizados'
      ]
    })

  } catch (error) {
    console.error('❌ Erro ao verificar migração incremental:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Erro ao verificar dados pendentes',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
