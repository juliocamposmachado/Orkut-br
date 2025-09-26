import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

// Use environment variables from Vercel
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const MAX_ATTEMPTS = 5;

// Store in memory (limited on Vercel, but works for tests)
let attemptCount = 0;
let lastResetTime = new Date().toISOString();

interface CommunityActivity {
  userId: string;
  communityId: string;
  communityName: string;
  action: 'joined' | 'left' | 'posted' | 'liked' | 'commented';
  data?: any;
  timestamp: string;
}

interface CommunityActivityFile {
  activities: CommunityActivity[];
  lastUpdate: string;
  stats: {
    totalJoins: number;
    totalPosts: number;
    totalInteractions: number;
    uniqueUsers: number;
  };
}

async function updateCommunityActivityFile(
  userId: string, 
  communityId: string, 
  communityName: string, 
  action: string, 
  data?: any
): Promise<any> {
  try {
    if (!process.env.GITHUB_TOKEN || !OWNER || !REPO) {
      throw new Error('Configuração GitHub incompleta. Verifique as variáveis de ambiente no Vercel');
    }

    // Create community-specific file path
    const filePath = `communities/${communityId}/activities.json`;

    // Try to get existing file
    let existingContent: CommunityActivityFile = {
      activities: [],
      lastUpdate: '',
      stats: {
        totalJoins: 0,
        totalPosts: 0,
        totalInteractions: 0,
        uniqueUsers: 0
      }
    };
    let sha: string | null = null;

    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner: OWNER!,
        repo: REPO!,
        path: filePath,
      });

      if ('content' in fileData && fileData.content) {
        const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf8');
        existingContent = JSON.parse(decodedContent);
        sha = fileData.sha;
      }
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
      console.log(`Arquivo ${filePath} não existe, será criado`);
    }

    // Prepare new activity entry
    const timestamp = new Date().toISOString();
    const activityEntry: CommunityActivity = {
      userId,
      communityId,
      communityName,
      action: action as any,
      data,
      timestamp
    };

    // Update content
    if (!existingContent.activities) {
      existingContent.activities = [];
    }

    existingContent.activities.push(activityEntry);
    existingContent.lastUpdate = timestamp;

    // Update statistics
    const uniqueUsers = new Set(existingContent.activities.map(a => a.userId));
    existingContent.stats = {
      totalJoins: existingContent.activities.filter(a => a.action === 'joined').length,
      totalPosts: existingContent.activities.filter(a => a.action === 'posted').length,
      totalInteractions: existingContent.activities.filter(a => ['liked', 'commented'].includes(a.action)).length,
      uniqueUsers: uniqueUsers.size
    };

    // Keep only last 100 activities per community
    if (existingContent.activities.length > 100) {
      existingContent.activities = existingContent.activities.slice(-100);
    }

    const newContent = JSON.stringify(existingContent, null, 2);
    const encodedContent = Buffer.from(newContent, 'utf8').toString('base64');

    // Create or update file
    const commitMessage = `📊 Atividade: ${action} na comunidade "${communityName}" por ${userId}`;
    
    const result = await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER!,
      repo: REPO!,
      path: filePath,
      message: commitMessage,
      content: encodedContent,
      sha: sha || undefined,
    });

    console.log(`GitHub atualizado: ${result.data.commit.html_url}`);
    
    return {
      commitUrl: result.data.commit.html_url,
      sha: result.data.content?.sha,
      message: commitMessage,
      timestamp,
      filePath,
      stats: existingContent.stats
    };

  } catch (error: any) {
    console.error('Erro ao atualizar GitHub:', error);
    
    if (error.status === 401) {
      throw new Error('Token do GitHub inválido ou sem permissões');
    } else if (error.status === 403) {
      throw new Error('Sem permissão para acessar o repositório GitHub');
    } else if (error.status === 404) {
      throw new Error('Repositório não encontrado no GitHub');
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Erro de conectividade com GitHub');
    }
    
    throw new Error(`Erro GitHub: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, communityId, communityName, action, data } = body;
    
    if (!userId || !communityId || !communityName || !action) {
      return NextResponse.json(
        { error: 'userId, communityId, communityName e action são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate action types
    const validActions = ['joined', 'left', 'posted', 'liked', 'commented'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Ação inválida. Use: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Check attempt limit
    if (attemptCount >= MAX_ATTEMPTS) {
      return NextResponse.json({
        error: 'Limite de tentativas excedido',
        message: `Máximo de ${MAX_ATTEMPTS} tentativas atingido. Aguarde antes de tentar novamente.`,
        attempts: attemptCount
      }, { status: 429 });
    }

    // Try to update GitHub
    try {
      attemptCount++;
      const result = await updateCommunityActivityFile(userId, communityId, communityName, action, data);
      
      // Success - reset counter
      attemptCount = 0;
      lastResetTime = new Date().toISOString();
      
      return NextResponse.json({
        success: true,
        message: `Atividade "${action}" registrada para a comunidade "${communityName}"`,
        githubResult: result,
        attempts: attemptCount
      });

    } catch (githubError: any) {
      console.error('Erro ao atualizar GitHub:', githubError.message);
      
      if (attemptCount >= MAX_ATTEMPTS) {
        return NextResponse.json({
          error: 'Falha na atualização do GitHub',
          message: `Limite de ${MAX_ATTEMPTS} tentativas excedido. Parando as tentativas.`,
          attempts: attemptCount,
          localDataSaved: false
        }, { status: 500 });
      }

      return NextResponse.json({
        error: 'Falha na atualização do GitHub',
        message: githubError.message,
        attempts: attemptCount,
        localDataSaved: false,
        willRetry: attemptCount < MAX_ATTEMPTS
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro interno:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    currentAttempts: attemptCount,
    maxAttempts: MAX_ATTEMPTS,
    canTryAgain: attemptCount < MAX_ATTEMPTS,
    lastResetTime: lastResetTime,
    message: attemptCount >= MAX_ATTEMPTS 
      ? 'Limite de tentativas excedido' 
      : `${MAX_ATTEMPTS - attemptCount} tentativas restantes`,
    environment: {
      hasGithubToken: !!process.env.GITHUB_TOKEN,
      githubOwner: process.env.GITHUB_OWNER,
      githubRepo: process.env.GITHUB_REPO
    }
  });
}
