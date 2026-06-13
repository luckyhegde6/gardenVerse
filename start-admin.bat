@echo off
cd /d F:\Local_git\gardenVerse\packages\admin
echo Starting admin API on port 3000...
npx next dev
if %ERRORLEVEL% neq 0 (
    echo ERROR: Admin API failed to start with exit code %ERRORLEVEL%
)
pause
