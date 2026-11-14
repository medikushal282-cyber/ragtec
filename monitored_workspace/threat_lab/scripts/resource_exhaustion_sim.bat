@echo off
echo [RAGSEC STORAGE EXHAUSTION SIMULATOR] Started TestID=%1
for /L %%i in (1,1,4) do (
    echo [STORAGE PRESSURE %%i] Writing 64KB bounded block...
    powershell -NoProfile -Command "Set-Content -Path '%~dp0..\pressure_block_%%i_%1.tmp' -Value ('RAGSEC_BOUNDED_PRESSURE_PADDING_X' * 2048)"
    ping 127.0.0.1 -n 2 >nul
)
echo [RAGSEC STORAGE EXHAUSTION SIMULATOR] Finished.
