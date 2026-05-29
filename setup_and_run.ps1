$ErrorActionPreference = "Continue"
$PYTHON = "C:\Users\User\AppData\Local\Python\bin\python.exe"
$BACKEND = "C:\Users\User\OneDrive\Desktop\Anubhab\New folder\stayone\backend"
$FRONTEND = "C:\Users\User\OneDrive\Desktop\Anubhab\New folder\stayone\frontend"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  StayOne - Full Setup & Launch" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── BACKEND ───────────────────────────────────────────────────────────────────
Write-Host "[BACKEND] Setting up..." -ForegroundColor Yellow
Set-Location $BACKEND

if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "[BACKEND] Creating virtual environment..." -ForegroundColor Gray
    & $PYTHON -m venv venv
} else {
    Write-Host "[BACKEND] venv already exists." -ForegroundColor Gray
}

Write-Host "[BACKEND] Installing Python dependencies..." -ForegroundColor Gray
& ".\venv\Scripts\pip.exe" install -r requirements.txt --quiet

Write-Host "[BACKEND] Starting FastAPI on http://localhost:8000 ..." -ForegroundColor Green
$backendJob = Start-Process -FilePath ".\venv\Scripts\uvicorn.exe" `
    -ArgumentList "main:app", "--reload", "--port", "8000", "--host", "0.0.0.0" `
    -WorkingDirectory $BACKEND `
    -PassThru `
    -NoNewWindow

Write-Host "[BACKEND] PID: $($backendJob.Id)" -ForegroundColor Gray
Start-Sleep -Seconds 3

# ── FRONTEND ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[FRONTEND] Setting up..." -ForegroundColor Yellow
Set-Location $FRONTEND

if (-not (Test-Path "node_modules")) {
    Write-Host "[FRONTEND] Running npm install..." -ForegroundColor Gray
    npm install
} else {
    Write-Host "[FRONTEND] node_modules already exists." -ForegroundColor Gray
}

Write-Host "[FRONTEND] Starting React on http://localhost:5173 ..." -ForegroundColor Green
$frontendJob = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev" `
    -WorkingDirectory $FRONTEND `
    -PassThru `
    -NoNewWindow

Write-Host "[FRONTEND] PID: $($frontendJob.Id)" -ForegroundColor Gray
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Both services launched!" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000/docs" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to stop both services..." -ForegroundColor Red
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "Stopping services..."
Stop-Process -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontendJob.Id -Force -ErrorAction SilentlyContinue
Write-Host "Done."
