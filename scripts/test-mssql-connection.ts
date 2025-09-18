#!/usr/bin/env ts-node

/**
 * 🔧 SCRIPT DE TESTE - MS SQL SERVER CONNECTION
 * =============================================
 * 
 * Script para testar a conexão com o banco MS SQL Server 2022 Express
 * e verificar se as configurações estão corretas.
 */

import { testConnection, executeQuery, closeConnection, TABLE_DEFINITIONS } from '../lib/mssql';
import { getOrkutMSSQL } from '../lib/orkut-mssql-adapter';

async function main() {
  console.log('🚀 TESTE DE CONEXÃO MS SQL SERVER');
  console.log('================================\n');

  try {
    // Teste básico de conexão
    console.log('📋 1. Testando conexão básica...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Falha na conexão básica');
    }
    
    console.log('✅ Conexão básica bem-sucedida!\n');

    // Teste de informações do servidor
    console.log('📋 2. Obtendo informações do servidor...');
    const serverInfo = await executeQuery(`
      SELECT 
        @@VERSION as server_version,
        DB_NAME() as database_name,
        @@SERVERNAME as server_name,
        SUSER_SNAME() as user_name,
        GETDATE() as server_date
    `);

    if (serverInfo.recordset.length > 0) {
      const info = serverInfo.recordset[0];
      console.log(`✅ Servidor: ${info.server_name}`);
      console.log(`✅ Banco de dados: ${info.database_name}`);
      console.log(`✅ Usuário atual: ${info.user_name}`);
      console.log(`✅ Data/hora: ${info.server_date}`);
      console.log(`✅ Versão: ${info.server_version.substring(0, 100)}...\n`);
    }

    // Verificar se as tabelas existem
    console.log('📋 3. Verificando estrutura do banco...');
    const tablesResult = await executeQuery(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    console.log(`📊 Tabelas encontradas: ${tablesResult.recordset.length}`);
    tablesResult.recordset.forEach((table: any) => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    console.log();

    // Teste do adaptador
    console.log('📋 4. Testando adaptador Orkut...');
    const orkutAdapter = getOrkutMSSQL();
    await orkutAdapter.initialize();
    
    const stats = await orkutAdapter.getStats();
    console.log('📊 Estatísticas do banco:');
    console.log(`   - Perfis: ${stats.profiles}`);
    console.log(`   - Posts: ${stats.posts}`);
    console.log(`   - Comunidades: ${stats.communities}`);
    console.log(`   - Amizades: ${stats.friendships}\n`);

    console.log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
    console.log('🎉 Banco MS SQL Server está configurado corretamente!\n');

    // Mostrar próximos passos
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Configurar senha no arquivo .env');
    console.log('2. Criar estrutura de tabelas se necessário');
    console.log('3. Migrar dados existentes');
    console.log('4. Ativar flag NEXT_PUBLIC_USE_MSSQL_FOR_DATA=true\n');

  } catch (error) {
    console.error('❌ ERRO NO TESTE DE CONEXÃO:');
    console.error(error);
    console.log('\n🔧 SOLUÇÕES POSSÍVEIS:');
    console.log('1. Verifique se a senha do MS SQL Server está correta');
    console.log('2. Confirme se o servidor está acessível: OrkutBr.mssql.somee.com');
    console.log('3. Verifique se as variáveis de ambiente estão configuradas');
    console.log('4. Confirme se o usuário juliomachado_SQLLogin_1 tem as permissões necessárias');
    process.exit(1);
  } finally {
    // Fechar conexão
    await closeConnection();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}
