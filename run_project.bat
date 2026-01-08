@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    BigData Project Starter
echo ==========================================

:: Check for Backend (pybig)
if not exist "pybig\main.py" (
    echo [ERROR] pybig\main.py not found!
    echo Please make sure you are running this from the project root.
    pause
    exit /b
)

:: Check for Frontend (big_data)
if not exist "big_data\package.json" (
    echo [ERROR] big_data\package.json not found!
    echo Please make sure you are running this from the project root.
    pause
    exit /b
)

:: Install frontend dependencies if missing
if not exist "big_data\node_modules" (
    echo [INFO] node_modules not found in big_data. Installing dependencies...
    pushd big_data
    call npm install
    popd
)

echo [INFO] Starting Backend (pybig) in a new window...
:: Using start to run in a separate window so logs don't mix
start "BigData Backend (Crawler & Clustering)" cmd /k "cd /d pybig && python main.py"

echo [INFO] Starting Frontend (big_data) in a new window...
start "BigData Frontend (Next.js)" cmd /k "cd /d big_data && npm run dev"

echo ==========================================
echo    All services are starting!
echo    - Backend: Check the "BigData Backend" window for logs.
echo    - Frontend: Check the "BigData Frontend" window.
echo    - URL: http://localhost:3000 (usually)
echo ==========================================
echo Press any key to close this starter window.
pause > nul
