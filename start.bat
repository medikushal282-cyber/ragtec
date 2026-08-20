@echo off
title RAGSec - Launching SOC Platform
echo ========================================================
echo          Starting RAGSec Threat Intelligence
echo ========================================================
echo.

cd /d "%~dp0\ragsec\ragsec-soc"

echo [1/2] Starting Node.js Full-Stack Application...
set NODE_ENV=development
start "RAGSec Backend API & Frontend UI" cmd /k "pnpm exec tsx watch server/_core/index.ts"

echo.
echo [2/2] Opening SOC Analyst Portal in your default browser...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================================
echo  RAGSec is now running!
echo  - Full-Stack App: http://localhost:3000
echo ========================================================
echo.
pause
