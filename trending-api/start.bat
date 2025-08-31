@echo off
echo 🔥 Orkut Trending Topics API
echo =============================

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Por favor, instale Node.js primeiro.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

REM Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas com sucesso
    echo.
)

echo 🚀 Iniciando API de Trending Topics...
echo 📍 A API estará disponível em: http://localhost:3001
echo 📊 Status da API: http://localhost:3001/api/status
echo 🔥 Trending Topics: http://localhost:3001/api/trending
echo.
echo ⚠️  Pressione Ctrl+C para parar o servidor
echo.

REM Iniciar o servidor
call npm start
