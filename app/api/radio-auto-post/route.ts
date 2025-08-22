import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

// Cache para evitar posts duplicados
let lastPostTime = 0;
const POST_INTERVAL = 15 * 60 * 1000; // 15 minutos
const ORKY_USER_ID = 'orky-ai-assistant'; // ID fixo para o Orky

export async function GET() {
  try {
    const now = Date.now();
    
    // Verificar se já passou o intervalo de 15 minutos
    if (now - lastPostTime < POST_INTERVAL) {
      const timeLeft = Math.ceil((POST_INTERVAL - (now - lastPostTime)) / 1000 / 60);
      return NextResponse.json({
        message: 'Aguardando próximo post automático',
        timeLeftMinutes: timeLeft,
        nextPostAt: new Date(lastPostTime + POST_INTERVAL).toISOString()
      });
    }

    console.log('🎵 Orky: Preparando para criar post automático da rádio...');

    // 1. Buscar dados atuais da rádio
    console.log('📡 Orky: Buscando dados da rádio...');
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3001'; // Porta 3001 para desenvolvimento
    
    const radioResponse = await fetch(`${baseUrl}/api/radio-status`, {
      cache: 'no-store'
    });

    if (!radioResponse.ok) {
      throw new Error('Erro ao buscar dados da rádio');
    }

    const radioData = await radioResponse.json();
    console.log('🎵 Orky: Dados da rádio obtidos:', radioData.currentSong);

    // 2. Preparar dados para o Gemini
    const musicContext = {
      currentSong: radioData.currentSong,
      recentSongs: radioData.recentSongs?.slice(0, 5) || [], // Últimas 5
      radioName: 'Rádio Tatuapé FM',
      timestamp: new Date().toLocaleString('pt-BR')
    };

    // 3. Gerar comentário inteligente com Gemini
    console.log('🧠 Orky: Gerando comentário inteligente...');
    const aiComment = await generateMusicComment(musicContext);

    // 4. Verificar/criar perfil do Orky
    await ensureOrkyProfile();

    // 5. Criar post no feed
    console.log('📝 Orky: Criando post no feed...');
    const postContent = formatRadioPost(musicContext, aiComment);
    
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({
        author: ORKY_USER_ID,
        content: postContent,
        created_at: new Date().toISOString(),
        likes_count: 0,
        comments_count: 0
      })
      .select()
      .single();

    if (postError) {
      throw new Error(`Erro ao criar post: ${postError.message}`);
    }

    // 6. Atualizar timestamp do último post
    lastPostTime = now;

    console.log('✅ Orky: Post criado com sucesso!', newPost.id);

    return NextResponse.json({
      success: true,
      postId: newPost.id,
      content: postContent,
      radioData: musicContext,
      aiComment,
      nextPostAt: new Date(now + POST_INTERVAL).toISOString()
    });

  } catch (error) {
    console.error('❌ Orky: Erro ao criar post automático:', error);
    
    return NextResponse.json({
      success: false,
      error: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      nextRetryAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Tentar novamente em 5 min
    }, { status: 500 });
  }
}

// Função para garantir que o perfil do Orky existe
async function ensureOrkyProfile() {
  try {
    // Verificar se perfil já existe
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', ORKY_USER_ID)
      .single();

    if (existingProfile) {
      console.log('👤 Orky: Perfil já existe');
      return existingProfile;
    }

    // Criar perfil do Orky se não existir
    console.log('👤 Orky: Criando perfil oficial...');
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: ORKY_USER_ID,
        username: 'orky',
        display_name: 'Orky 🤖',
        bio: '🤖 Assistente Inteligente do Orkut • 🎵 DJ Virtual da Rádio Tatuapé FM • 🎯 Compartilhando as melhores músicas 24/7',
        photo_url: '/orky-avatar.png', // Vamos criar um avatar para o Orky
        relationship: 'IA Assistente',
        location: 'Nuvem ☁️',
        fans_count: 0,
        is_verified: true, // Marcar como verificado
        is_ai: true // Campo especial para IAs
      })
      .select()
      .single();

    if (createError) {
      console.log('⚠️ Orky: Erro ao criar perfil, tentando atualizar:', createError.message);
      
      // Se der erro, tentar upsert
      const { data: upsertProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: ORKY_USER_ID,
          username: 'orky',
          display_name: 'Orky 🤖',
          bio: '🤖 Assistente Inteligente do Orkut • 🎵 DJ Virtual da Rádio Tatuapé FM • 🎯 Compartilhando as melhores músicas 24/7',
          photo_url: '/orky-avatar.png',
          relationship: 'IA Assistente',
          location: 'Nuvem ☁️',
        })
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }
      
      console.log('✅ Orky: Perfil criado via upsert');
      return upsertProfile;
    }

    console.log('✅ Orky: Perfil criado com sucesso!');
    return newProfile;

  } catch (error) {
    console.error('❌ Orky: Erro ao criar/verificar perfil:', error);
    throw error;
  }
}

// Função para gerar comentário inteligente sobre as músicas
async function generateMusicComment(musicContext: any): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log('⚠️ Orky: GEMINI_API_KEY não configurada, usando comentário padrão');
      return generateDefaultComment(musicContext);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Como Orky, a IA assistente da Rádio Tatuapé FM, crie um post CURTO e ENVOLVENTE para o feed do Orkut sobre as músicas que acabaram de tocar na rádio.

CONTEXTO:
- Música atual: ${musicContext.currentSong}
- Últimas músicas: ${musicContext.recentSongs.map((s: any) => `${s.time} - ${s.title}`).join(', ')}
- Rádio: ${musicContext.radioName}
- Horário: ${musicContext.timestamp}

INSTRUÇÕES:
- Seja CONCISO (máximo 280 caracteres)
- Use emojis relevantes 🎵🎸🎤🎧
- Mencione 1-2 músicas mais interessantes
- Seja animado e envolvente
- Use gírias brasileiras naturais
- NÃO mencione que você é uma IA
- Foque na música e na vibe da rádio

EXEMPLO:
"🎵 QUE SETLIST INCRÍVEL rolando na Rádio Tatuapé FM! 🎸 Acabou de tocar Faith No More - Ugly in the Morning e agora é a vez de Van Halen! Rock clássico que arrepia! 🤘 #RadioTatuapeFM #RockNRoll"

Sua resposta (apenas o texto do post):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    console.log('🧠 Orky: Comentário gerado pelo Gemini:', text);
    return text;

  } catch (error) {
    console.error('❌ Orky: Erro no Gemini, usando comentário padrão:', error);
    return generateDefaultComment(musicContext);
  }
}

// Função de fallback para comentários quando Gemini não está disponível
function generateDefaultComment(musicContext: any): string {
  const templates = [
    `🎵 Rolando agora na Rádio Tatuapé FM: "${musicContext.currentSong}" 🎧 Que som é esse! #RadioTatuapeFM`,
    `🎸 QUE MÚSICA BOA acabou de tocar! "${musicContext.currentSong}" na Rádio Tatuapé FM 🔥 #MúsicaBoa`,
    `🎤 Setlist da hora na Rádio Tatuapé FM! Tocando "${musicContext.currentSong}" 🎶 Bora ouvir! #AoVivo`,
    `🎧 A Rádio Tatuapé FM não para! Agora é "${musicContext.currentSong}" 🎵 Som de qualidade! #RadioFM`,
    `🔥 Que trilha sonora massa na Rádio Tatuapé FM! "${musicContext.currentSong}" mandando muito! 🎸 #Rock`
  ];

  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  return randomTemplate;
}

// Função para formatar o post final
function formatRadioPost(musicContext: any, aiComment: string): string {
  const recentList = musicContext.recentSongs
    .slice(0, 3)
    .map((song: any) => `🎵 ${song.time} - ${song.title}`)
    .join('\n');

  return `${aiComment}

📻 ÚLTIMAS TOCADAS:
${recentList}

🔗 Ouça ao vivo: Rádio Tatuapé FM`;
}

// Endpoint POST para triggering manual (para testes)
export async function POST() {
  try {
    // Reset do timer para permitir post imediato
    lastPostTime = 0;
    
    // Chamar a função GET para executar a lógica
    return await GET();
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Erro no post manual: ${error instanceof Error ? error.message : 'Desconhecido'}`
    }, { status: 500 });
  }
}
