@echo off
title Branching Routes
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install it from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo First run: installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Starting Branching Routes. Close this window to stop the app.
call npm run dev -- --open
pause
