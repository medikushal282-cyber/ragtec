@echo off
echo [RAGSEC SUSPICIOUS PROCESS SIMULATOR] Started TestID=%1
echo Launching background child beacon process...
start /b "" powershell -NoProfile -Command "Start-Sleep -Seconds 4; Write-Output '[CHILD BEACON T1059] Heartbeat transmitted for %1'"
ping 127.0.0.1 -n 6 >nul
echo [RAGSEC SUSPICIOUS PROCESS SIMULATOR] Finished.
