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
set /p commit_msg="Enter commit message (or press Enter for default timestamped commit): "
if "%commit_msg%"=="" (
    set commit_msg=chore: sync RAGSec clean-slate build %date% %time%
)

echo [3/4] Committing changes with message: "%commit_msg%"
git commit -m "%commit_msg%"

echo.
echo [4/4] Pushing to remote repository...
git push

echo.
echo ========================================================
echo  Git Sync Completed!
echo ========================================================
echo.
pause
