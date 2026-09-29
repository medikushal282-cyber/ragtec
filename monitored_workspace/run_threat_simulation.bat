@echo off
title RAGSec SOC Telemetry Simulation Harness
color 0A
echo ============================================================
echo   [RAGSEC SIMULATION] Active Incident Generator for SOC Demo
echo ============================================================
echo.
echo [1/3] Generating simulated telemetry activity in monitored_workspace...
echo [SIMULATED_ATTACK_TELEMETRY] > "%~dp0ransomware_simulation.txt"
echo Timestamp: %DATE% %TIME% >> "%~dp0ransomware_simulation.txt"
echo MITRE ATT^&CK: T1486 Data Encrypted for Impact >> "%~dp0ransomware_simulation.txt"
echo IOC: .raglock extension signature >> "%~dp0ransomware_simulation.txt"
echo.
echo [2/3] Telemetry written to disk. 
echo       - Monitored File: ransomware_simulation.txt
echo       - Status: CREATED / MODIFIED
echo.
echo [3/3] Open your RAGSec Web Dashboard:
echo       1. Go to "FIM Monitor" or "Incident Triage"
echo       2. See the detected event with high risk score
echo       3. Click "Quarantine" to isolate the file into .quarantine/
echo       4. Click "Recover File" to restore it back here
echo.
echo ============================================================
echo   Simulation Complete. Press any key to exit.
echo ============================================================
pause > nul
