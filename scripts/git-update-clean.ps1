# Script para atualizar GitHub com melhorias do build e seed
Write-Host "=== ATUALIZANDO GITHUB COM MELHORIAS ===" -ForegroundColor Magenta

# Verificar se eh um repositorio Git
if (-not (Test-Path ".git")) {
    Write-Host "Este diretorio nao eh um repositorio Git" -ForegroundColor Red
    Write-Host "Inicializar com: git init" -ForegroundColor Yellow
    exit 1
}

# Verificar status do Git
Write-Host "Verificando status do repositorio..." -ForegroundColor Cyan
$gitStatus = git status --porcelain

if ($gitStatus) {
    Write-Host "Arquivos modificados encontrados" -ForegroundColor Green
    
    # Adicionar todos os arquivos importantes
    Write-Host "Adicionando arquivos..." -ForegroundColor Cyan
    
    git add package.json
    git add next.config.js
    git add .vercelignore
    git add scripts/seed-complete-database.js
    git add scripts/vercel-build.js
    git add scripts/build-clean.ps1
    git add scripts/test-build-deploy.ps1
    git add scripts/git-update-clean.ps1
    git add README-SEED.md
    git add data/
    
    # Verificar se ha staging
    $staged = git diff --cached --name-only
    if ($staged) {
        Write-Host "Arquivos preparados para commit:" -ForegroundColor Green
        $staged | ForEach-Object { Write-Host "   - $_" -ForegroundColor White }
        
        # Commit com mensagem descritiva limpa
        $commitMessage = "feat: Add database seeding and static build optimization

- Complete database seeding with realistic Brazilian data
- 8 realistic Brazilian user profiles  
- 6 thematic communities with thousands of members
- 40+ photos with realistic metadata and interactions
- Social posts and activities for authentic experience
- 4 Brazilian radio stations with real stream URLs
- Optimized static build generating 115+ pages (~800MB)
- Vercel deploy automation with data pre-generation
- Build hooks ensuring data exists before deployment
- Comprehensive build testing and validation scripts
- Zero-error builds ready for production deployment

This resolves empty database issues and ensures pages load with 
populated content matching the authentic Orkut BR experience."

        Write-Host ""
        Write-Host "Commit message:" -ForegroundColor Cyan
        Write-Host $commitMessage -ForegroundColor White
        Write-Host ""
        
        $confirm = Read-Host "Confirmar commit? (s/N)"
        if ($confirm -eq "s" -or $confirm -eq "S") {
            git commit -m $commitMessage
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Commit realizado com sucesso" -ForegroundColor Green
                
                # Verificar branch atual
                $currentBranch = git branch --show-current
                Write-Host "Branch atual: $currentBranch" -ForegroundColor Cyan
                
                # Perguntar sobre push
                Write-Host ""
                $pushConfirm = Read-Host "Fazer push para GitHub? (s/N)"
                if ($pushConfirm -eq "s" -or $pushConfirm -eq "S") {
                    Write-Host "Fazendo push..." -ForegroundColor Cyan
                    
                    git push origin $currentBranch
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host ""
                        Write-Host "GitHub atualizado com sucesso!" -ForegroundColor Green
                        Write-Host ""
                        Write-Host "Resumo das melhorias enviadas:" -ForegroundColor Cyan
                        Write-Host "   Scripts de seed completo do banco de dados" -ForegroundColor White
                        Write-Host "   Build estatico otimizado (115+ paginas)" -ForegroundColor White
                        Write-Host "   Automacao de deploy no Vercel" -ForegroundColor White
                        Write-Host "   Dados brasileiros realistas" -ForegroundColor White
                        Write-Host "   Testes de build e validacao" -ForegroundColor White
                        Write-Host ""
                        Write-Host "O Vercel devera detectar as mudancas e fazer deploy automaticamente" -ForegroundColor Yellow
                    } else {
                        Write-Host "Erro no push. Verifique conexao com GitHub" -ForegroundColor Red
                    }
                } else {
                    Write-Host "Push cancelado. Execute manualmente: git push origin $currentBranch" -ForegroundColor Yellow
                }
            } else {
                Write-Host "Erro no commit" -ForegroundColor Red
            }
        } else {
            Write-Host "Commit cancelado" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Nenhum arquivo foi preparado para commit" -ForegroundColor Yellow
    }
} else {
    Write-Host "Repositorio esta limpo - nenhuma mudanca para commit" -ForegroundColor Green
}

Write-Host ""
Write-Host "Status final do repositorio:" -ForegroundColor Cyan
git status --short
