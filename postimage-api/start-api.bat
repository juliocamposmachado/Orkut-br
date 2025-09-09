@echo off
title PostImage API Server
color 0A
echo.
echo =========================================
echo   🚀 PostImage.org API Server
echo =========================================
echo.
echo Iniciando servidor na porta 3001...
echo Pressione Ctrl+C para parar o servidor
echo.

cd /d "%~dp0"
npm start

pause
