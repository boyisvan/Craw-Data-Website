@echo off
setlocal ENABLEDELAYEDEXPANSION
chcp 65001 >nul

REM Move to the script directory
pushd %~dp0

echo Checking Node.js and npm...
where node >nul 2>&1 || (
  echo Node.js is not installed. Please install from https://nodejs.org/ and run again.
  pause
  exit /b 1
)
where npm >nul 2>&1 || (
  echo npm is not available. Please ensure Node.js installation includes npm.
  pause
  exit /b 1
)

echo Installing dependencies if needed...
if exist package-lock.json (
  call npm ci --no-audit --no-fund
) else (
  call npm install --no-audit --no-fund
)
if errorlevel 1 (
  echo Failed to install dependencies.
  pause
  exit /b 1
)

echo Starting application...
call npm start

echo.
echo Application exited. Press any key to close.
pause >nul

popd
endlocal

