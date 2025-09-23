#!/usr/bin/env node
/**
 * Script para publicar posts no GitHub como banco de dados
 * Usa a API do GitHub para criar commits e pushes automáticos
 */

import crypto from 'crypto';
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

        if (data) {
            const jsonData = JSON.stringify(data);
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(jsonData);
        }

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

        if (data) {
            req.write(JSON.stringify(data));
        }
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
        return {
            content: Buffer.from(response.content, 'base64').toString('utf8'),
            sha: response.sha
        };
    } catch (error) {
        if (error.message.includes('404')) {
            return null; // Arquivo não existe
        }
        throw error;
    }
}

/**
 * Cria ou atualiza um arquivo no repositório
 */
async function updateFile(filePath, content, message, sha = null) {
    const data = {
        message,
        content: Buffer.from(content).toString('base64'),
        branch: GITHUB_BRANCH
    };

    if (sha) {
        data.sha = sha;
    }

    return await githubRequest(
        `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
        'PUT',
        data
    );
}

/**
 * Gera ID único para o post
 */
function generatePostId() {
    return crypto.randomUUID().substring(0, 8) + '-' + Date.now().toString(36);
}

/**
 * Formata data para estrutura de pastas
 */
function getDatePath(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return { year, month, yearMonth: `${year}/${month}` };
}

/**
 * Publica um novo post
 */
async function publishPost(postData) {
    const postId = generatePostId();
    const now = new Date();
    const { year, month, yearMonth } = getDatePath(now);
    
    // Estrutura do post
    const post = {
        id: postId,
        userId: postData.userId,
        userName: postData.userName,
        userAvatar: postData.userAvatar || null,
        content: postData.content,
        imageUrl: postData.imageUrl || null,
        createdAt: now.toISOString(),
        likes: 0,
        comments: 0,
        shares: 0,
        isPublic: postData.isPublic !== false,
        communityId: postData.communityId || null,
        communityName: postData.communityName || null,
        tags: postData.tags || [],
        metadata: {
            source: 'orkut-web',
            version: '1.0',
            ...postData.metadata
        }
    };

    console.log(`📝 Publicando post ${postId}...`);

    try {
        // 1. Salvar o post individual
        const postPath = `posts/${yearMonth}/${postId}.json`;
        await updateFile(
            postPath,
            JSON.stringify(post, null, 2),
            `📝 Novo post: ${postId} por @${postData.userName}`
        );

        console.log(`✅ Post salvo em: ${postPath}`);

        // 2. Atualizar o índice
        const indexPath = 'posts/index.json';
        let index = { posts: [], lastUpdated: now.toISOString() };
        
        const existingIndex = await getFileContent(indexPath);
        if (existingIndex) {
            index = JSON.parse(existingIndex.content);
        }

        // Adicionar novo post ao início da lista
        const postSummary = {
            id: postId,
            userId: post.userId,
            userName: post.userName,
            content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
            createdAt: post.createdAt,
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
            hasImage: !!post.imageUrl,
            communityId: post.communityId,
            filePath: postPath
        };

        index.posts.unshift(postSummary);
        
        // Manter apenas os últimos 1000 posts no índice
        if (index.posts.length > 1000) {
            index.posts = index.posts.slice(0, 1000);
        }

        index.lastUpdated = now.toISOString();
        index.totalPosts = (index.totalPosts || 0) + 1;

        await updateFile(
            indexPath,
            JSON.stringify(index, null, 2),
            `📊 Atualizar índice: novo post ${postId}`,
            existingIndex?.sha
        );

        console.log('✅ Índice atualizado');

        return {
            success: true,
            postId,
            postPath,
            url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${postPath}`
        };

    } catch (error) {
        console.error('❌ Erro ao publicar post:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// CLI Interface
if (process.argv[1] && process.argv[1].includes('publishPost.mjs')) {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help')) {
        console.log(`
📝 Orkut GitHub Feed - Publicador de Posts

USO:
  node publishPost.mjs --user-id=ID --user-name=NOME --content="TEXTO"

PARÂMETROS:
  --user-id=ID          ID único do usuário
  --user-name=NOME      Nome do usuário
  --content="TEXTO"     Conteúdo do post
  --image-url=URL       URL da imagem (opcional)
  --community-id=ID     ID da comunidade (opcional)
  --community-name=NOME Nome da comunidade (opcional)
  --tags=tag1,tag2      Tags separadas por vírgula
  --private             Marcar como post privado
  --help                Mostrar esta ajuda

EXEMPLO:
  node publishPost.mjs --user-id=123 --user-name="João" --content="Olá Orkut!"

VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
  GITHUB_TOKEN          Token de acesso do GitHub
  GITHUB_OWNER          Owner do repositório
  GITHUB_REPO           Nome do repositório
  GITHUB_BRANCH         Branch (padrão: main)
`);
        process.exit(0);
    }

    // Parse dos argumentos
    const postData = {};
    let isPrivate = false;

    for (const arg of args) {
        if (arg === '--private') {
            isPrivate = true;
        } else if (arg.includes('=')) {
            const [key, value] = arg.split('=', 2);
            const cleanKey = key.replace('--', '').replace(/-([a-z])/g, (match, letter) => 
                letter.toUpperCase()
            );
            
            if (cleanKey === 'tags') {
                postData[cleanKey] = value.split(',').map(t => t.trim());
            } else {
                postData[cleanKey] = value;
            }
        }
    }

    postData.isPublic = !isPrivate;

    // Validar dados obrigatórios
    if (!postData.userId || !postData.userName || !postData.content) {
        console.error('❌ Erro: userId, userName e content são obrigatórios');
        process.exit(1);
    }

    // Publicar post
    const result = await publishPost(postData);
    
    if (result.success) {
        console.log(`\n🎉 Post publicado com sucesso!`);
        console.log(`   ID: ${result.postId}`);
        console.log(`   URL: ${result.url}`);
    } else {
        console.error(`\n❌ Falha na publicação: ${result.error}`);
        process.exit(1);
    }
}

export { publishPost };
