@echo off
title StayOne Frontend
echo ================================================
echo  StayOne Frontend Setup ^& Launch
echo ================================================
echo.

cd /d "C:\Users\User\OneDrive\Desktop\Anubhab\New folder\stayone\frontend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/2] Installing npm packages...
    npm install
    if errorlevel 1 (
        echo ERROR: npm install failed. Make sure Node.js is installed.
        pause
        exit /b 1
    )
    echo Done.
) else (
    echo [1/2] node_modules already exists. Skipping install.
)

echo.
echo [2/2] Starting React dev server on http://localhost:5173 ...
echo       Press Ctrl+C to stop.
echo.
npm run dev

pause
