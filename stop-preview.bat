@echo off
setlocal EnableExtensions
set "PORT=4173"
set "FOUND="

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  set "FOUND=1"
  echo Stopping preview server PID %%P on port %PORT%...
  taskkill /PID %%P /F >nul 2>nul
)

if not defined FOUND (
  echo No preview server found on port %PORT%.
)

endlocal
