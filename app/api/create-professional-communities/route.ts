import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Lista de comunidades profissionais a serem criadas
    const professionalCommunities = [
      {
        name: 'Bugs do Orkut',
        description: '🐛 Reporte e discuta bugs encontrados no Orkut BR. Ajude-nos a melhorar a plataforma reportando problemas, sugerindo correções e acompanhando o desenvolvimento. Comunidade oficial para feedback técnico.',
        category: 'Tecnologia',
        photo_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
        members_count: 156
      },
      {
        name: 'Orkut Novo',
        description: '🚀 Comunidade oficial do Orkut BR! Novidades, atualizações, recursos em desenvolvimento e discussões sobre o futuro da plataforma. Seja parte da evolução da nossa rede social!',
        category: 'Tecnologia',
        photo_url: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg',
        members_count: 342
      },
      {
        name: 'Desenvolvedores',
        description: '👨‍💻 Comunidade para desenvolvedores de software. Compartilhe conhecimentos, discuta tecnologias, troque experiências sobre programação, frameworks e melhores práticas de desenvolvimento.',
        category: 'Tecnologia',
        photo_url: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg',
        members_count: 289
      },
      {
        name: 'Networking Profissional',
        description: '🤝 Expanda sua rede de contatos profissionais! Conecte-se com profissionais da sua área, compartilhe oportunidades de trabalho, troque experiências de carreira e desenvolva relacionamentos profissionais.',
        category: 'Trabalho',
        photo_url: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg',
        members_count: 234
      },
      {
        name: 'Cursos Online',
        description: '📚 Compartilhe e descubra cursos online gratuitos e pagos. Discuta plataformas de ensino, recomende cursos, tire dúvidas e ajude outros a encontrar o melhor conteúdo educacional.',
        category: 'Educação',
        photo_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
        members_count: 187
      },
      {
        name: 'Empreendedorismo',
        description: '💼 Para empreendedores e aspirantes a empresários. Compartilhe ideias de negócios, discuta estratégias, encontre parceiros, aprenda sobre gestão empresarial e marketing digital.',
        category: 'Negócios',
        photo_url: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg',
        members_count: 198
      },
      {
        name: 'Vagas de Emprego',
        description: '💼 Central de oportunidades profissionais! Divulgue vagas, procure emprego, compartilhe seu perfil profissional e conecte-se com recrutadores. Sua carreira começa aqui!',
        category: 'Carreira',
        photo_url: 'https://images.pexels.com/photos/3184639/pexels-photo-3184639.jpeg',
        members_count: 421
      },
      {
        name: 'Startups Brasil',
        description: '🚀 Ecossistema de startups brasileiras. Discuta inovação, encontre cofundadores, compartilhe experiências sobre investimentos, pitch de negócios e crescimento de empresas.',
        category: 'Negócios',
        photo_url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
        members_count: 156
      },
      {
        name: 'Freelancers Brasil',
        description: '💻 Comunidade para profissionais autônomos e freelancers. Troque experiências sobre trabalho remoto, precificação, captação de clientes e gestão de projetos.',
        category: 'Trabalho',
        photo_url: 'https://images.pexels.com/photos/3184432/pexels-photo-3184432.jpeg',
        members_count: 267
      },
      {
        name: 'Educação Online',
        description: '🎓 Futuro da educação digital. Professores, alunos e entusiastas discutem metodologias de ensino online, ferramentas educacionais e transformação digital na educação.',
        category: 'Educação',
        photo_url: 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg',
        members_count: 145
      }
    ]

    const results = []
    
    for (const community of professionalCommunities) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('communities')
          .select('id, name')
          .eq('name', community.name)
          .single()

        if (existing) {
          results.push({
            name: community.name,
            status: 'already_exists',
            id: existing.id
          })
          continue
        }

        // Criar a comunidade
        const { data: newCommunity, error } = await supabase
          .from('communities')
          .insert(community)
          .select()
          .single()

        if (error) throw error

        results.push({
          name: community.name,
          status: 'created',
          id: newCommunity.id
        })

      } catch (error) {
        results.push({
          name: community.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído! ${results.filter(r => r.status === 'created').length} comunidades criadas.`,
      results,
      total: professionalCommunities.length,
      created: results.filter(r => r.status === 'created').length,
      existing: results.filter(r => r.status === 'already_exists').length,
      errors: results.filter(r => r.status === 'error').length
    })

  } catch (error) {
    console.error('❌ Erro ao criar comunidades profissionais:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao criar comunidades profissionais',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: '🏢 Endpoint para criar comunidades profissionais',
    instructions: 'Use POST para criar todas as comunidades profissionais',
    communities: [
      'Bugs do Orkut', 'Orkut Novo', 'Desenvolvedores', 
      'Networking Profissional', 'Cursos Online', 'Empreendedorismo',
      'Vagas de Emprego', 'Startups Brasil', 'Freelancers Brasil', 'Educação Online'
    ]
  })
}
