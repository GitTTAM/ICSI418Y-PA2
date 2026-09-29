@echo off
setlocal
title Project startup
set "PROJECT_DIR=%~dp0"

powershell -NoProfile -Command "$listener = Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue; if ($listener) { exit 0 } else { exit 1 }"
if errorlevel 1 start "Project startup - Frontend" /D "%PROJECT_DIR%client" cmd /k "npm.cmd run dev"

powershell -NoProfile -Command "$listener = Get-NetTCPConnection -State Listen -LocalPort 9000 -ErrorAction SilentlyContinue; if ($listener) { exit 0 } else { exit 1 }"
if errorlevel 1 start "Project startup - Backend" /D "%PROJECT_DIR%server" cmd /k "node server.js"

start "" "http://localhost:5173/"
start "" "http://localhost:9000/"

endlocal