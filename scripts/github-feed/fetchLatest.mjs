#!/usr/bin/env node
/**
 * Script para ler o feed de posts do GitHub
 * Para uso na geração estática do Orkut
 */

import https from 'https';

// Configurações do GitHub
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.error('❌ Erro: Defina as variáveis GITHUB_TOKEN, GITHUB_OWNER e GITHUB_REPO');
    process.exit(1);
}

/**
 * Faz requisição para a API do GitHub
 */
async function githubRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            port: 443,
            path,
            method,
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'User-Agent': 'Orkut-GitHub-Feed/1.0',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = body ? JSON.parse(body) : {};
                    if (res.statusCode >= 400) {
                        reject(new Error(`GitHub API Error: ${res.statusCode} - ${response.message || body}`));
                    } else {
                        resolve(response);
                    }
                } catch (e) {
                    reject(new Error(`JSON Parse Error: ${e.message}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Busca conteúdo de um arquivo no repositório
 */
async function getFileContent(filePath) {
    try {
        const response = await githubRequest(
            `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`
        );
        return Buffer.from(response.content, 'base64').toString('utf8');
    } catch (error) {
        if (error.message.includes('404')) {
            return null; // Arquivo não existe
        }
        throw error;
    }
}

/**
 * Busca o índice de posts
 */
async function fetchIndex() {
    const indexContent = await getFileContent('posts/index.json');
    if (!indexContent) {
        return { posts: [], lastUpdated: null, totalPosts: 0 };
    }
    return JSON.parse(indexContent);
}

/**
 * Busca conteúdo completo de posts específicos
 */
async function fetchPostsContent(posts) {
    const postsWithContent = [];
    
    for (const postSummary of posts) {
        try {
            const content = await getFileContent(postSummary.filePath);
            if (content) {
                const fullPost = JSON.parse(content);
                postsWithContent.push(fullPost);
            } else {
                // Se não conseguir buscar o conteúdo completo, usar o resumo
                postsWithContent.push(postSummary);
            }
        } catch (error) {
            console.error(`⚠️  Erro ao buscar post ${postSummary.id}:`, error.message);
            // Adicionar o resumo mesmo com erro
            postsWithContent.push(postSummary);
        }
    }
    
    return postsWithContent;
}

/**
 * Busca os posts mais recentes
 */
async function fetchLatestPosts(options = {}) {
    const {
        limit = 20,
        withContent = false,
        userId = null,
        communityId = null
    } = options;

    try {
        console.error(`📡 Buscando índice de posts...`);
        const index = await fetchIndex();
        
        if (index.posts.length === 0) {
            return {
                posts: [],
                totalPosts: 0,
                lastUpdated: index.lastUpdated,
                hasMore: false
            };
        }

        console.error(`📊 Encontrados ${index.totalPosts} posts no total`);

        let filteredPosts = index.posts;

        // Filtrar por usuário se especificado
        if (userId) {
            filteredPosts = filteredPosts.filter(post => post.userId === userId);
            console.error(`🔍 Filtrado para usuário ${userId}: ${filteredPosts.length} posts`);
        }

        // Filtrar por comunidade se especificado
        if (communityId) {
            filteredPosts = filteredPosts.filter(post => post.communityId === communityId);
            console.error(`🏘️  Filtrado para comunidade ${communityId}: ${filteredPosts.length} posts`);
        }

        // Aplicar limite
        const limitedPosts = filteredPosts.slice(0, limit);
        console.error(`📄 Retornando ${limitedPosts.length} posts (limite: ${limit})`);

        let finalPosts = limitedPosts;

        // Buscar conteúdo completo se solicitado
        if (withContent) {
            console.error(`📖 Buscando conteúdo completo dos posts...`);
            finalPosts = await fetchPostsContent(limitedPosts);
        }

        return {
            posts: finalPosts,
            totalPosts: index.totalPosts,
            filteredTotal: filteredPosts.length,
            lastUpdated: index.lastUpdated,
            hasMore: filteredPosts.length > limit
        };

    } catch (error) {
        console.error('❌ Erro ao buscar posts:', error.message);
        return {
            posts: [],
            totalPosts: 0,
            lastUpdated: null,
            hasMore: false,
            error: error.message
        };
    }
}

/**
 * Busca um post específico pelo ID
 */
async function fetchPostById(postId) {
    try {
        console.error(`🔍 Buscando post ${postId}...`);
        
        // Primeiro, buscar no índice para encontrar o caminho do arquivo
        const index = await fetchIndex();
        const postSummary = index.posts.find(p => p.id === postId);
        
        if (!postSummary) {
            return { post: null, error: 'Post não encontrado' };
        }

        // Buscar conteúdo completo
        const content = await getFileContent(postSummary.filePath);
        if (!content) {
            return { post: null, error: 'Conteúdo do post não encontrado' };
        }

        return { post: JSON.parse(content) };

    } catch (error) {
        console.error('❌ Erro ao buscar post:', error.message);
        return { post: null, error: error.message };
    }
}

// CLI Interface
if (process.argv[1] && process.argv[1].includes('fetchLatest.mjs')) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
        console.log(`
📖 Orkut GitHub Feed - Leitor de Posts

USO:
  node fetchLatest.mjs [opções]

OPÇÕES:
  --limit=N             Número máximo de posts (padrão: 20)
  --with-content        Buscar conteúdo completo dos posts
  --user-id=ID          Filtrar por usuário específico
  --community-id=ID     Filtrar por comunidade específica
  --post-id=ID          Buscar um post específico por ID
  --help                Mostrar esta ajuda

EXEMPLOS:
  # Buscar últimos 10 posts (resumo)
  node fetchLatest.mjs --limit=10

  # Buscar últimos 5 posts com conteúdo completo
  node fetchLatest.mjs --limit=5 --with-content

  # Posts de um usuário específico
  node fetchLatest.mjs --user-id=123 --with-content

  # Post específico
  node fetchLatest.mjs --post-id=abc123-xyz

VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
  GITHUB_TOKEN          Token de acesso do GitHub
  GITHUB_OWNER          Owner do repositório
  GITHUB_REPO           Nome do repositório
  GITHUB_BRANCH         Branch (padrão: main)

SAÍDA:
  JSON estruturado no stdout (logs de status vão para stderr)
`);
        process.exit(0);
    }

    // Parse dos argumentos
    const options = {
        limit: 20,
        withContent: false,
        userId: null,
        communityId: null,
        postId: null
    };

    for (const arg of args) {
        if (arg === '--with-content') {
            options.withContent = true;
        } else if (arg.includes('=')) {
            const [key, value] = arg.split('=', 2);
            const cleanKey = key.replace('--', '').replace(/-([a-z])/g, (match, letter) => 
                letter.toUpperCase()
            );
            
            if (cleanKey === 'limit') {
                options.limit = parseInt(value) || 20;
            } else if (cleanKey === 'userId') {
                options.userId = value;
            } else if (cleanKey === 'communityId') {
                options.communityId = value;
            } else if (cleanKey === 'postId') {
                options.postId = value;
            }
        }
    }

    let result;

    // Buscar post específico ou feed
    if (options.postId) {
        result = await fetchPostById(options.postId);
    } else {
        result = await fetchLatestPosts(options);
    }

    // Saída em JSON (stdout)
    console.log(JSON.stringify(result, null, 2));
}

export { fetchLatestPosts, fetchPostById, fetchIndex };
