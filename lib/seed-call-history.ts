// Seeder para popular histórico de chamadas no sistema híbrido
import { supabase } from './supabase'

export interface CallHistoryData {
  id: string
  profile_id: string
  type: 'incoming_call' | 'outgoing_call' | 'missed_call'
  payload: {
    call_id: string
    call_type: 'audio' | 'video'
    from_user: {
      id: string
      username: string
      display_name: string
      photo_url?: string
    }
    to_user: {
      id: string
      username: string
      display_name: string
      photo_url?: string
    }
    duration: number
    status: 'completed' | 'missed' | 'declined'
  }
  read: boolean
  created_at: string
}

// Dados exemplo para popular o histórico
const sampleCallHistory: CallHistoryData[] = [
  {
    id: 'call_001',
    profile_id: 'user_001',
    type: 'missed_call',
    payload: {
      call_id: 'call_001',
      call_type: 'video',
      from_user: {
        id: 'user_002',
        username: 'ana_carolina',
        display_name: 'Ana Carolina',
        photo_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100'
      },
      to_user: {
        id: 'user_001',
        username: 'current_user',
        display_name: 'Você'
      },
      duration: 0,
      status: 'missed'
    },
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'call_002',
    profile_id: 'user_001',
    type: 'incoming_call',
    payload: {
      call_id: 'call_002',
      call_type: 'audio',
      from_user: {
        id: 'user_003',
        username: 'carlos_eduardo',
        display_name: 'Carlos Eduardo',
        photo_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100'
      },
      to_user: {
        id: 'user_001',
        username: 'current_user',
        display_name: 'Você'
      },
      duration: 325,
      status: 'completed'
    },
    read: true,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'call_003',
    profile_id: 'user_001',
    type: 'outgoing_call',
    payload: {
      call_id: 'call_003',
      call_type: 'audio',
      from_user: {
        id: 'user_001',
        username: 'current_user',
        display_name: 'Você'
      },
      to_user: {
        id: 'user_004',
        username: 'mariana_silva',
        display_name: 'Mariana Silva',
        photo_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100'
      },
      duration: 156,
      status: 'completed'
    },
    read: true,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'call_004',
    profile_id: 'user_001',
    type: 'missed_call',
    payload: {
      call_id: 'call_004',
      call_type: 'video',
      from_user: {
        id: 'user_005',
        username: 'pedro_oliveira',
        display_name: 'Pedro Oliveira',
        photo_url: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=100'
      },
      to_user: {
        id: 'user_001',
        username: 'current_user',
        display_name: 'Você'
      },
      duration: 0,
      status: 'missed'
    },
    read: false,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
]

// Função para obter histórico simulado (compatível com sistema híbrido)
export const getMockCallHistory = (userId?: string): CallHistoryData[] => {
  console.log('📞 Carregando histórico simulado de chamadas...')
  return sampleCallHistory.map(call => ({
    ...call,
    profile_id: userId || call.profile_id
  }))
}

// Função para seeder dados no Supabase (se estiver disponível)
export const seedCallHistory = async (userId?: string) => {
  try {
    console.log('📞 Populando histórico de chamadas...')
    
    const historyToInsert = sampleCallHistory.map(call => ({
      ...call,
      profile_id: userId || call.profile_id
    }))
    
    // Tentar inserir no Supabase
    const { data, error } = await supabase
      .from('notifications')
      .upsert(historyToInsert, { onConflict: 'id' })
    
    if (error) {
      console.warn('⚠️ Erro ao inserir no Supabase, usando dados mock:', error.message)
      return getMockCallHistory(userId)
    }
    
    console.log('✅ Histórico de chamadas populado com sucesso!')
    return data || historyToInsert
    
  } catch (error) {
    console.warn('⚠️ Fallback para dados simulados:', error)
    return getMockCallHistory(userId)
  }
}

// Função para obter histórico (com fallback automático)
export const getCallHistory = async (userId?: string): Promise<CallHistoryData[]> => {
  try {
    // Primeiro, tentar carregar do Supabase
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', userId || 'user_001')
      .in('type', ['incoming_call', 'outgoing_call', 'missed_call'])
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Se deu erro ou não há dados, usar mock
    if (error || !notifications || notifications.length === 0) {
      console.log('📞 Usando dados simulados de histórico de chamadas')
      return getMockCallHistory(userId)
    }
    
    console.log('📞 Histórico carregado do banco:', notifications.length, 'chamadas')
    return notifications as CallHistoryData[]
    
  } catch (error) {
    console.log('📞 Erro ao carregar histórico, usando dados simulados:', error)
    return getMockCallHistory(userId)
  }
}
