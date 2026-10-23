@echo off
setlocal
cd /d "%~dp0"
node --version >nul 2>nul
if errorlevel 1 goto no_node
node server.mjs
if errorlevel 1 pause
goto end
:no_node
echo.
echo Node.js was not found.
echo Install Node.js 18 or newer, then run this file again.
echo https://nodejs.org/
echo.
pause
:end
endlocal
