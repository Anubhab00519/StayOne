@echo off
title StayOne
cd /d "C:\Users\User\OneDrive\Desktop\Anubhab\New folder\stayone\backend"
call venv\Scripts\activate.bat
echo Installing python-multipart...
pip install python-multipart -q
echo Starting backend...
start "StayOne Backend" cmd /k "cd /d "C:\Users\User\OneDrive\Desktop\Anubhab\New folder\stayone\backend" && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"
timeout /t 4 /nobreak
echo Starting frontend...
start "StayOne Frontend" cmd /k "cd /d "C:\Users\User\OneDrive\Desktop\Anubhab\New folder\stayone\frontend" && npm run dev"
echo.
echo Both services launched in separate windows!
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
pause
