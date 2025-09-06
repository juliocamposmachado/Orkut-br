'use client'

import { Heart, Code, Phone, Mail, Globe } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-purple-900 to-pink-900 text-white py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Developer Info */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 justify-center md:justify-start">
              <Code className="h-5 w-5" />
              Desenvolvedor
            </h3>
            <p className="text-lg font-medium mb-2">Julio Campos Machado</p>
            <p className="text-purple-200 mb-4">Full Stack Developer</p>
            
            <div className="space-y-2">
              <a 
                href="tel:+5511992946628" 
                className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors justify-center md:justify-start"
              >
                <Phone className="h-4 w-4" />
                +55 (11) 99294-6628
              </a>
              
              <a 
                href="mailto:juliocamposmachado@gmail.com" 
                className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors justify-center md:justify-start"
              >
                <Mail className="h-4 w-4" />
                juliocamposmachado@gmail.com
              </a>
            </div>
          </div>

          {/* Company Info */}
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 justify-center">
              <Globe className="h-5 w-5" />
              Empresa
            </h3>
            <p className="text-lg font-medium mb-2">Like Look Solutions</p>
            <p className="text-purple-200 mb-4">Soluções em TI</p>
            
            <div className="space-y-2">
              <p className="text-purple-200 text-sm">
                CNPJ: 36.992.198/0001-84
              </p>
              <p className="text-purple-200 text-sm">
                Rua Dante Pellacani, 92
              </p>
              <p className="text-purple-200 text-sm">
                São Paulo, SP
              </p>
              
              <a 
                href="https://likelook.wixsite.com/solutions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded-lg transition-colors mt-3"
              >
                Visite nosso site
              </a>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="text-center md:text-right">
            <h3 className="text-xl font-bold mb-4">Entre em Contato</h3>
            <p className="text-purple-200 mb-4">
              Precisa de soluções em TI? Desenvolvimento de sistemas? 
              Fale conosco!
            </p>
            
            <a 
              href="https://wa.me/5511992946628?text=Olá! Vim através do Orkut Retrô e gostaria de saber mais sobre os serviços da Like Look Solutions."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.333"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>


        {/* Bottom Bar */}
        <div className="border-t border-purple-700 mt-6 pt-6 text-center">
          <p className="text-purple-200 mb-2">
            Feito com <Heart className="h-4 w-4 inline text-pink-400" /> por 
            <span className="font-medium text-white"> Julio Campos Machado</span>
          </p>
          <p className="text-sm text-purple-300">
            © 2025 Like Look Solutions • Orkut Retrô • Todos os direitos reservados
          </p>
          
          {/* Links legais */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 mb-4 py-3 border-t border-purple-600">
            <a 
              href="/privacy" 
              className="text-sm text-purple-200 hover:text-white transition-colors underline hover:no-underline bg-purple-800/30 px-3 py-1 rounded-lg hover:bg-purple-700/50"
            >
              Política de Privacidade
            </a>
            <span className="text-sm text-purple-400">•</span>
            <a 
              href="/terms" 
              className="text-sm text-purple-200 hover:text-white transition-colors underline hover:no-underline bg-purple-800/30 px-3 py-1 rounded-lg hover:bg-purple-700/50"
            >
              Termos de Uso
            </a>
          </div>
          
          <p className="text-xs text-purple-400">
            Este é um projeto de demonstração nostálgico. Não possui relação oficial com o Orkut original.
          </p>
        </div>
      </div>
    </footer>
  )
}
