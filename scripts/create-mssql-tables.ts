#!/usr/bin/env ts-node

/**
 * 🔧 SCRIPT DE CRIAÇÃO DE TABELAS - MS SQL SERVER
 * ===============================================
 * 
 * Script para criar a estrutura de tabelas necessárias
 * no banco MS SQL Server 2022 Express para o projeto Orkut.
 */

import { executeQuery, closeConnection, TABLE_DEFINITIONS } from '../lib/mssql';

async function createTables() {
  console.log('🚀 CRIAÇÃO DE TABELAS MS SQL SERVER');
  console.log('===================================\n');

  const tableOrder = ['profiles', 'posts', 'communities', 'friendships', 'comments', 'likes', 'messages'];
  let createdCount = 0;
  let skippedCount = 0;

  try {
    for (const tableName of tableOrder) {
      console.log(`📋 Processando tabela: ${tableName}`);
      
      // Verificar se a tabela já existe
      const checkResult = await executeQuery(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = @tableName AND TABLE_TYPE = 'BASE TABLE'
      `, { tableName });

      if (checkResult.recordset.length > 0) {
        console.log(`   ⏭️ Tabela '${tableName}' já existe - pulando`);
        skippedCount++;
        continue;
      }

      // Criar a tabela
      const createSQL = TABLE_DEFINITIONS[tableName as keyof typeof TABLE_DEFINITIONS];
      if (!createSQL) {
        console.log(`   ❌ Definição não encontrada para tabela '${tableName}'`);
        continue;
      }

      await executeQuery(createSQL);
      console.log(`   ✅ Tabela '${tableName}' criada com sucesso`);
      createdCount++;
    }

    console.log('\n📊 RESUMO DA CRIAÇÃO:');
    console.log(`   ✅ Tabelas criadas: ${createdCount}`);
    console.log(`   ⏭️ Tabelas já existentes: ${skippedCount}`);
    console.log(`   📋 Total processadas: ${tableOrder.length}`);

    if (createdCount > 0) {
      console.log('\n🎉 Estrutura de tabelas criada com sucesso!');
      console.log('💡 Próximo passo: migrar dados existentes ou inserir dados de teste');
    } else {
      console.log('\n✨ Todas as tabelas já existiam - estrutura está pronta!');
    }

    // Verificar integridade final
    console.log('\n📋 Verificação final da estrutura...');
    const finalCheck = await executeQuery(`
      SELECT TABLE_NAME, 
             (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as column_count
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    finalCheck.recordset.forEach((table: any) => {
      console.log(`   📊 ${table.TABLE_NAME}: ${table.column_count} colunas`);
    });

  } catch (error) {
    console.error('\n❌ ERRO NA CRIAÇÃO DE TABELAS:');
    console.error(error);
    console.log('\n🔧 VERIFICAÇÕES NECESSÁRIAS:');
    console.log('1. Confirme se o usuário tem permissões de CREATE TABLE');
    console.log('2. Verifique se a conexão com o banco está funcionando');
    console.log('3. Certifique-se de que o banco de dados existe');
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

async function main() {
  await createTables();
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}
