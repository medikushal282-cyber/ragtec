@echo off
echo [RAGSEC REPLICATION SIMULATOR] Started TestID=%1
for /L %%i in (1,1,4) do (
    echo [GENERATION %%i] Writing replica marker...
    echo [RAGSEC-REPLICA-T1080] Gen=%%i TestID=%1 Time=%time% > "%~dp0..\tlab_replica_gen_%%i_%1.marker"
    ping 127.0.0.1 -n 2 >nul
)
echo [RAGSEC REPLICATION SIMULATOR] Finished.
