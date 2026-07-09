@echo off
REM Start backend server (Windows). Run this from the repository root.
pushd "%~dp0\skill-link backend"
IF NOT EXIST package.json (
  echo Backend folder not found: %CD%
  pause
  exit /b 1
)
echo Installing backend dependencies (skip if already installed)...
npm.cmd install
echo Starting backend server...
node server.js
popd
