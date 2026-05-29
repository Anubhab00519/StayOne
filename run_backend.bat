@echo off
title StayOne Backend
echo ================================================
echo  StayOne Backend - Restart
echo ================================================
echo.

set PYTHON=C:\Users\User\AppData\Local\Python\bin\python.exe
set PROJECT=C:\Users\User\OneDrive\Desktop\Anubhab\New folder\stayone\backend

cd /d "%PROJECT%"
call venv\Scripts\activate.bat

echo [1/2] Installing python-multipart...
pip install python-multipart --quiet
echo Done.

echo.
echo [2/2] Starting FastAPI backend on http://localhost:8000 ...
echo       API docs at http://localhost:8000/docs
echo       Press Ctrl+C to stop.
echo.
uvicorn main:app --reload --port 8000 --host 0.0.0.0

pause
