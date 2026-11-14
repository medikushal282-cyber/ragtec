@echo off
title RAGSec - Launching Autonomous SOC Platform
echo ========================================================
echo          Starting RAGSec Threat Intelligence
echo ========================================================
echo.

set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

echo [1/3] Starting Python FastAPI Threat Intelligence Core (Port 8000)...
start "RAGSec Python AI Core" /d "%PROJECT_ROOT%ragsec\backend" cmd /k "python app.py"

echo [2/3] Starting Node.js / tRPC Gateway & Web UI (Port 3000)...
start "RAGSec Web & API Gateway" /d "%PROJECT_ROOT%ragsec\ragsec-soc" cmd /k "set NODE_ENV=production&& node dist/index.js"

echo.
echo [3/3] Opening SOC Analyst Portal in your default browser...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================================
echo  RAGSec Autonomous SOC is running!
echo  - Python Core API : http://127.0.0.1:8000
echo  - Full-Stack UI   : http://localhost:3000
echo  - API Docs (Swagger): http://127.0.0.1:8000/docs
echo ========================================================
echo.
pause
