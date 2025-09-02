export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-8">
      <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-purple-800 mb-8 text-center">
          Política de Privacidade - Orkut BR
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold text-purple-700 mt-8 mb-4">1. Informações que Coletamos</h2>
          <p className="text-gray-700 mb-4">
            Este é um projeto fan-made educacional. Coletamos apenas as informações necessárias para o funcionamento da plataforma:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>Informações de perfil do Google (nome, email, foto) quando você faz login</li>
            <li>Dados de perfil que você escolhe compartilhar</li>
            <li>Conteúdo que você posta (scraps, depoimentos, posts)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-purple-700 mt-8 mb-4">2. Como Usamos suas Informações</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>Para personalizar sua experiência na plataforma</li>
            <li>Para permitir interações sociais (amizades, scraps, etc.)</li>
            <li>Para melhorar nossos serviços</li>
          </ul>

          <h2 className="text-2xl font-semibold text-purple-700 mt-8 mb-4">3. Compartilhamento de Dados</h2>
          <p className="text-gray-700 mb-6">
            Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins comerciais. 
            Este é um projeto educacional sem fins lucrativos.
          </p>

          <h2 className="text-2xl font-semibold text-purple-700 mt-8 mb-4">4. Segurança</h2>
          <p className="text-gray-700 mb-6">
            Utilizamos medidas de segurança padrão da indústria, incluindo criptografia e autenticação segura via Supabase.
          </p>

          <h2 className="text-2xl font-semibold text-purple-700 mt-8 mb-4">5. Contato</h2>
          <p className="text-gray-700 mb-6">
            Para dúvidas sobre esta política, entre em contato: radiotatuapefm@gmail.com
          </p>

          <div className="bg-purple-100 p-6 rounded-lg mt-8">
            <h3 className="text-xl font-semibold text-purple-800 mb-2">⚠️ Importante</h3>
            <p className="text-purple-700">
              Este é um projeto <strong>FAN MADE</strong> educacional, não oficial. 
              Não temos afiliação com o Orkut original ou Google.
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
