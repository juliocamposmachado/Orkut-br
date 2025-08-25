'use client';

import { OrkutCard } from '@/components/ui/orkut-card';
import { Heart, Music, Users, Star, Flower2 } from 'lucide-react';
import Image from 'next/image';

export default function HomenagemdPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-800 py-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-4 h-4 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-20 w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>
      
      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        
        {/* Header memorial elegante */}
        <div className="text-center mb-12">
          <div className="bg-black/90 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <Flower2 className="w-8 h-8 text-white mr-3 animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-pink-200 to-purple-200 bg-clip-text text-transparent">
                Em Memória de Helen Cristina Vitai
              </h1>
              <Flower2 className="w-8 h-8 text-white ml-3 animate-pulse" />
            </div>
            <div className="flex items-center justify-center text-gray-300 text-xl">
              <Star className="w-5 h-5 mr-2" />
              <span>03/08/2025 - Uma estrela que brilhará para sempre</span>
              <Star className="w-5 h-5 ml-2" />
            </div>
          </div>
        </div>

        {/* Seção com foto da Helen */}
        <OrkutCard className="mb-8 memorial-card">
          <div className="text-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-8">
            <div className="mb-8">
              {/* Frame decorativo para a foto */}
              <div className="relative mx-auto w-64 h-64 mb-6">
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 rounded-full animate-pulse opacity-75"></div>
                <div className="absolute -inset-2 bg-white rounded-full shadow-2xl"></div>
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  <Image
                    src="/helen vitai"
                    alt="Helen Cristina Vitai - Em memória"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 200px, 256px"
                    priority
                  />
                </div>
                {/* Decorative corners */}
                <div className="absolute -top-2 -left-2 w-8 h-8">
                  <Flower2 className="w-full h-full text-pink-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8">
                  <Flower2 className="w-full h-full text-purple-400" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8">
                  <Flower2 className="w-full h-full text-indigo-400" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8">
                  <Flower2 className="w-full h-full text-pink-400" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-800 to-pink-800 bg-clip-text text-transparent">
                  Helen Cristina Vitai
                </h2>
                <p className="text-xl text-gray-700 font-medium">
                  "Vitai Helen" - Uma alma linda que nos deixou cedo demais
                </p>
                <div className="flex items-center justify-center space-x-4 text-gray-600">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span>Amante da música e do rock</span>
                  <Music className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Mensagem memorial */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-purple-800 mb-4 flex items-center justify-center">
                  <Heart className="w-6 h-6 mr-2 text-pink-500" />
                  Comunicado da Família
                  <Heart className="w-6 h-6 ml-2 text-pink-500" />
                </h3>
                <div className="text-gray-700 space-y-4">
                  <p className="text-lg">
                    A família comunica, com profundo pesar, o falecimento de nossa querida 
                    <strong className="text-purple-800"> Helen Cristina Vitai</strong>, ocorrido em 03/08/2025.
                  </p>
                  <p className="text-gray-600">
                    A pedido dos familiares, solicitamos que não compareçam ao velório.
                  </p>
                  
                  <div className="bg-purple-50 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-purple-800 mb-3">Para mais informações:</h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <a href="https://www.facebook.com/share/v/1GaovxBUeB/" 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors p-2 rounded-lg hover:bg-blue-50">
                        📰 Informações sobre o ocorrido
                      </a>
                      <a href="https://www.facebook.com/share/p/1AoUej34K3/" 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors p-2 rounded-lg hover:bg-blue-50">
                        📋 Detalhes adicionais
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </OrkutCard>

        {/* Mensagem Contra Violência */}
        <OrkutCard className="mb-8 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Music className="w-10 h-10 text-yellow-600 mr-4 animate-bounce" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Rock é Amor, Não Violência
                </h2>
                <Music className="w-10 h-10 text-yellow-600 ml-4 animate-bounce" style={{animationDelay: '0.5s'}} />
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-yellow-300 shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-yellow-800 mb-4">
                    Nossa Posição Contra a Violência
                  </h3>
                  <div className="text-gray-700 space-y-4 text-lg">
                    <p>
                      <strong className="text-yellow-800">Estamos eternamente tristes com o ocorrido.</strong> 
                      A morte de Helen representa tudo aquilo que rejeitamos e combatemos.
                    </p>
                    <p>
                      O <strong className="text-yellow-800">rock, a música e nossa comunidade</strong> sempre foram sobre:
                    </p>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <ul className="grid md:grid-cols-2 gap-2 text-gray-700">
                        <li className="flex items-center space-x-2">
                          <Heart className="w-4 h-4 text-pink-500" />
                          <span>União e fraternidade</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Music className="w-4 h-4 text-purple-500" />
                          <span>Expressão artística e liberdade</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span>Respeito às diferenças</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Flower2 className="w-4 h-4 text-green-500" />
                          <span>Paz e harmonia entre as pessoas</span>
                        </li>
                      </ul>
                    </div>
                    <p className="font-semibold text-xl text-yellow-800 text-center p-4 bg-yellow-100 rounded-lg">
                      A violência que tirou a vida de Helen é <em className="text-red-600">INACEITÁVEL</em> 
                      e não representa os valores que defendemos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </OrkutCard>

        {/* Crítica aos Responsáveis */}
        <OrkutCard className="mb-8 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
                ⚠️ Sobre os Responsáveis
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-pink-500 mx-auto rounded-full"></div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-red-300 shadow-lg">
              <div className="text-red-800 space-y-4 text-lg">
                <p className="font-semibold text-xl text-center">
                  Não podemos aceitar que pessoas andem com a morte ao lado.
                </p>
                <p className="text-center">
                  Aqueles que causaram esta tragédia são verdadeiros 
                  <strong className="text-red-600"> "amigos da onça"</strong> - pessoas que destroem tudo ao seu redor.
                </p>
                <div className="text-center bg-red-50 p-4 rounded-lg">
                  <a href="https://www.facebook.com/photo/?fbid=1791196635157175&set=a.122230572053798" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    <span>👆 Vejam aqui os responsáveis por esta tragédia</span>
                  </a>
                </div>
                <p className="text-center italic bg-gray-100 p-4 rounded-lg">
                  A justiça deve ser feita. Não esqueceremos Helen, 
                  e não deixaremos que sua morte seja em vão.
                </p>
              </div>
            </div>
          </div>
        </OrkutCard>

        {/* Memórias de Helen */}
        <OrkutCard className="mb-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                💜 Lembrando Helen Vitai
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-purple-800 mb-4 flex items-center">
                    <Heart className="w-6 h-6 mr-2" />
                    Helen como a conhecíamos
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Music className="w-5 h-5 text-purple-500" />
                      <span>Uma pessoa que amava a música</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Star className="w-5 h-5 text-purple-500" />
                      <span>Frequentadora da cena rock</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Heart className="w-5 h-5 text-pink-500" />
                      <span>Alguém que não merecia esse fim</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Flower2 className="w-5 h-5 text-pink-500" />
                      <span>Uma vida interrompida pela violência</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-pink-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-pink-800 mb-4 flex items-center">
                    <Flower2 className="w-6 h-6 mr-2" />
                    Como podemos honrá-la
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span>Rejeitando toda forma de violência</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Flower2 className="w-5 h-5 text-green-500" />
                      <span>Promovendo paz nos eventos</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span>Cuidando uns dos outros</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Star className="w-5 h-5 text-purple-500" />
                      <span>Mantendo viva sua memória</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </OrkutCard>

        {/* Mensagem Final */}
        <OrkutCard className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-indigo-500 mr-3 animate-pulse" />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                  Descanse em Paz, Helen
                </h2>
                <Star className="w-8 h-8 text-indigo-500 ml-3 animate-pulse" style={{animationDelay: '0.5s'}} />
              </div>
              <div className="w-32 h-1 bg-gradient-to-r from-indigo-500 to-pink-500 mx-auto rounded-full"></div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-indigo-200 shadow-lg">
              <div className="text-center space-y-6">
                <p className="text-xl text-gray-700">
                  Que sua partida prematura sirva como um lembrete para todos nós:
                </p>
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6">
                  <p className="text-2xl font-bold text-purple-800 italic">
                    "A vida é preciosa demais para ser perdida por causa da violência."
                  </p>
                </div>
                <p className="text-lg text-gray-600">
                  Helen, você não será esquecida. Sua memória viverá como um símbolo 
                  da luta contra a violência e pela paz em nossa comunidade.
                </p>
                
                {/* Decorative elements */}
                <div className="flex justify-center space-x-4 mt-8">
                  <Flower2 className="w-8 h-8 text-pink-400 animate-pulse" />
                  <Heart className="w-8 h-8 text-red-400 animate-pulse" style={{animationDelay: '0.3s'}} />
                  <Music className="w-8 h-8 text-purple-400 animate-pulse" style={{animationDelay: '0.6s'}} />
                  <Star className="w-8 h-8 text-indigo-400 animate-pulse" style={{animationDelay: '0.9s'}} />
                  <Flower2 className="w-8 h-8 text-pink-400 animate-pulse" style={{animationDelay: '1.2s'}} />
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-500 text-sm">
                  Esta homenagem faz parte do projeto Orkut.br, criado por pessoas que acreditam 
                  na união, no respeito e na paz entre todos os seres humanos.
                </p>
              </div>
            </div>
          </div>
        </OrkutCard>

      </div>
    </div>
  );
}
