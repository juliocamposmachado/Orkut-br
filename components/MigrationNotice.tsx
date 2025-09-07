'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Database, 
  ExternalLink,
  Copy,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface MigrationNoticeProps {
  error?: {
    migration_needed?: boolean
    details?: string
  }
  onClose?: () => void
}

export function MigrationNotice({ error, onClose }: MigrationNoticeProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (!error?.migration_needed) {
    return null
  }

  const migrationSQL = `-- Execute este SQL no painel do Supabase
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  featured_image TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags TEXT[] DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Continua... (veja arquivo completo na migration)`

  const copySQL = async () => {
    try {
      await navigator.clipboard.writeText(migrationSQL)
      toast.success('SQL copiado para área de transferência!')
    } catch (error) {
      toast.error('Erro ao copiar SQL')
    }
  }

  const openSupabase = () => {
    window.open('https://app.supabase.com', '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Database className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Migration Necessária
                </h3>
                <Badge variant="destructive" className="mt-1">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Blog não configurado
                </Badge>
              </div>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Alert */}
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              A tabela <code className="bg-yellow-200 px-1 rounded text-xs">blog_posts</code> não 
              existe no banco de dados Supabase. O sistema de blog não funcionará até que a 
              migration seja executada.
            </AlertDescription>
          </Alert>

          {/* Instructions */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Como resolver:</h4>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <span className="text-sm text-gray-700">
                  Abra o painel do Supabase
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openSupabase}
                  className="ml-auto"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Abrir Supabase
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <span className="text-sm text-gray-700">
                  Vá para "SQL Editor" → "New Query"
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <span className="text-sm text-gray-700">
                  Cole e execute o SQL da migration
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                  className="ml-auto"
                >
                  {showDetails ? 'Ocultar' : 'Ver'} SQL
                </Button>
              </div>
            </div>

            {/* SQL Details */}
            {showDetails && (
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copySQL}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre-wrap">
                  {migrationSQL}
                </pre>
                <div className="mt-2 text-yellow-400 text-xs">
                  💡 SQL completo disponível em: <code>supabase/migrations/20241207000000_create_blog_posts_table.sql</code>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">📋 Localização do arquivo:</h5>
              <code className="text-sm text-blue-800 bg-blue-100 px-2 py-1 rounded">
                supabase/migrations/20241207000000_create_blog_posts_table.sql
              </code>
              <p className="text-sm text-blue-700 mt-2">
                Copie todo o conteúdo deste arquivo e execute no SQL Editor do Supabase.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button onClick={openSupabase} className="bg-green-600 hover:bg-green-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ir para Supabase
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
