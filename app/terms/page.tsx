export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-8">
      <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-purple-800 mb-8 text-center">
          Termos de Serviço - Orkut BR
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold text-purple-700 mt-8 mb-4">1. Aceitação dos Termos</h2>
          <p className="text-gray-700 mb-6">
            Ao usar o Orkut BR, você concorda com estes termos. Este é um projeto educacional 
            fan-made, não comercial, criado por nostalgia e amor à plataforma original.
          </p>

          <h2 className="text-2xl font-semibold text-purple-700 mt-8 mb-4">2. Natureza do Serviço</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li><strong>Projeto Educacional</strong>: Este é um projeto de estudo e nostalgia</li>
            <li><strong>Não Comercial</strong>: Não cobramos pelos serviços nem vendemos dados</li>
            <li><strong>Fan Made</strong>: Não temos afiliação com o Orkut original ou Google</li>
            <li><strong>Código Aberto</strong>: O projeto é open source no GitHub</li>
          </ul>

          <h2 className="text-2xl font-semibold text-purple-700 mt-8 mb-4">3. Uso Responsável</h2>
          <p className="text-gray-700 mb-4">Você concorda em:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>Não usar a plataforma para atividades ilegais</li>
            <li>Respeitar outros usuários</li>
            <li>Não spam ou conteúdo malicioso</li>
            <li>Não tentar quebrar ou explorar vulnerabilidades</li>
          </ul>

          <h2 className="text-2xl font-semibold text-purple-700 mt-8 mb-4">4. Conteúdo dos Usuários</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>Você mantém os direitos sobre seu conteúdo</li>
            <li>É responsável pelo que posta</li>
            <li>Podemos remover conteúdo inadequado</li>
            <li>Backup dos dados não é garantido (projeto experimental)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-purple-700 mt-8 mb-4">5. Limitações e Responsabilidades</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>O serviço é fornecido "como está"</li>
            <li>Não garantimos uptime 100%</li>
            <li>Não somos responsáveis por perda de dados</li>
            <li>Este é um projeto pessoal, não um serviço comercial</li>
          </ul>

          <h2 className="text-2xl font-semibold text-purple-700 mt-8 mb-4">6. Modificações</h2>
          <p className="text-gray-700 mb-6">
            Podemos modificar estes termos a qualquer momento. Mudanças significativas 
            serão comunicadas na plataforma.
          </p>

          <h2 className="text-2xl font-semibold text-purple-700 mt-8 mb-4">7. Contato</h2>
          <p className="text-gray-700 mb-6">
            Dúvidas ou sugestões: radiotatuapefm@gmail.com
          </p>

          <div className="bg-yellow-100 p-6 rounded-lg mt-8">
            <h3 className="text-xl font-semibold text-yellow-800 mb-2">💛 Nostalgia e Diversão</h3>
            <p className="text-yellow-700">
              Este projeto foi criado com carinho para reviver a nostalgia do Orkut original. 
              <strong>Divirta-se de forma responsável!</strong> 😊
            </p>
          </div>

          <div className="bg-purple-100 p-6 rounded-lg mt-6">
            <h3 className="text-xl font-semibold text-purple-800 mb-2">🙏 Homenagem</h3>
            <p className="text-purple-700">
              <strong>Orkut Büyükkökten</strong> - Criador do Orkut original (2004-2014)<br/>
              "Obrigado por nos dar os melhores anos da internet brasileira!" 🇧🇷❤️
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <a href="/" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
            ← Voltar ao Orkut
          </a>
        </div>
      </div>
    </div>
  )
}
