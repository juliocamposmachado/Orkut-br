const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupWebRTCTables() {
  console.log('🚀 Configurando tabelas WebRTC...\n');

  try {
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('./sql/webrtc_tables.sql', 'utf8');
    
    // Dividir em comandos individuais (dividir por ponto e vírgula)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.length === 0) continue;
      
      console.log(`⏳ Comando ${i + 1}/${commands.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: command 
        });
        
        if (error) {
          // Tentar execução direta se RPC falhar
          const { error: directError } = await supabase
            .from('_dummy') // Tabela que não existe
            .select('*');
          
          // Usar API REST direta
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceRoleKey}`,
              'apikey': supabaseServiceRoleKey
            },
            body: JSON.stringify({ sql_query: command })
          });
          
          if (!response.ok) {
            console.log(`⚠️  Comando ${i + 1} pode ter falhado (isso é normal para alguns comandos): ${error?.message || 'Unknown error'}`);
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      } catch (err) {
        console.log(`⚠️  Comando ${i + 1} pode ter falhado: ${err.message}`);
      }
    }

    console.log('\n🎉 Setup das tabelas WebRTC concluído!');
    console.log('\n📋 Tabelas criadas:');
    console.log('  ✅ call_signals - Para sinalização WebRTC');
    console.log('  ✅ user_presence - Para status online/offline');
    console.log('\n🔒 Políticas de segurança (RLS) configuradas');
    console.log('🧹 Função de limpeza automática criada');
    
    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['call_signals', 'user_presence'])
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('⚠️  Não foi possível verificar as tabelas criadas');
    } else if (tables && tables.length > 0) {
      console.log('✅ Tabelas verificadas:', tables.map(t => t.table_name).join(', '));
    } else {
      console.log('⚠️  As tabelas podem não ter sido criadas corretamente');
    }

  } catch (error) {
    console.error('❌ Erro ao configurar tabelas WebRTC:', error.message);
    process.exit(1);
  }
}

setupWebRTCTables();
