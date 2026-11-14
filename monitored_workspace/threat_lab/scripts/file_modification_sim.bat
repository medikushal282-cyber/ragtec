@echo off
echo [RAGSEC FIM CANARY TAMPER SIMULATOR] Started TestID=%1
echo Step 1: Creating canary target...
echo CANARY_DATA_INITIAL_STATE_FOR_%1 > "%~dp0..\fim_canary_target_%1.dat"
ping 127.0.0.1 -n 2 >nul
echo Step 2: Modifying canary target...
echo CANARY_DATA_TAMPERED_STATE_T1486 >> "%~dp0..\fim_canary_target_%1.dat"
ping 127.0.0.1 -n 2 >nul
echo Step 3: Deleting canary target...
del "%~dp0..\fim_canary_target_%1.dat"
echo [RAGSEC FIM CANARY TAMPER SIMULATOR] Finished.
