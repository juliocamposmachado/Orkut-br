'use client'

import { useState } from 'react'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  AlertCircle, 
  Database, 
  Copy, 
  CheckCircle,
  ExternalLink,
  Code,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface BlogSetupNoticeProps {
  onClose?: () => void
  showCloseButton?: boolean
}

export function BlogSetupNotice({ onClose, showCloseButton = false }: BlogSetupNoticeProps) {
  const [copied, setCopied] = useState(false)

  const sqlScript = `-- Tabela para posts do blog
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url TEXT,
    category VARCHAR(50) DEFAULT 'geral',
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    is_featured BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS blog_posts_author_id_idx ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts(status);
CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts(slug);

-- RLS (Row Level Security)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY IF NOT EXISTS "Public can view published posts" ON blog_posts
    FOR SELECT USING (status = 'published');

CREATE POLICY IF NOT EXISTS "Users can manage own posts" ON blog_posts
    FOR ALL USING (author_id = auth.uid());`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    setCopied(true)
    toast.success('Script SQL copiado para a área de transferência!')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Aviso Principal */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="space-y-2">
            <p className="font-semibold">Blog em Modo Demo</p>
            <p>
              O blog está funcionando com posts de demonstração. Para funcionalidade completa, 
              você precisa configurar a tabela <code className="bg-orange-100 px-1 rounded">blog_posts</code> no Supabase.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Card de Configuração */}
      <OrkutCard>
        <OrkutCardHeader className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Configuração do Blog</h3>
          </div>
          {showCloseButton && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </OrkutCardHeader>
        <OrkutCardContent className="space-y-4">
          {/* Status Atual */}
          <div className="space-y-2">
            <h4 className="font-medium">Status Atual:</h4>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Modo Demo
              </Badge>
              <span className="text-sm text-gray-600">
                Usando posts de demonstração
              </span>
            </div>
          </div>

          {/* O que funciona */}
          <div className="space-y-2">
            <h4 className="font-medium">O que funciona agora:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Visualização de posts de demonstração</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Sistema de busca e filtros</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Interface completa do blog</span>
              </li>
            </ul>
          </div>

          {/* O que precisa ser configurado */}
          <div className="space-y-2">
            <h4 className="font-medium">Para funcionalidade completa:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span>Criação de novos posts</span>
              </li>
              <li className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span>Edição de posts existentes</span>
              </li>
              <li className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span>Sistema de comentários</span>
              </li>
            </ul>
          </div>
        </OrkutCardContent>
      </OrkutCard>

      {/* Instruções de Configuração */}
      <OrkutCard>
        <OrkutCardHeader>
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Como Configurar</h3>
          </div>
        </OrkutCardHeader>
        <OrkutCardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Acesse o Supabase Dashboard</p>
                <p className="text-sm text-gray-600">
                  Vá para o painel do seu projeto no Supabase
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Abra o SQL Editor</p>
                <p className="text-sm text-gray-600">
                  Navegue até a aba "SQL Editor" no painel lateral
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium mb-2">Execute o Script SQL</p>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-mono text-gray-600">create_blog_posts.sql</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                  <pre className="text-xs overflow-x-auto bg-white p-2 rounded border">
                    <code>{sqlScript}</code>
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold">
                4
              </div>
              <div>
                <p className="font-medium">Atualize a Página</p>
                <p className="text-sm text-gray-600">
                  Após executar o script, atualize o blog para ver a funcionalidade completa
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Supabase
              </Button>
              <Button 
                size="sm"
                onClick={() => window.location.reload()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Atualizar Página
              </Button>
            </div>
          </div>
        </OrkutCardContent>
      </OrkutCard>
    </div>
  )
}
