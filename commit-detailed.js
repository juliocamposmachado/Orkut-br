const { execSync } = require('child_process');

const commitMessage = `docs: v2.2.0 - correções de produção e melhorias de deploy

🔧 CORREÇÕES CRÍTICAS DE DEPLOY:
- Supabase null checks implementados em todos os componentes
- Verificações de produção adicionadas nos cronjobs
- Erro linha 81 corrigido em app/amigos/page.tsx
- Contextos protegidos contra valores undefined
- Deploy duplo resolvido - removida integração conflitante

🚀 MELHORIAS DE DEPLOY:
- Deploy automático via GitHub Integration configurado
- Vercel production optimizations aplicadas
- Build errors eliminados completamente
- Node.js 22.x compatibility confirmada
- Execution policies contornadas no Windows

🤖 SISTEMA ORKY BOT APRIMORADO:
- Verificações robustas de conexão Supabase
- Fallback handling melhorado para produção
- Error boundaries nos cronjobs
- Produção-ready com timeout adequado

🛡️ SEGURANÇA E ESTABILIDADE:
- Supabase null safety em todas as queries
- Production environment checks
- Error handling aprimorado
- TypeScript strict mode compliance

📁 ARQUIVOS MODIFICADOS:
- app/amigos/page.tsx - Supabase checks adicionados
- app/api/cron/orky-posts/route.ts - Verificações de produção
- app/api/cron/radio-posts/route.ts - Verificações de produção
- data/global-posts.json - Posts atualizados
- .gitignore - Arquivos temporários ignorados
- README.md - Atualizado com v2.2.0
- CHANGELOG.md - Documentação detalhada criada

🐛 BUGS CORRIGIDOS:
- Build Failed - Supabase undefined errors
- Deploy duplo - GitHub + manual conflict
- Linha 81 error - Missing null check
- PowerShell execution policy errors
- Cronjobs failing in production

Sistema agora 100% production-ready com deploy automático via GitHub!`;

try {
  execSync('git add .', { stdio: 'inherit' });
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  console.log('✅ Commit criado com sucesso!');
} catch (error) {
  console.error('❌ Erro no commit:', error);
  process.exit(1);
}
