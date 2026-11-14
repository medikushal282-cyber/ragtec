@echo off
echo [RAGSEC COMBINED MULTI-SIGNAL SIMULATOR] Started TestID=%1
echo Multi-Signal 1: Dropping shadow copy deleter script...
echo vssadmin delete shadows /all /quiet > "%~dp0..\combo_shadow_deleter_%1.bat"
echo Multi-Signal 2: Spawning child execution...
start /b "" powershell -NoProfile -Command "Start-Sleep -Seconds 3; Write-Output '[CHILD DELETER PRECURSOR T1486] Executing for %1'"
ping 127.0.0.1 -n 3 >nul
echo [RAGSEC COMBINED MULTI-SIGNAL SIMULATOR] Finished.
