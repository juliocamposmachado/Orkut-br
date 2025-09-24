#!/usr/bin/env node
/**
 * Script para publicar comunidades no GitHub como banco de dados
 * Baseado no sistema de posts existente
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
 * Gera ID único para a comunidade
 */
function generateCommunityId() {
    return crypto.randomUUID().substring(0, 8) + '-' + Date.now().toString(36);
}

/**
 * Formata slug da comunidade para URL
 */
function generateSlug(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Publica uma nova comunidade
 */
async function publishCommunity(communityData) {
    const communityId = generateCommunityId();
    const slug = generateSlug(communityData.name);
    const now = new Date();
    
    // Estrutura da comunidade
    const community = {
        id: communityId,
        name: communityData.name,
        slug: slug,
        description: communityData.description,
        category: communityData.category,
        photo_url: communityData.photo_url || `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&q=80&auto=format`,
        owner: communityData.owner,
        owner_name: communityData.owner_name || 'Usuário',
        members_count: communityData.members_count || 1,
        visibility: communityData.visibility || 'public',
        join_approval_required: communityData.join_approval_required || false,
        rules: communityData.rules || 'Seja respeitoso e mantenha as discussões relevantes ao tema da comunidade.',
        welcome_message: communityData.welcome_message || `Bem-vindo à comunidade ${communityData.name}!`,
        tags: communityData.tags || [],
        is_active: communityData.is_active !== false,
        posts_count: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        metadata: {
            source: 'orkut-web',
            version: '1.0',
            created_via: 'github-script',
            ...communityData.metadata
        }
    };

    console.log(`🏘️ Publicando comunidade ${communityId} (${community.name})...`);

    try {
        // 1. Salvar a comunidade individual
        const communityPath = `communities/${slug}/${communityId}.json`;
        await updateFile(
            communityPath,
            JSON.stringify(community, null, 2),
            `🏘️ Nova comunidade: ${community.name} por @${communityData.owner_name || communityData.owner}`
        );

        console.log(`✅ Comunidade salva em: ${communityPath}`);

        // 2. Atualizar o índice de comunidades
        const indexPath = 'communities/index.json';
        let index = { 
            communities: [], 
            lastUpdated: now.toISOString(),
            totalCommunities: 0,
            categories: {}
        };
        
        const existingIndex = await getFileContent(indexPath);
        if (existingIndex) {
            index = JSON.parse(existingIndex.content);
        }

        // Verificar se já existe comunidade com o mesmo nome
        const existingCommunity = index.communities.find(c => 
            c.name.toLowerCase() === community.name.toLowerCase()
        );

        if (existingCommunity) {
            throw new Error(`Já existe uma comunidade com o nome "${community.name}"`);
        }

        // Adicionar nova comunidade ao início da lista
        const communitySummary = {
            id: communityId,
            name: community.name,
            slug: community.slug,
            description: community.description.substring(0, 200) + (community.description.length > 200 ? '...' : ''),
            category: community.category,
            photo_url: community.photo_url,
            owner: community.owner,
            owner_name: community.owner_name,
            members_count: community.members_count,
            visibility: community.visibility,
            posts_count: community.posts_count,
            createdAt: community.createdAt,
            updatedAt: community.updatedAt,
            filePath: communityPath
        };

        index.communities.unshift(communitySummary);
        
        // Manter apenas as últimas 500 comunidades no índice
        if (index.communities.length > 500) {
            index.communities = index.communities.slice(0, 500);
        }

        // Atualizar estatísticas por categoria
        index.categories = index.categories || {};
        index.categories[community.category] = (index.categories[community.category] || 0) + 1;

        index.lastUpdated = now.toISOString();
        index.totalCommunities = (index.totalCommunities || 0) + 1;

        await updateFile(
            indexPath,
            JSON.stringify(index, null, 2),
            `📊 Atualizar índice: nova comunidade ${community.name}`,
            existingIndex?.sha
        );

        console.log('✅ Índice de comunidades atualizado');

        // 3. Criar arquivo de configuração inicial da comunidade
        const configPath = `communities/${slug}/config.json`;
        const config = {
            id: communityId,
            name: community.name,
            slug: community.slug,
            settings: {
                allowPosts: true,
                moderationRequired: community.join_approval_required,
                autoApproval: !community.join_approval_required,
                maxMembers: null,
                tags: community.tags
            },
            stats: {
                posts: 0,
                members: community.members_count,
                activeMembers: 1,
                dailyPosts: 0,
                weeklyPosts: 0
            },
            created: now.toISOString(),
            lastActivity: now.toISOString()
        };

        await updateFile(
            configPath,
            JSON.stringify(config, null, 2),
            `⚙️ Configuração inicial da comunidade ${community.name}`
        );

        console.log(`✅ Configuração salva em: ${configPath}`);

        return {
            success: true,
            communityId,
            slug,
            communityPath,
            configPath,
            indexPath,
            url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${communityPath}`,
            community: community
        };

    } catch (error) {
        console.error('❌ Erro ao publicar comunidade:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Lista comunidades do GitHub
 */
async function listCommunities(options = {}) {
    const {
        limit = 50,
        category = null,
        search = null
    } = options;

    try {
        console.log('📡 Buscando índice de comunidades...');
        const indexContent = await getFileContent('communities/index.json');
        
        if (!indexContent) {
            return {
                communities: [],
                total: 0,
                categories: {},
                lastUpdated: null
            };
        }

        const index = JSON.parse(indexContent.content);
        let filteredCommunities = [...index.communities];

        // Filtrar por categoria
        if (category && category !== 'Todos') {
            filteredCommunities = filteredCommunities.filter(c => c.category === category);
            console.log(`🔍 Filtrado por categoria "${category}": ${filteredCommunities.length} comunidades`);
        }

        // Filtrar por busca
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredCommunities = filteredCommunities.filter(c =>
                c.name.toLowerCase().includes(searchTerm) ||
                c.description.toLowerCase().includes(searchTerm)
            );
            console.log(`🔍 Filtrado por busca "${search}": ${filteredCommunities.length} comunidades`);
        }

        // Aplicar limite
        const limitedCommunities = filteredCommunities.slice(0, limit);
        console.log(`📄 Retornando ${limitedCommunities.length} comunidades (limite: ${limit})`);

        return {
            communities: limitedCommunities,
            total: index.totalCommunities || 0,
            filtered: filteredCommunities.length,
            categories: index.categories || {},
            lastUpdated: index.lastUpdated
        };

    } catch (error) {
        console.error('❌ Erro ao listar comunidades:', error.message);
        return {
            communities: [],
            total: 0,
            categories: {},
            lastUpdated: null,
            error: error.message
        };
    }
}

// CLI Interface
if (process.argv[1] && process.argv[1].includes('publishCommunity.mjs')) {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help')) {
        console.log(`
🏘️ Orkut GitHub Feed - Publicador de Comunidades

USO:
  node publishCommunity.mjs --name="NOME" --description="DESCRIÇÃO" --category="CATEGORIA" [opções]
  node publishCommunity.mjs --list [filtros]

PARÂMETROS PARA CRIAÇÃO:
  --name="NOME"           Nome da comunidade (obrigatório)
  --description="TEXTO"   Descrição da comunidade (obrigatório)
  --category="CATEGORIA"  Categoria da comunidade (obrigatório)
  --owner=ID              ID do proprietário (obrigatório)
  --owner-name="NOME"     Nome do proprietário
  --photo-url=URL         URL da foto da comunidade
  --visibility=TIPO       public/private/restricted (padrão: public)
  --approval-required     Exigir aprovação para entrar
  --rules="REGRAS"        Regras da comunidade
  --welcome="MENSAGEM"    Mensagem de boas-vindas
  --tags=tag1,tag2        Tags separadas por vírgula

PARÂMETROS PARA LISTAGEM:
  --list                  Listar comunidades existentes
  --category="CATEGORIA"  Filtrar por categoria
  --search="TERMO"        Buscar por termo
  --limit=N               Limite de resultados (padrão: 50)

EXEMPLOS:
  # Criar comunidade
  node publishCommunity.mjs \\
    --name="Desenvolvedores JavaScript" \\
    --description="Comunidade para desenvolvedores JS" \\
    --category="Tecnologia" \\
    --owner=user123 \\
    --owner-name="João"

  # Listar comunidades
  node publishCommunity.mjs --list

  # Buscar comunidades por categoria
  node publishCommunity.mjs --list --category="Tecnologia"

VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
  GITHUB_TOKEN          Token de acesso do GitHub
  GITHUB_OWNER          Owner do repositório
  GITHUB_REPO           Nome do repositório
  GITHUB_BRANCH         Branch (padrão: main)
`);
        process.exit(0);
    }

    // Parse dos argumentos
    const communityData = {};
    const listOptions = {};
    let shouldList = false;
    let approvalRequired = false;

    for (const arg of args) {
        if (arg === '--list') {
            shouldList = true;
        } else if (arg === '--approval-required') {
            approvalRequired = true;
        } else if (arg.includes('=')) {
            const [key, value] = arg.split('=', 2);
            const cleanKey = key.replace('--', '').replace(/-([a-z])/g, (match, letter) => 
                letter.toUpperCase()
            );
            
            if (shouldList) {
                // Opções de listagem
                if (cleanKey === 'limit') {
                    listOptions.limit = parseInt(value) || 50;
                } else if (cleanKey === 'category') {
                    listOptions.category = value;
                } else if (cleanKey === 'search') {
                    listOptions.search = value;
                }
            } else {
                // Dados da comunidade
                if (cleanKey === 'tags') {
                    communityData[cleanKey] = value.split(',').map(t => t.trim());
                } else {
                    communityData[cleanKey] = value;
                }
            }
        }
    }

    if (shouldList) {
        // Listar comunidades
        const result = await listCommunities(listOptions);
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    }

    communityData.join_approval_required = approvalRequired;

    // Validar dados obrigatórios para criação
    if (!communityData.name || !communityData.description || !communityData.category || !communityData.owner) {
        console.error('❌ Erro: name, description, category e owner são obrigatórios');
        process.exit(1);
    }

    // Publicar comunidade
    const result = await publishCommunity(communityData);
    
    if (result.success) {
        console.log(`\n🎉 Comunidade publicada com sucesso!`);
        console.log(`   ID: ${result.communityId}`);
        console.log(`   Slug: ${result.slug}`);
        console.log(`   URL: ${result.url}`);
    } else {
        console.error(`\n❌ Falha na publicação: ${result.error}`);
        process.exit(1);
    }
}

export { publishCommunity, listCommunities };
