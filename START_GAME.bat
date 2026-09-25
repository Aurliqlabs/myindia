@echo off
title REPUBLIC 543 - Local Game Server
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is required to run REPUBLIC: 543 locally.
  echo Install the current LTS version of Node.js, then double-click START_GAME.bat again.
  echo.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)

echo.
echo ============================================
echo            REPUBLIC: 543
echo ============================================
echo.
echo Starting local game server...
echo Your browser will open at:
echo http://localhost:3000
echo.
echo Keep this window open while playing.
echo Press Ctrl+C to stop the server.
echo.

start "" "http://localhost:3000"
node scripts\dev-server.mjs

echo.
echo Server stopped.
pause
