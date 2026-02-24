@echo off
setlocal
set PORT=4173
start "" "http://localhost:%PORT%/index.html"
where py >nul 2>nul
if %ERRORLEVEL%==0 (
  py -m http.server %PORT%
) else (
  python -m http.server %PORT%
)
endlocal
