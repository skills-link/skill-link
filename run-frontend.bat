@echo off
REM Start frontend dev server (Windows). Run this from the repository root.
pushd "%~dp0\skill-link frontend"
IF NOT EXIST package.json (
  echo Frontend folder not found: %CD%
  pause
  exit /b 1
)
echo Installing frontend dependencies (skip if already installed)...
npm.cmd install
echo Starting frontend dev server...
npm.cmd run dev
popd
