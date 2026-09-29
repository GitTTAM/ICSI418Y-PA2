@echo off
setlocal
title Clear platform ports

echo Clearing processes listening on project ports 5173 and 9000...
echo.

powershell.exe -NoProfile -Command "$ports = @(5173, 9000); $listeners = foreach ($port in $ports) { Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object { $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue; [pscustomobject]@{Port=$port; PID=$_.OwningProcess; Process=$process.ProcessName} } }; if (-not $listeners) { Write-Host 'No listeners found on ports 5173 or 9000.'; exit 0 }; $listeners | Sort-Object Port, PID -Unique | Format-Table -AutoSize; $ids = $listeners | Select-Object -ExpandProperty PID -Unique; foreach ($id in $ids) { Stop-Process -Id $id -Force -ErrorAction Stop; Write-Host ('Stopped PID ' + $id) }"
if errorlevel 1 echo A process could not be stopped. Try running this file as administrator.

echo.
pause
endlocal