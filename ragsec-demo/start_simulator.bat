@echo off
echo Starting CISA KEV Real Data Ingestion...
cd backend
venv\Scripts\python.exe fetch_real_threats.py
pause
