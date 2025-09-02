'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ExternalLink, 
  Code, 
  BookOpen, 
  Music, 
  Building, 
  MapPin, 
  Phone, 
  Mail,
  Github,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Globe,
  Award,
  Users,
  Briefcase
} from 'lucide-react'
import { FaAmazon } from 'react-icons/fa'

// Metadata será aplicada via Head component no client side

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Julio Campos Machado',
  jobTitle: 'Desenvolvedor Full-Stack & Tech Entrepreneur',
  description: 'Desenvolvedor Full-Stack experiente e empreendedor de tecnologia com mais de uma década de experiência em soluções de TI corporativas.',
  url: 'https://orkut-br.vercel.app/sobre-desenvolvedor',
  email: 'juliocamposmachado@gmail.com',
  telephone: ['+55-11-99294-6628', '+55-11-97060-3441'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'São Paulo',
    addressRegion: 'SP',
    addressCountry: 'BR'
  },
  worksFor: {
    '@type': 'Organization',
    name: 'Like Look Solutions',
    url: 'https://likelook.wixsite.com/solutions',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rua Dante Pellacani, 92',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      addressCountry: 'BR'
    }
  },
  knowsAbout: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Supabase', 'Vercel', 'Inteligência Artificial', 'Claude AI', 'Gemini AI'],
  sameAs: [
    'https://www.linkedin.com/in/juliocamposmachado/',
    'https://www.facebook.com/juliocamposmachado/',
    'https://x.com/DevJulioMachado',
    'https://x.com/julioscouter',
    'https://www.youtube.com/@JulioCamposMachado',
    'https://www.amazon.com.br/stores/author/B0FF374WNM'
  ],
  author: [
    {
      '@type': 'Book',
      name: 'Série Juliette Psicose',
      url: 'https://www.amazon.com.br/Juliette-Psicose/dp/B0CLKWDQNJ'
    }
  ],
  creator: [
    {
      '@type': 'SoftwareApplication',
      name: 'Orkut BR 2025',
      applicationCategory: 'Social Networking',
      operatingSystem: 'Web',
      url: 'https://orkut-br.vercel.app'
    }
  ]
}

export default function SobreDesenvolvedorPage() {
  return (
    <>
      {/* JSON-LD para dados estruturados */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
        <div className="container mx-auto px-4 py-8">
        
        {/* Header com foto e info principal */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
                  JCM
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="text-center md:text-left flex-1">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  Julio Campos Machado
                </h1>
                <p className="text-xl text-purple-600 font-semibold mb-3">
                  Desenvolvedor Full-Stack & Tech Entrepreneur
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    <Code className="w-3 h-3 mr-1" />
                    Full-Stack Developer
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <Briefcase className="w-3 h-3 mr-1" />
                    CEO & Founder
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Autor de 100+ Livros
                  </Badge>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 text-sm text-gray-600">
                  <div className="flex items-center justify-center md:justify-start">
                    <Building className="w-4 h-4 mr-2 text-purple-500" />
                    Like Look Solutions
                  </div>
                  <div className="flex items-center justify-center md:justify-start">
                    <MapPin className="w-4 h-4 mr-2 text-purple-500" />
                    São Paulo, Brasil
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Sobre */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Users className="mr-2 text-purple-600" />
                  Sobre Mim
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  <strong>Desenvolvedor Full-Stack experiente</strong> e <strong>empreendedor de tecnologia</strong> 
                  com mais de uma década de experiência em soluções de TI corporativas. Como fundador e CEO da 
                  <strong> Like Look Solutions</strong>, lidero uma equipe especializada em desenvolvimento de 
                  software, consultoria tecnológica e implementação de soluções empresariais.
                </p>
                
                <p>
                  Minha expertise abrange <strong>desenvolvimento web moderno</strong> com tecnologias como 
                  Next.js, React, TypeScript, Node.js, além de arquiteturas de nuvem e integração de APIs. 
                  Especialista em <strong>inteligência artificial aplicada</strong>, trabalho com modelos 
                  como Claude 4 Sonnet e Gemini para criar soluções inovadoras.
                </p>
                
                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                  <h4 className="font-bold text-purple-800 mb-2">🚀 Projeto Destaque: Orkut BR 2025</h4>
                  <p className="text-purple-700">
                    Desenvolvi uma <strong>rede social completa</strong> com recursos avançados como WebRTC, 
                    assistente de IA, comunidades, sistema de amizades e integração Google Auth. 
                    Projeto que combina <strong>nostalgia dos anos 2000 com tecnologia moderna</strong>.
                  </p>
                </div>
                
                <p>
                  Além da tecnologia, sou <strong>autor prolífico</strong> com mais de 100 obras publicadas 
                  na Amazon, incluindo a aclamada série "Juliette Psicose" e diversas traduções de bestsellers 
                  internacionais. Essa diversidade criativa me permite abordar projetos de software com uma 
                  <strong>perspectiva única e inovadora</strong>.
                </p>
              </CardContent>
            </Card>

            {/* Empresa */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Building className="mr-2 text-blue-600" />
                  Like Look Solutions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    <strong>Empresa especializada em soluções de TI</strong> com mais de 30 anos de experiência 
                    no mercado. Oferecemos consultoria tecnológica, desenvolvimento de software, field support, 
                    e alocação de profissionais especializados.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-bold text-blue-800 mb-2">Serviços Principais</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Desenvolvimento de Software</li>
                        <li>• Consultoria em TI</li>
                        <li>• Field Support</li>
                        <li>• Alocação de Profissionais</li>
                        <li>• Projetos de Rollout</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-bold text-green-800 mb-2">Diferenciais</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Equipe jovem e talentosa</li>
                        <li>• Soluções personalizadas</li>
                        <li>• Tecnologia de ponta</li>
                        <li>• Suporte especializado</li>
                        <li>• Foco na inovação</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div>
                      <p className="font-semibold text-gray-800">CNPJ: 36.992.198/0001-84</p>
                      <p className="text-sm text-gray-600">Rua Dante Pellacani, 92 - São Paulo/SP</p>
                    </div>
                    <Button variant="outline" asChild>
                      <a href="https://likelook.wixsite.com/solutions" target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-2" />
                        Ver Site
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Contato */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="mailto:juliocamposmachado@gmail.com">
                    <Mail className="w-4 h-4 mr-2" />
                    juliocamposmachado@gmail.com
                  </a>
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://wa.me/5511992946628" target="_blank" rel="noopener noreferrer">
                    <Phone className="w-4 h-4 mr-2" />
                    (11) 99294-6628
                  </a>
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://wa.me/5511970603441" target="_blank" rel="noopener noreferrer">
                    <Phone className="w-4 h-4 mr-2" />
                    (11) 97060-3441
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Redes Sociais */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Redes Sociais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://www.linkedin.com/in/juliocamposmachado/" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="w-4 h-4 mr-2 text-blue-600" />
                    LinkedIn Profissional
                  </a>
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://www.facebook.com/juliocamposmachado/" target="_blank" rel="noopener noreferrer">
                    <Facebook className="w-4 h-4 mr-2 text-blue-800" />
                    Facebook
                  </a>
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://x.com/DevJulioMachado" target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-4 h-4 mr-2 text-blue-500" />
                    @DevJulioMachado
                  </a>
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://x.com/julioscouter" target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-4 h-4 mr-2 text-blue-500" />
                    @julioscouter
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Trabalhos Publicados */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-600" />
                  Trabalhos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://www.amazon.com.br/stores/author/B0FF374WNM" target="_blank" rel="noopener noreferrer">
                    <FaAmazon className="w-4 h-4 mr-2 text-orange-600" />
                    100+ Livros na Amazon
                  </a>
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://www.amazon.com.br/Juliette-Psicose/dp/B0CLKWDQNJ" target="_blank" rel="noopener noreferrer">
                    <BookOpen className="w-4 h-4 mr-2 text-purple-600" />
                    Série Juliette Psicose
                  </a>
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://www.youtube.com/@JulioCamposMachado" target="_blank" rel="noopener noreferrer">
                    <Youtube className="w-4 h-4 mr-2 text-red-600" />
                    200+ Músicas no YouTube
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Voltar */}
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-xl">
              <CardContent className="p-4">
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 border-white/30" 
                  asChild
                >
                  <a href="/login">
                    ← Voltar ao Orkut BR
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
