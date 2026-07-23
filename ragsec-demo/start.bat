@echo off
echo Starting Backend...
start "Backend Server" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn main:app --reload"

echo Starting Frontend...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo App started! 
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8000
pause
