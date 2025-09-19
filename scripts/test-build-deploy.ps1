# Script de teste de build para CI/CD do Vercel
# Garante que o build funciona antes do deploy automatico

Write-Host "=== TESTE DE BUILD PARA DEPLOY AUTOMATICO ===" -ForegroundColor Magenta
Write-Host ""

$ErrorActionPreference = "Stop"
$startTime = Get-Date

# Funcao para log com timestamp
function Write-Log {
    param($Message, $Color = "White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

try {
    # 1. Verificar estrutura do projeto
    Write-Log "Verificando estrutura do projeto..." "Cyan"
    
    if (-not (Test-Path "package.json")) {
        throw "package.json nao encontrado!"
    }
    
    if (-not (Test-Path "next.config.js")) {
        throw "next.config.js nao encontrado!"
    }
    
    Write-Log "Estrutura do projeto OK" "Green"

    # 2. Verificar e garantir dados locais
    Write-Log "Verificando dados locais..." "Cyan"
    
    if (-not (Test-Path "data")) {
        New-Item -ItemType Directory -Path "data" -Force | Out-Null
    }
    
    if (-not (Test-Path "data\complete-database-backup.json")) {
        Write-Log "Dados nao encontrados, gerando..." "Yellow"
        npm run db:seed-local
        if ($LASTEXITCODE -ne 0) {
            throw "Erro ao gerar dados locais"
        }
    }
    
    Write-Log "Dados locais verificados" "Green"

    # 3. Limpar cache e node_modules se necessario
    Write-Log "Limpando cache..." "Cyan"
    
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next"
    }
    
    if (Test-Path "node_modules\.cache") {
        Remove-Item -Recurse -Force "node_modules\.cache"
    }
    
    Write-Log "Cache limpo" "Green"

    # 4. Verificar dependencias
    Write-Log "Verificando dependencias..." "Cyan"
    
    if (-not (Test-Path "node_modules")) {
        Write-Log "Instalando dependencias..." "Yellow"
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Erro ao instalar dependencias"
        }
    }
    
    Write-Log "Dependencias OK" "Green"

    # 5. Executar build de teste
    Write-Log "Executando build de teste..." "Cyan"
    
    $env:NODE_ENV = "production"
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build falhou! Verifique os erros acima."
    }
    
    Write-Log "Build executado com sucesso" "Green"

    # 6. Verificar arquivos gerados
    Write-Log "Verificando arquivos gerados..." "Cyan"
    
    if (-not (Test-Path ".next")) {
        throw "Diretorio .next nao foi criado!"
    }
    
    if (-not (Test-Path ".next\static")) {
        throw "Arquivos estaticos nao foram gerados!"
    }
    
    # Contar arquivos gerados
    $staticFiles = Get-ChildItem -Path ".next\static" -Recurse -File | Measure-Object
    $serverFiles = Get-ChildItem -Path ".next\server" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object
    
    Write-Log "Arquivos estaticos: $($staticFiles.Count)" "Green"
    Write-Log "Arquivos servidor: $($serverFiles.Count)" "Green"

    # 7. Testar start do servidor
    Write-Log "Testando inicio do servidor..." "Cyan"
    
    $serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "start" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 10
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Log "Servidor respondeu corretamente (200 OK)" "Green"
        } else {
            Write-Log "Servidor retornou status: $($response.StatusCode)" "Yellow"
        }
    } catch {
        Write-Log "Aviso: Nao foi possivel testar servidor local" "Yellow"
    } finally {
        if ($serverProcess -and !$serverProcess.HasExited) {
            Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
        }
    }

    # 8. Verificar tamanho do build
    Write-Log "Verificando tamanho do build..." "Cyan"
    
    $buildInfo = Get-ChildItem -Path ".next" -Recurse -File | Measure-Object -Property Length -Sum
    $buildSizeMB = [math]::Round($buildInfo.Sum / 1MB, 2)
    
    Write-Log "Tamanho total: $buildSizeMB MB" "Green"
    
    if ($buildSizeMB -gt 1000) {
        Write-Log "Aviso: Build muito grande ($buildSizeMB MB)" "Yellow"
    }

    # 9. Verificar arquivos essenciais para Vercel
    Write-Log "Verificando compatibilidade com Vercel..." "Cyan"
    
    $essentialFiles = @(
        "package.json",
        "next.config.js",
        ".next/static",
        ".next/server"
    )
    
    foreach ($file in $essentialFiles) {
        if (-not (Test-Path $file)) {
            throw "Arquivo essencial nao encontrado: $file"
        }
    }
    
    Write-Log "Compatibilidade com Vercel OK" "Green"

    # 10. Resumo final
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Write-Host ""
    Write-Log "=== TESTE CONCLUIDO COM SUCESSO ===" "Green"
    Write-Log "Tempo total: $($duration.TotalMinutes.ToString('F1')) minutos" "Cyan"
    Write-Log "Build size: $buildSizeMB MB" "Cyan"
    Write-Log "Arquivos estaticos: $($staticFiles.Count)" "Cyan"
    Write-Host ""
    Write-Log "✅ Projeto pronto para deploy automatico no Vercel!" "Green"
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Log "❌ ERRO NO TESTE DE BUILD:" "Red"
    Write-Log $_.Exception.Message "Red"
    Write-Host ""
    Write-Log "Executar manualmente para debug:" "Yellow"
    Write-Log "1. npm run clean" "White"
    Write-Log "2. npm install" "White"
    Write-Log "3. npm run db:seed-local" "White"
    Write-Log "4. npm run build" "White"
    Write-Host ""
    exit 1
}
