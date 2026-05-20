@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Starting Rider Garage dev server...
echo.
start http://localhost:3000
npm run dev
pause
