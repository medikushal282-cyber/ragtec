@echo off
echo Syncing with GitHub...

:: Add all changes
git add .

:: Commit with timestamp
git commit -m "Sync: %date% %time%"

:: Push to main branch
git push origin main

echo.
echo Sync Complete!
pause
