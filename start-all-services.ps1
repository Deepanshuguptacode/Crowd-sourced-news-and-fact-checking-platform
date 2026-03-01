# ====================================================================
# VoxVeritas Platform - Unified Service Launcher
# ====================================================================
# This script starts all three services of the VoxVeritas platform:
# 1. Backend API (Node.js/Express on port 5001)
# 2. Frontend (React/Vite on port 5173)
# 3. Face Recognition System (Python Flask on port 5000)
# ====================================================================

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  VoxVeritas Platform - Starting All Services" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $connection
}

# Function to kill process on a port
function Stop-ProcessOnPort {
    param($Port)
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        foreach ($proc in $processes) {
            Write-Host "  [WARNING] Stopping existing process on port $Port (PID: $proc)" -ForegroundColor Yellow
            Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    }
}

# Check and clear ports if needed
Write-Host "Checking ports..." -ForegroundColor Yellow
$ports = @(5000, 5001, 5173)
foreach ($port in $ports) {
    if (Test-Port $port) {
        Write-Host "  [WARNING] Port $port is in use" -ForegroundColor Yellow
        Stop-ProcessOnPort $port
    }
}

Write-Host ""
Write-Host "[OK] Ports cleared and ready" -ForegroundColor Green
Write-Host ""

# Create log directory
$logDir = "$PSScriptRoot\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# ====================================================================
# Start Backend API (Node.js)
# ====================================================================
Write-Host "[1/3] Starting Backend API (Node.js)..." -ForegroundColor Cyan
Write-Host "   Port: 5001" -ForegroundColor Gray
Write-Host "   Directory: backend\" -ForegroundColor Gray
Write-Host ""

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\backend'; Write-Host 'Backend API Starting...' -ForegroundColor Green; node index.js"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# ====================================================================
# Start Face Recognition System (Python)
# ====================================================================
Write-Host "[2/3] Starting Face Recognition System (Python)..." -ForegroundColor Cyan
Write-Host "   Port: 5000" -ForegroundColor Gray
Write-Host "   Directory: Face-authorization-System\" -ForegroundColor Gray
Write-Host ""

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\Face-authorization-System'; Write-Host 'Face Recognition System Starting...' -ForegroundColor Green; C:\Python312\python.exe deferred-app.py"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# ====================================================================
# Start Frontend (React/Vite)
# ====================================================================
Write-Host "[3/3] Starting Frontend (React/Vite)..." -ForegroundColor Cyan
Write-Host "   Port: 5173" -ForegroundColor Gray
Write-Host "   Directory: frontend\" -ForegroundColor Gray
Write-Host ""

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\frontend'; Write-Host 'Frontend Starting...' -ForegroundColor Green; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 5

# ====================================================================
# Service Status Check
# ====================================================================
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Service Status Check" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="Backend API"; Port=5001; URL="http://localhost:5001"},
    @{Name="Face Recognition"; Port=5000; URL="http://127.0.0.1:5000/api/status"},
    @{Name="Frontend"; Port=5173; URL="http://localhost:5173"}
)

Start-Sleep -Seconds 5  # Give services time to start

foreach ($service in $services) {
    if (Test-Port $service.Port) {
        Write-Host "  [OK] $($service.Name) - Running on port $($service.Port)" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $($service.Name) - NOT running on port $($service.Port)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Access URLs" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend:          http://localhost:5173" -ForegroundColor Green
Write-Host "  Backend API:       http://localhost:5001" -ForegroundColor Green
Write-Host "  Face Recognition:  http://127.0.0.1:5000" -ForegroundColor Green
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[SUCCESS] All services have been launched!" -ForegroundColor Green
Write-Host ""
Write-Host "Tip: Three separate PowerShell windows are now running:" -ForegroundColor Yellow
Write-Host "   1. Backend API (Node.js)" -ForegroundColor Gray
Write-Host "   2. Face Recognition System (Python)" -ForegroundColor Gray
Write-Host "   3. Frontend (React/Vite)" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "   Close each PowerShell window or press Ctrl+C in each" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit this launcher window..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
