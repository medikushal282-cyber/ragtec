@echo off
echo =========================================
echo Starting RAGSec Enterprise System...
echo =========================================

echo.
echo [1/3] Booting Backend API...
start "Backend Server" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn main:app --reload"

echo.
echo [2/3] Booting Real-time CISA Threat Ingestion...
start "CISA Threat Ingestion" cmd /k "cd backend && timeout /t 3 >nul && venv\Scripts\python.exe fetch_real_threats.py"

echo.
echo [3/3] Booting Frontend Application...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Opening browser...
timeout /t 4 >nul
start http://localhost:5173

echo.
echo All systems go!
echo - Frontend: http://localhost:5173
echo - Backend: http://localhost:8000
echo.
pause
