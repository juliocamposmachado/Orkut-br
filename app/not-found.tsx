'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        
        {/* Orkut Logo */}
        <div className="bg-white rounded-full p-4 inline-block mb-6">
          <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Orkut
          </span>
        </div>

        {/* 404 Error */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 mb-6">
          <div className="text-6xl font-bold text-purple-600 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Página não encontrada
          </h1>
          <p className="text-gray-600 mb-6">
            Ops! A página que você está procurando não existe ou foi movida.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao início
              </Button>
            </Link>
            
            <Link href="/buscar" className="block">
              <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                <Search className="h-4 w-4 mr-2" />
                Buscar no Orkut
              </Button>
            </Link>

            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="w-full text-purple-600 hover:bg-purple-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à página anterior
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-white text-sm">
          <p className="mb-2">
            💡 <strong>Dica:</strong> Verifique se o endereço está correto
          </p>
          <p>
            Se você acha que isso é um erro, 
            <a href="/help" className="underline hover:text-purple-200 ml-1">
              entre em contato conosco
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
