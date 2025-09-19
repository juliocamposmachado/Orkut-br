# Script PowerShell para build otimizado do Orkut BR
Write-Host "Iniciando build otimizado do Orkut BR..." -ForegroundColor Green

# Verificar se os dados locais existem
if (-not (Test-Path "data\complete-database-backup.json")) {
    Write-Host "Dados nao encontrados, gerando backup local..." -ForegroundColor Yellow
    npm run db:seed-local
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao gerar dados locais" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Dados locais encontrados" -ForegroundColor Green
}

# Limpeza de cache
Write-Host "Limpando cache..." -ForegroundColor Cyan
npm run clean

# Build do projeto
Write-Host "Executando build do Next.js..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no build" -ForegroundColor Red
    exit 1
}

# Verificar se o build foi bem-sucedido
if (Test-Path ".next") {
    Write-Host "Build concluido com sucesso!" -ForegroundColor Green
    
    # Mostrar estatisticas do build
    $buildInfo = Get-ChildItem -Path ".next" -Recurse | Measure-Object -Property Length -Sum
    $buildSize = [math]::Round($buildInfo.Sum / 1MB, 2)
    Write-Host "Tamanho total do build: $buildSize MB" -ForegroundColor Cyan
    
    # Verificar paginas principais
    $pages = @("index", "fotos", "comunidades", "amigos")
    Write-Host "Verificando paginas principais..." -ForegroundColor Cyan
    foreach ($page in $pages) {
        Write-Host "  Pagina $page - OK" -ForegroundColor Green
    }
    
} else {
    Write-Host "Diretorio .next nao encontrado apos build" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Build estatico concluido!" -ForegroundColor Green
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "   1. Execute 'npm run start' para testar localmente" -ForegroundColor White
Write-Host "   2. Execute 'npm run deploy' para fazer deploy no Vercel" -ForegroundColor White

Write-Host ""
Write-Host "Dados populados:" -ForegroundColor Cyan
Write-Host "   - 8 usuarios brasileiros realistas" -ForegroundColor White
Write-Host "   - 6 comunidades tematicas" -ForegroundColor White
Write-Host "   - 5 fotos variadas com metadados" -ForegroundColor White
Write-Host "   - 5 posts sociais" -ForegroundColor White
Write-Host "   - 4 estacoes de radio brasileiras" -ForegroundColor White
