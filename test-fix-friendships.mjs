import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

console.log('🧪 Testando correção da API de friendships...')

async function testFriendshipAPI() {
  try {
    // 1. Primeiro fazer um teste direto na API POST
    const testData = {
      addressee_id: '46b8c818-7f37-4412-9bcd-aaf6c9599530' // ID do radiotatuapefm
    }

    console.log('\n📤 Testando POST /api/friendships...')
    console.log('Dados de teste:', testData)

    // Fazer request para a API local (assumindo que está rodando)
    const response = await fetch('http://localhost:3000/api/friendships', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    const result = await response.json()
    
    console.log(`\n📊 Resposta da API (Status: ${response.status}):`)
    console.log(JSON.stringify(result, null, 2))

    if (response.status === 200 && result.success) {
      console.log('\n✅ SUCESSO! A API de friendships está funcionando!')
      
      // Se funcionou, tentar deletar o registro de teste
      if (result.data && result.data.id) {
        console.log('\n🗑️ Removendo registro de teste...')
        
        const deleteResponse = await fetch(`http://localhost:3000/api/friendships?friendship_id=${result.data.id}`, {
          method: 'DELETE'
        })

        if (deleteResponse.status === 200) {
          console.log('✅ Registro de teste removido com sucesso')
        }
      }
    } else if (response.status === 401) {
      console.log('\n⚠️ Erro 401: Sem autenticação - isso é esperado em teste externo')
      console.log('💡 Para testar completamente, use a interface web com usuário logado')
    } else {
      console.log('\n❌ FALHA! Erro na API:')
      console.log('Resposta:', result)
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️ Servidor não está rodando')
      console.log('💡 Execute: npm run dev')
      console.log('💡 Depois teste na interface web fazendo login e tentando adicionar um amigo')
    } else {
      console.error('\n❌ Erro no teste:', error.message)
    }
  }
}

async function showInstructions() {
  console.log('\n📋 INSTRUÇÕES PARA TESTAR A CORREÇÃO:')
  console.log('')
  console.log('1. 🚀 Execute o projeto:')
  console.log('   npm run dev')
  console.log('')
  console.log('2. 🔐 Faça login na aplicação:')
  console.log('   http://localhost:3000')
  console.log('')
  console.log('3. 👥 Teste adicionar um amigo:')
  console.log('   - Vá para a página de perfil de outro usuário')
  console.log('   - Clique em "Adicionar como amigo"')
  console.log('   - Verifique se a solicitação é criada sem erro')
  console.log('')
  console.log('4. 📊 Verifique os logs no console:')
  console.log('   - Se aparecer "⚠️ RLS falhou, tentando com service role..."')
  console.log('   - Seguido de "✅ Service role fallback funcionou!"')
  console.log('   - Então a correção está funcionando!')
  console.log('')
  console.log('🔧 ALTERNATIVA: Execute o script SQL no Supabase:')
  console.log('   1. Abra o Supabase Dashboard')
  console.log('   2. Vá em SQL Editor')
  console.log('   3. Execute o arquivo: sql/fix_friendships_rls.sql')
  console.log('   4. Isso criará políticas RLS mais robustas')
  console.log('')
}

// Executar teste
testFriendshipAPI().then(() => {
  showInstructions()
})
