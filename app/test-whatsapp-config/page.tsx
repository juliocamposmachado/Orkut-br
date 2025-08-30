'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function TestWhatsAppConfig() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const configureRadioWhatsApp = async () => {
    setLoading(true)
    setResult('')
    
    console.log('🔧 Configurando WhatsApp para Rádio Tatuapé FM...')
    
    try {
      // Primeiro, buscar o UUID do usuário da rádio
      console.log('🔍 Buscando UUID do usuário radiotatuapefm...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .eq('username', 'radiotatuapefm')
        .single()
      
      if (profileError || !profileData) {
        setResult(`❌ Usuário radiotatuapefm não encontrado na tabela profiles. Erro: ${profileError?.message || 'Perfil não existe'}`)
        return
      }
      
      console.log('✅ Usuário encontrado:', profileData)
      
      const whatsappConfig = {
        user_id: profileData.id, // Usar o UUID encontrado
        is_enabled: true,
        voice_call_link: 'https://call.whatsapp.com/voice/c8OLiu8Wec4ZqODTqPTJMk',
        video_call_link: 'https://call.whatsapp.com/video/6GrHTFI5ILxMiJhwcOPkGn',
        whatsapp_phone: '5511970603441',
        whatsapp_groups: []
      }
      
      const { data, error } = await supabase
        .from('whatsapp_config')
        .upsert(whatsappConfig, {
          onConflict: 'user_id'
        })
      
      if (error) {
        console.error('❌ Erro ao configurar WhatsApp:', error)
        setResult(`❌ Erro: ${error.message}`)
      } else {
        console.log('✅ WhatsApp configurado com sucesso:', data)
        setResult(`✅ WhatsApp configurado com sucesso para ${profileData.display_name} (UUID: ${profileData.id})!\nAgora os botões devem aparecer verdes na página do perfil.`)
      }
    } catch (err) {
      console.error('❌ Erro na configuração:', err)
      setResult(`❌ Erro: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentConfig = async () => {
    setLoading(true)
    setResult('')
    
    try {
      // Buscar configuração usando JOIN com a tabela profiles
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select(`
          *,
          profiles!inner(username, display_name)
        `)
        .eq('profiles.username', 'radiotatuapefm')
        .single()
      
      if (error && error.code !== 'PGRST116') {
        setResult(`❌ Erro ao verificar config: ${error.message}`)
      } else if (!data) {
        setResult('📝 Nenhuma configuração encontrada para a rádio')
      } else {
        setResult(`📊 Configuração atual para ${data.profiles.display_name}:\n${JSON.stringify(data, null, 2)}`)
      }
    } catch (err) {
      setResult(`❌ Erro: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Teste de Configuração WhatsApp</h1>
      
      <div className="space-y-4">
        <Button 
          onClick={configureRadioWhatsApp}
          disabled={loading}
          className="mr-4"
        >
          {loading ? 'Configurando...' : 'Configurar WhatsApp Rádio Tatuapé FM'}
        </Button>
        
        <Button 
          onClick={checkCurrentConfig}
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Verificando...' : 'Verificar Configuração Atual'}
        </Button>
      </div>
      
      {result && (
        <div className="mt-8 p-4 border rounded bg-gray-50">
          <h3 className="font-bold mb-2">Resultado:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
      
      <div className="mt-8 p-4 border rounded bg-blue-50">
        <h3 className="font-bold mb-2">Próximos passos:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Execute "Configurar WhatsApp Rádio Tatuapé FM"</li>
          <li>Vá para <a href="/perfil/radiotatuapefm" className="text-blue-600 underline">o perfil da rádio</a></li>
          <li>Verifique se os botões aparecem em verde</li>
          <li>Teste clicando nos botões para abrir o WhatsApp</li>
        </ol>
      </div>
    </div>
  )
}
