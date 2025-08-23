'use client';

import { OrkutCard } from '@/components/ui/orkut-card';
import { Heart, Music, Users } from 'lucide-react';

export default function HomenagemdPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header de luto */}
        <div className="text-center mb-8">
          <div className="bg-black/80 rounded-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              🕊️ Em Memória de Helen Cristina Vitai 🕊️
            </h1>
            <p className="text-gray-300 text-lg">
              03/08/2025 - Uma vida ceifada pela violência desnecessária
            </p>
          </div>
        </div>

        {/* Homenagem Principal */}
        <OrkutCard className="mb-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Helen Cristina Vitai - "Vitai Helen"
              </h2>
              <p className="text-gray-600 mb-4">
                Uma alma que partiu cedo demais, vítima da violência que não deveria existir
              </p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Heart className="w-5 h-5 text-red-500 mt-0.5" />
                </div>
                <div className="ml-3 text-left">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Comunicado Oficial da Família
                  </h3>
                  <p className="text-red-700 mb-4">
                    A família comunica, com profundo pesar, o falecimento de 
                    <strong> Helen Cristina Vitai</strong>, ocorrido em 03/08/2025.
                  </p>
                  <p className="text-red-700 mb-4">
                    A pedido dos familiares, solicitamos que não compareçam ao velório de visual.
                  </p>
                  
                  <div className="mt-4">
                    <h4 className="font-semibold text-red-800 mb-2">Para mais informações:</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <a href="https://www.facebook.com/share/v/1GaovxBUeB/" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline">
                          📰 Informações sobre o ocorrido
                        </a>
                      </p>
                      <p>
                        <a href="https://www.facebook.com/share/p/1AoUej34K3/" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline">
                          📋 Detalhes adicionais
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </OrkutCard>

        {/* Mensagem Contra Violência */}
        <OrkutCard className="mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                Rock é Amor, Não Violência
              </h2>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 text-left">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Users className="w-5 h-5 text-yellow-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Nossa Posição Contra a Violência
                  </h3>
                  <div className="text-yellow-700 space-y-3">
                    <p>
                      <strong>Estamos eternamente tristes com o ocorrido.</strong> 
                      A morte de Helen representa tudo aquilo que rejeitamos e combatemos.
                    </p>
                    <p>
                      O <strong>rock, a música e nossa comunidade</strong> sempre foram sobre:
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>União e fraternidade</li>
                      <li>Expressão artística e liberdade</li>
                      <li>Respeito às diferenças</li>
                      <li>Paz e harmonia entre as pessoas</li>
                    </ul>
                    <p className="font-semibold">
                      A violência que tirou a vida de Helen é <em>INACEITÁVEL</em> 
                      e não representa os valores que defendemos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </OrkutCard>

        {/* Crítica aos Responsáveis */}
        <OrkutCard className="mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ⚠️ Sobre os Responsáveis
            </h2>
            
            <div className="bg-red-100 border border-red-300 p-6 text-left">
              <div className="text-red-800 space-y-3">
                <p className="font-semibold">
                  Não podemos aceitar que pessoas andem com a morte ao lado.
                </p>
                <p>
                  Aqueles que causaram esta tragédia são verdadeiros 
                  <strong> "amigos da onça"</strong> - pessoas que destroem tudo ao seu redor.
                </p>
                <p>
                  <a href="https://www.facebook.com/photo/?fbid=1791196635157175&set=a.122230572053798" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline font-semibold">
                    👆 Vejam aqui os responsáveis por esta tragédia
                  </a>
                </p>
                <p className="text-sm italic">
                  A justiça deve ser feita. Não esqueceremos Helen, 
                  e não deixaremos que sua morte seja em vão.
                </p>
              </div>
            </div>
          </div>
        </OrkutCard>

        {/* Memórias de Helen */}
        <OrkutCard className="mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              💜 Lembrando Helen Vitai
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 mb-2">Helen como a conhecíamos:</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Uma pessoa que amava a música</li>
                  <li>• Frequentadora da cena rock</li>
                  <li>• Alguém que não merecia esse fim</li>
                  <li>• Uma vida interrompida pela violência</li>
                </ul>
              </div>
              
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 mb-2">Como podemos honrá-la:</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Rejeitando toda forma de violência</li>
                  <li>• Promovendo paz nos eventos</li>
                  <li>• Cuidando uns dos outros</li>
                  <li>• Mantendo viva sua memória</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                <a href="https://www.facebook.com/photo/?fbid=1029824547961058&set=a.122095432067312" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline">
                  📸 Ver foto de Helen Vitai
                </a>
              </p>
            </div>
          </div>
        </OrkutCard>

        {/* Mensagem Final */}
        <OrkutCard>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🕊️ Descanse em Paz, Helen
            </h2>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                Que sua partida prematura sirva como um lembrete para todos nós:
              </p>
              <p className="text-lg font-semibold text-purple-800 mb-4">
                "A vida é preciosa demais para ser perdida por causa da violência."
              </p>
              <p className="text-gray-600 text-sm">
                Helen, você não será esquecida. Sua memória viverá como um símbolo 
                da luta contra a violência e pela paz em nossa comunidade.
              </p>
            </div>
            
            <div className="mt-6">
              <p className="text-gray-500 text-sm">
                Esta homenagem faz parte do projeto Orkut.br, criado por pessoas que acreditam 
                na união, no respeito e na paz entre todos os seres humanos.
              </p>
            </div>
          </div>
        </OrkutCard>

      </div>
    </div>
  );
}
