@echo off
setlocal enabledelayedexpansion

echo ==========================================================
echo   PhysioDesk - CORS / 404 / login fix
echo ==========================================================
echo.

set "SRC=%~dp0"
if "%SRC:~-1%"=="\" set "SRC=%SRC:~0,-1%"

REM ---- locate the repo -------------------------------------------------
set "REPO="
if not "%~1"=="" set "REPO=%~1"

if not defined REPO (
  if exist "%SRC%\..\backend\app\main.py" (
    for %%I in ("%SRC%\..") do set "REPO=%%~fI"
  )
)

if not defined REPO (
  if exist "%CD%\backend\app\main.py" set "REPO=%CD%"
)

if not defined REPO goto norepo
if not exist "%REPO%\backend\app\main.py" goto badrepo
if not exist "%REPO%\frontend\package.json" goto badrepo

echo   Repo:   %REPO%
echo   Source: %SRC%
echo.

REM ---- back up whatever we are about to overwrite ----------------------
set "BACKUP=%REPO%\_fix-backup-%RANDOM%"
md "%BACKUP%\backend\app\core" 2>nul
md "%BACKUP%\frontend\src\lib" 2>nul
md "%BACKUP%\frontend\src\context" 2>nul

echo   Backup: %BACKUP%
echo.

call :backup "backend\app\main.py"
call :backup "backend\app\core\config.py"
call :backup "backend\.env.example"
call :backup "backend\create_admin.py"
call :backup "frontend\src\lib\api.js"
call :backup "frontend\src\context\AuthContext.js"
call :backup "frontend\.env.example"
call :backup "frontend\.gitignore"

REM ---- apply ------------------------------------------------------------
echo   Applying:
call :apply "backend\app\main.py"
call :apply "backend\app\core\config.py"
call :apply "backend\.env.example"
call :apply "backend\create_admin.py"
call :apply "frontend\src\lib\api.js"
call :apply "frontend\src\context\AuthContext.js"
call :apply "frontend\.env.example"
call :apply "frontend\.gitignore"

if defined FAILED goto failed

echo.
echo ==========================================================
echo   Done. Code changes applied.
echo ==========================================================
echo.
echo   Review them with:   git diff
echo   Undo everything:    copy the files back from
echo                       %BACKUP%
echo   Delete that backup folder before you commit.
echo.
echo   STILL TO DO - these are dashboard settings, not code:
echo.
echo   1. Render  - CORS_ORIGINS = exact frontend URL, NO trailing slash
echo   2. Vercel  - NEXT_PUBLIC_API_URL = the Render API base URL,
echo                then REDEPLOY (the value is baked in at build time)
echo   3. Commit and push so Render and Vercel pick the changes up
echo.
echo   Then verify CORS before opening a browser - the curl command
echo   is in README-CHANGES.md
echo.
pause
exit /b 0

REM ---- subroutines ------------------------------------------------------
:backup
if exist "%REPO%\%~1" copy /y "%REPO%\%~1" "%BACKUP%\%~1" >nul
exit /b 0

:apply
if not exist "%SRC%\%~1" (
  echo     MISSING from fix folder - %~1
  set "FAILED=1"
  exit /b 1
)
copy /y "%SRC%\%~1" "%REPO%\%~1" >nul
if errorlevel 1 (
  echo     FAILED to copy - %~1
  set "FAILED=1"
  exit /b 1
)
echo     ok  %~1
exit /b 0

:norepo
echo   ERROR: could not find the PhysioDesk repo.
echo.
echo   Either extract this folder inside the repo and double-click again,
echo   or pass the repo path:
echo.
echo       apply-fix.bat C:\path\to\PhysioDesk-Patient-Management
echo.
pause
exit /b 1

:badrepo
echo   ERROR: that folder does not look like the PhysioDesk repo:
echo       %REPO%
echo.
echo   Expected to find backend\app\main.py and frontend\package.json
echo.
pause
exit /b 1

:failed
echo.
echo   ERROR: some files did not apply. Nothing else was changed.
echo   Originals are in %BACKUP%
echo.
pause
exit /b 1
