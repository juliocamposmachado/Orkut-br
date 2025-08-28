'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye,
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Mail,
  Calendar,
  Activity,
  BarChart3
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface BannedUser {
  id: string
  email: string
  banned_at: string
  ban_reason: string
}

interface ModerationStats {
  total_reports: number
  approved_reports: number
  rejected_reports: number
  banned_users: number
  hidden_posts: number
  last_updated: string
}

export default function TransparenciaPage() {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [stats, setStats] = useState<ModerationStats>({
    total_reports: 0,
    approved_reports: 0,
    rejected_reports: 0,
    banned_users: 0,
    hidden_posts: 0,
    last_updated: new Date().toISOString()
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTransparencyData()
  }, [])

  const loadTransparencyData = async () => {
    try {
      setLoading(true)

      // Carregar usuários banidos (emails públicos para transparência)
      const { data: bannedData, error: bannedError } = await supabase
        .from('banned_users')
        .select('id, email, banned_at, ban_reason')
        .order('banned_at', { ascending: false })
        .limit(100) // Limitar a 100 mais recentes

      if (bannedError) {
        console.error('Erro ao carregar usuários banidos:', bannedError)
      } else {
        setBannedUsers(bannedData || [])
      }

      // Carregar estatísticas de moderação
      const [reportsCount, approvedCount, rejectedCount, hiddenPostsCount] = await Promise.all([
        supabase.from('post_reports').select('id', { count: 'exact', head: true }),
        supabase.from('post_reports').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('post_reports').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('is_hidden', true)
      ])

      setStats({
        total_reports: reportsCount.count || 0,
        approved_reports: approvedCount.count || 0,
        rejected_reports: rejectedCount.count || 0,
        banned_users: bannedData?.length || 0,
        hidden_posts: hiddenPostsCount.count || 0,
        last_updated: new Date().toISOString()
      })

    } catch (error) {
      console.error('Erro ao carregar dados de transparência:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Carregando dados de transparência...</p>
        </div>
      </div>
    )
  }

  const approvalRate = stats.total_reports > 0 
    ? ((stats.approved_reports / stats.total_reports) * 100).toFixed(1)
    : '0'

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Eye className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">
            Central de Transparência
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Mantemos nossa comunidade informada sobre as ações de moderação. 
          Aqui você pode acompanhar estatísticas, usuários banidos e o histórico 
          de moderação da plataforma.
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Denúncias</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total_reports}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Denúncias Aprovadas</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved_reports}</p>
                <p className="text-xs text-gray-500">{approvalRate}% de aprovação</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Posts Ocultados</p>
                <p className="text-3xl font-bold text-orange-600">{stats.hidden_posts}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Banidos</p>
                <p className="text-3xl font-bold text-red-600">{stats.banned_users}</p>
              </div>
              <Users className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="banned-users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="banned-users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários Banidos
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sobre a Moderação
          </TabsTrigger>
        </TabsList>

        {/* Lista de Usuários Banidos */}
        <TabsContent value="banned-users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-500" />
                Lista de Emails Banidos
              </CardTitle>
              <p className="text-sm text-gray-600">
                Transparência total: todos os emails banidos da plataforma são listados aqui para 
                conhecimento da comunidade.
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {bannedUsers.map((banned) => (
                    <div key={banned.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <Mail className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium text-red-800">
                            {banned.email}
                          </p>
                          <p className="text-xs text-red-600">
                            {banned.ban_reason}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="mb-1">
                          Banido
                        </Badge>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(banned.banned_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {bannedUsers.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">
                        Nenhum usuário banido
                      </h3>
                      <p className="text-gray-500">
                        Nossa comunidade está limpa! 🎉
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estatísticas Detalhadas */}
        <TabsContent value="statistics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Eficácia da Moderação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Taxa de Aprovação</span>
                    <span className="text-sm font-bold text-green-600">{approvalRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${approvalRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Taxa de Rejeição</span>
                    <span className="text-sm font-bold text-gray-600">
                      {(100 - parseFloat(approvalRate)).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${100 - parseFloat(approvalRate)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Resumo</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• {stats.approved_reports} denúncias resultaram em ação</p>
                    <p>• {stats.rejected_reports} denúncias foram consideradas inválidas</p>
                    <p>• {stats.hidden_posts} posts foram ocultados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Atividade da Moderação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-800">Sistema Automático</p>
                      <p className="text-sm text-blue-600">Posts com 4+ denúncias são ocultados automaticamente</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-800">Ativo</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">Moderação Humana</p>
                      <p className="text-sm text-green-600">Admins analisam denúncias individualmente</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-800">24/7</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Última atualização: {formatDistanceToNow(new Date(stats.last_updated), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sobre a Moderação */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                Como Funciona Nossa Moderação
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Sistema de Denúncias
                  </h3>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-2">
                      Qualquer usuário pode denunciar conteúdo inadequado. As denúncias são categorizadas em:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                      <li>Spam ou conteúdo irrelevante</li>
                      <li>Assédio ou bullying</li>
                      <li>Discurso de ódio</li>
                      <li>Violência ou conteúdo perigoso</li>
                      <li>Nudez ou conteúdo sexual</li>
                      <li>Informação falsa</li>
                      <li>Violação de direitos autorais</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Processo de Moderação
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <ol className="list-decimal list-inside text-gray-700 space-y-2">
                      <li><strong>Denúncia Automática:</strong> Posts com 4+ denúncias são automaticamente ocultados</li>
                      <li><strong>Análise Manual:</strong> Admins revisam cada denúncia individualmente</li>
                      <li><strong>Decisão:</strong> Denúncias são aprovadas ou rejeitadas com base nas diretrizes</li>
                      <li><strong>Ação:</strong> Posts podem ser ocultados e usuários podem ser banidos</li>
                      <li><strong>Transparência:</strong> Todas as ações são registradas nesta página</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-red-500" />
                    Política de Banimento
                  </h3>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-2">
                      Usuários podem ser banidos pelos seguintes motivos:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                      <li>Violações graves das regras da comunidade</li>
                      <li>Comportamento repetitivo inadequado</li>
                      <li>Spam ou conteúdo malicioso</li>
                      <li>Tentativas de contornar moderação</li>
                    </ul>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Nota:</strong> Emails banidos são bloqueados de criar novas contas.
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">Compromisso com a Transparência</h4>
                  <p className="text-sm text-purple-700">
                    Acreditamos que uma comunidade saudável requer transparência total. Por isso, 
                    mantemos esta página atualizada com todas as ações de moderação, permitindo 
                    que nossa comunidade acompanhe e entenda como mantemos o ambiente seguro para todos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
