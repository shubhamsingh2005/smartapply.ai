@echo off
title SmartApply.ai - Launcher
color 0A

echo ============================================================
echo   SmartApply.ai - Starting Up
echo ============================================================
echo.

:: --- Kill anything already running on the required ports ---
echo [1/5] Cleaning up existing processes on ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 1 >nul

:: --- Start the Backend ---
echo [2/5] Starting Backend (FastAPI on port 8000)...
start "SmartApply-Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: --- Start the Frontend ---
echo [3/5] Starting Frontend (Vite on port 5173)...
start "SmartApply-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: --- Wait for Backend to be truly ready ---
echo [4/5] Waiting for Backend to be ready...
echo       (This may take 10-20 seconds on first startup)
echo.

set /a attempts=0
set /a max_attempts=30

:wait_loop
set /a attempts+=1
if %attempts% gtr %max_attempts% (
    echo.
    echo [WARNING] Backend took too long to start.
    echo          Opening browser anyway. Try refreshing in a few seconds.
    goto open_browser
)

:: Check if port 8000 is listening
netstat -an 2>nul | find ":8000" | find "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo   Attempt %attempts%/%max_attempts% - Backend not ready yet, waiting 2s...
    timeout /t 2 >nul
    goto wait_loop
)

:: Extra 2s buffer after port is open to let uvicorn fully initialize
echo   Backend port is open! Giving it 2s to fully initialize...
timeout /t 2 >nul

:open_browser
echo [5/5] Opening SmartApply.ai in your browser...
start http://localhost:5173

echo.
echo ============================================================
echo   SmartApply.ai is running!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo ============================================================
echo.
echo   Press any key to EXIT this launcher window.
echo   The Backend and Frontend windows will keep running.
echo ============================================================
pause >nul
