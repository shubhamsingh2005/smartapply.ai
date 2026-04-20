@echo off
title SmartApply.ai - Launcher
color 0A

echo ============================================================
echo   SmartApply.ai - Starting Up
echo ============================================================
echo.

:: --- Pre-flight Checks ---
echo [1/6] Checking for required dependencies...

if exist "%~dp0backend\venv" goto check_node
echo [ERROR] Backend virtual environment (venv) not found!
echo         Please run: cd backend and python -m venv venv
pause
exit /b

:check_node
if exist "%~dp0frontend\node_modules" goto check_ports
echo [ERROR] Frontend node_modules not found!
echo         Please run: cd frontend and npm install
pause
exit /b

:check_ports
:: --- Kill anything already running on the required ports ---
echo [2/6] Cleaning up ports 8000 (Backend) and 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 1 >nul

:: --- Start the Backend ---
echo [3/6] Starting Backend (FastAPI on port 8000)...
start "SmartApply-Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level debug"

:: --- Start the Frontend ---
echo [4/6] Starting Frontend (Vite on port 5173)...
start "SmartApply-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: --- Wait for Backend to be truly ready ---
echo [5/6] Waiting for Backend to be ready...
echo       (Checking http://127.0.0.1:8000)

set /a attempts=0
set /a max_attempts=40

:wait_loop
set /a attempts+=1
if %attempts% gtr %max_attempts% goto wait_timeout

:: Check if port 8000 is listening on 127.0.0.1
netstat -an 2>nul | find "127.0.0.1:8000" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 goto backend_ready

echo   [%attempts%/%max_attempts%] Waiting for backend...
timeout /t 2 >nul
goto wait_loop

:wait_timeout
echo.
echo [WARNING] Backend took too long to start.
echo           The browser will open, but you may need to refresh.
goto open_browser

:backend_ready
echo   [OK] Backend is listening!
timeout /t 2 >nul

:open_browser
echo [6/6] Opening SmartApply.ai...
start http://localhost:5173

echo.
echo ============================================================
echo   SmartApply.ai is running!
echo   Frontend : http://localhost:5173
echo   Backend  : http://127.0.0.1:8000
echo   API Docs : http://127.0.0.1:8000/docs
echo ============================================================
echo.
echo   Press any key to EXIT this launcher window.
echo   The Backend and Frontend windows will keep running.
echo ============================================================
pause >nul

