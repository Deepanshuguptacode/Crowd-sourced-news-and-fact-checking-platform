@echo off
REM ====================================================================
REM VoxVeritas Platform - Unified Service Launcher (Batch Version)
REM ====================================================================
REM This is an alternative to the PowerShell script for users who
REM prefer traditional batch files.
REM ====================================================================

echo.
echo =====================================================================
echo   VoxVeritas Platform - Starting All Services
echo =====================================================================
echo.

REM Start Backend API
echo [1/3] Starting Backend API (Node.js) on port 5001...
start "Backend API (Port 5001)" cmd /k "cd backend && echo Starting Backend API... && node index.js"
timeout /t 3 /nobreak >nul

REM Start Face Recognition System
echo [2/3] Starting Face Recognition System (Python) on port 5000...
start "Face Recognition (Port 5000)" cmd /k "cd Face-authorization-System && echo Starting Face Recognition System... && python deferred-app.py"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [3/3] Starting Frontend (React/Vite) on port 5173...
start "Frontend (Port 5173)" cmd /k "cd frontend && echo Starting Frontend... && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo =====================================================================
echo   All Services Launched!
echo =====================================================================
echo.
echo   Three command windows have been opened:
echo   1. Backend API (Node.js) - Port 5001
echo   2. Face Recognition (Python) - Port 5000
echo   3. Frontend (React/Vite) - Port 5173
echo.
echo   Access URLs:
echo   - Frontend:          http://localhost:5173
echo   - Backend API:       http://localhost:5001
echo   - Face Recognition:  http://127.0.0.1:5000
echo.
echo   To stop services: Close each command window or press Ctrl+C
echo.
echo =====================================================================
echo.
pause
