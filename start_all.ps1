# StayOne v6 - Full Platform Launcher

$PythonPath = "c:\Users\User\OneDrive\Desktop\Anubhab\New folder\stayone\backend\venv\Scripts\python.exe"

Write-Host "Starting Backend (Port 8000)..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd backend && `"$PythonPath`" -m pip install -r requirements.txt -q && `"$PythonPath`" -m uvicorn main:app --reload --port 8000"

Write-Host "Starting Mock MakeMyTrip (Port 5173)..." -ForegroundColor Red
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd mock-makemytrip && npm run dev"

Write-Host "Starting Mock Goibibo (Port 5174)..." -ForegroundColor Blue
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd mock-goibibo && npm run dev"

Write-Host "Starting StayOne Dashboard (Port 5175)..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd dashboard && npm run dev"

Write-Host ""
Write-Host "All services starting!" -ForegroundColor Yellow
Write-Host "  MakeMyTrip  -> http://localhost:5173" -ForegroundColor Red
Write-Host "  Goibibo     -> http://localhost:5174" -ForegroundColor Blue
Write-Host "  Dashboard   -> http://localhost:5175" -ForegroundColor Cyan
Write-Host "  Backend API -> http://localhost:8000" -ForegroundColor Green
