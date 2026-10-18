@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
 echo Install Node.js 24 LTS from https://nodejs.org/en/download then reopen this launcher.
 pause
 exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0]) < 24)process.exit(1)"
if errorlevel 1 (
 echo Node.js 24 or later is required. Install Node.js 24 LTS and try again.
 pause
 exit /b 1
)
if not exist "node_modules\telegram\index.js" (
 echo Installing Telegram connection support. This first launch needs internet access.
 call npm ci --omit=dev --ignore-scripts --no-audit --no-fund
 if errorlevel 1 (
  echo Installation failed. Check your internet connection and reopen this launcher.
  pause
  exit /b 1
 )
)
:start_radar
echo Keep this window open and prevent this PC from sleeping.
node local-trading.mjs --open --telegram-setup
if errorlevel 23 if not errorlevel 24 (
 pause
 goto start_radar
)
pause
