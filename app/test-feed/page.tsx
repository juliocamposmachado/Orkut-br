'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestFeedPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/posts-db', {
        method: 'GET',
        cache: 'no-store'
      })
      const data = await response.json()
      
      if (data.success) {
        setPosts(data.posts)
        console.log('Posts carregados:', data.posts.length)
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error)
    }
  }

  const createTestPost = async () => {
    if (!content.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/posts-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          author: 'test-user',
          author_name: 'Usuário Teste',
          author_photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
          visibility: 'public',
          is_dj_post: false
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setContent('')
        loadPosts() // Recarregar posts
        alert('Post criado com sucesso!')
      } else {
        alert('Erro: ' + result.error)
      }
    } catch (error: any) {
      alert('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🧪 Teste do Feed Global</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={loadPosts} variant="outline">
              🔄 Carregar Posts ({posts.length})
            </Button>
            <Button onClick={() => setPosts([])} variant="outline">
              🗑️ Limpar Lista
            </Button>
          </div>
          
          <div className="space-y-2">
            <Textarea 
              placeholder="Digite seu post de teste..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              onClick={createTestPost} 
              disabled={!content.trim() || loading}
              className="w-full"
            >
              {loading ? '⏳ Criando...' : '📝 Criar Post de Teste'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Posts no Feed Global:</h3>
        {posts.length === 0 ? (
          <p className="text-gray-500">Nenhum post encontrado. Clique em "Carregar Posts" para buscar.</p>
        ) : (
          posts.map((post, index) => (
            <Card key={post.id || index} className="border-l-4 border-l-purple-500">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <img 
                    src={post.author_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50'} 
                    alt={post.author_name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-sm">{post.author_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {post.is_dj_post && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      🎵 DJ Orky
                    </span>
                  )}
                </div>
                <p className="text-gray-800">{post.content}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span>❤️ {post.likes_count}</span>
                  <span>💬 {post.comments_count}</span>
                  <span>👁️ {post.visibility}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
