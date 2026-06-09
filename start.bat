@echo off
title Rider Garage - Dev Server
echo.
echo  ========================================
echo    RIDER GARAGE - Starting Dev Server
echo  ========================================
echo.

cd /d "%~dp0"

echo  Installing dependencies...
call npm install

echo.
echo  Starting Next.js development server...
echo  Opening browser at http://localhost:3000
echo.

start http://localhost:3000
npm run dev
