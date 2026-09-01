@echo off
title RAGSec - Launching SOC Platform
echo ========================================================
echo          Starting RAGSec Threat Intelligence
echo ========================================================
echo.

echo [1/3] Starting Python FastAPI Threat Intelligence Core (Port 8000)...
start "RAGSec Python AI Core" /d "%~dp0ragsec\backend" cmd /k "python app.py"

echo [2/3] Starting Node.js / tRPC Gateway & Web UI (Port 3000)...
start "RAGSec Web & API Gateway" /d "%~dp0ragsec\ragsec-soc" cmd /k "set NODE_ENV=production&& node dist/index.js"

echo.
echo [3/3] Opening SOC Analyst Portal in your default browser...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================================
echo  RAGSec is now running!
echo  - Python Core API : http://localhost:8000
echo  - Full-Stack UI   : http://localhost:3000
echo ========================================================
echo.
pause
