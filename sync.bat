@echo off
title RAGSec - Git Auto-Sync
echo ========================================================
echo          Syncing RAGSec Repository with Git
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Git status...
git status

echo.
echo [2/4] Staging changes...
git add .

echo.
echo [3/4] Committing changes...
git commit -m "chore: automated sync for RAGSec %date% %time%"

echo.
echo [4/4] Pushing to remote repository...
git push

echo.
echo ========================================================
echo  Git Sync Completed!
echo ========================================================
echo.
pause
