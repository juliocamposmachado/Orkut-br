import { NextRequest, NextResponse } from 'next/server';
import { getOrkutDB } from '@/lib/orkut-pastedb-adapter';

export async function GET(request: NextRequest) {
  try {
    const db = getOrkutDB();
    await db.initialize();

    // Testar diferentes funcionalidades
    const stats = await db.getStats();
    const profiles = await db.getAllProfiles();
    const posts = await db.getFeedPosts(5);
    const communities = await db.getCommunities(5);

    return NextResponse.json({
      success: true,
      message: '🎉 Adaptador PasteDB funcionando perfeitamente!',
      data: {
        stats,
        sample_data: {
          profiles: profiles.slice(0, 2),
          posts: posts.slice(0, 2), 
          communities: communities.slice(0, 2)
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste PasteDB:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getOrkutDB();
    await db.initialize();

    // Testar criação de post
    if (body.action === 'create_post') {
      const postId = await db.createPost({
        author_id: 'user_001',
        author_name: 'Teste User',
        author_photo: '',
        content: body.content || 'Post de teste via API! 🚀',
        visibility: 'public',
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_hidden: false
      });

      return NextResponse.json({
        success: true,
        message: 'Post criado com sucesso!',
        post_id: postId
      });
    }

    // Testar busca
    if (body.action === 'search') {
      const results = await db.searchProfiles(body.query || 'João');
      return NextResponse.json({
        success: true,
        message: 'Busca realizada com sucesso!',
        results
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Ação não reconhecida'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Erro no teste POST PasteDB:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
