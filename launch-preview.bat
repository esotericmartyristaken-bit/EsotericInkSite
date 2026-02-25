@echo off
setlocal EnableExtensions
set "PORT=4173"
set "URL=http://localhost:%PORT%/index.html?v=%RANDOM%%RANDOM%"
set "RUNNING=0"

call :check_running
if "%RUNNING%"=="1" goto open_browser

echo Starting Esoteric Ink preview server on port %PORT%...
where py >nul 2>nul
if not errorlevel 1 (
  start "EsotericInk Preview Server" cmd /k "cd /d ""%~dp0"" && py dev_server.py"
  goto wait_for_server
)

where python >nul 2>nul
if not errorlevel 1 (
  start "EsotericInk Preview Server" cmd /k "cd /d ""%~dp0"" && python dev_server.py"
  goto wait_for_server
)

echo Python was not found (py/python). Install Python to use local preview.
pause
endlocal
exit /b 1

:wait_for_server
set "RETRIES=8"
:wait_loop
timeout /t 1 >nul
call :check_running
if "%RUNNING%"=="1" goto open_browser
set /a RETRIES-=1
if %RETRIES% GTR 0 goto wait_loop
echo Server process started, but port %PORT% was not detected yet.
echo If browser shows an error, wait 2-3 seconds and refresh.

:open_browser
start "" "%URL%"
if errorlevel 1 (
  explorer "%URL%"
)
echo Preview ready: %URL%
echo Keep coding and just refresh the browser tab after changes.
echo Use stop-preview.bat to stop the local preview server.
endlocal
exit /b 0

:check_running
set "RUNNING=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  set "RUNNING=1"
)
exit /b 0
