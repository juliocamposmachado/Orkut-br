'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  username: string
  display_name: string
  photo_url?: string
  created_at: string
}

export function SupabaseExample() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(10)

      if (error) {
        throw error
      }

      setProfiles(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">🔄 Carregando perfis...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4 text-red-600">❌ Erro ao carregar dados</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={loadProfiles}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔄 Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        👥 Perfis do Supabase ({profiles.length})
      </h2>
      
      {profiles.length === 0 ? (
        <div className="text-gray-600">
          <p>Nenhum perfil encontrado.</p>
          <p className="text-sm mt-2">
            Isso é normal se ainda não há dados na tabela "profiles".
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="border rounded p-4">
              <div className="flex items-center gap-3">
                {profile.photo_url && (
                  <img 
                    src={profile.photo_url} 
                    alt={profile.display_name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{profile.display_name}</h3>
                  <p className="text-gray-600">@{profile.username}</p>
                  <p className="text-xs text-gray-400">
                    Criado em: {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={loadProfiles}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        🔄 Recarregar dados
      </button>
    </div>
  )
}
