#!/usr/bin/env node

console.log('🔍 Testando conexão com GitHub API...');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

console.log('📋 Configurações:');
console.log(`  GITHUB_OWNER: ${GITHUB_OWNER}`);
console.log(`  GITHUB_REPO: ${GITHUB_REPO}`);
console.log(`  GITHUB_BRANCH: ${GITHUB_BRANCH}`);
console.log(`  GITHUB_TOKEN: ${GITHUB_TOKEN ? '✅ Configurado' : '❌ Não encontrado'}`);

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.error('❌ Variáveis de ambiente não configuradas!');
    process.exit(1);
}

// Teste simples da API
import https from 'https';

function githubRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            port: 443,
            path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'User-Agent': 'Orkut-Test/1.0',
                'Accept': 'application/vnd.github+json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, error: e.message, body });
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

console.log('\n🔌 Testando acesso ao repositório...');

try {
    const result = await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}`);
    
    if (result.status === 200) {
        console.log('✅ Repositório acessível!');
        console.log(`   Nome: ${result.data.name}`);
        console.log(`   Branch padrão: ${result.data.default_branch}`);
        console.log(`   Privado: ${result.data.private ? 'Sim' : 'Não'}`);
        
        // Testar acesso ao conteúdo
        console.log('\n📁 Testando acesso ao conteúdo...');
        const contentsResult = await githubRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents?ref=${GITHUB_BRANCH}`);
        
        if (contentsResult.status === 200) {
            console.log('✅ Acesso ao conteúdo funcionando!');
            console.log(`   Arquivos encontrados: ${contentsResult.data.length}`);
            
            // Verificar se existe pasta posts
            const hasPostsFolder = contentsResult.data.find(item => item.name === 'posts');
            console.log(`   Pasta 'posts': ${hasPostsFolder ? '✅ Existe' : '❌ Não existe'}`);
            
        } else {
            console.log(`❌ Erro ao acessar conteúdo: ${contentsResult.status}`);
            console.log(JSON.stringify(contentsResult, null, 2));
        }
        
    } else {
        console.log(`❌ Erro ao acessar repositório: ${result.status}`);
        console.log(JSON.stringify(result, null, 2));
    }
    
} catch (error) {
    console.error('❌ Erro na requisição:', error.message);
}
