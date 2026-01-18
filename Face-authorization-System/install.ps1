# Quick Installation Script for Face Authorization System

# Windows PowerShell Script
# Run this script as Administrator

Write-Host "Installing Face Authorization System..." -ForegroundColor Green

# Check Python installation
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found: $pythonVersion" -ForegroundColor Green
    
    # Check if Python version is compatible (3.9-3.11)
    if ($pythonVersion -match "Python 3\.(9|10|11)") {
        Write-Host "✅ Python version is compatible" -ForegroundColor Green
    } else {
        Write-Host "❌ Python 3.9-3.11 required. Please install from python.org" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Python not found. Please install Python 3.9-3.11 from python.org" -ForegroundColor Red
    exit 1
}

# Check MongoDB
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoStatus = mongosh --eval "db.runCommand('ping')" 2>&1
    if ($mongoStatus -match "ok") {
        Write-Host "✅ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "❌ MongoDB not running. Please start MongoDB service" -ForegroundColor Red
        Write-Host "Install from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ MongoDB not installed. Please install MongoDB Community Server" -ForegroundColor Red
    Write-Host "Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
}

# Create virtual environment
Write-Host "Creating virtual environment..." -ForegroundColor Yellow
python -m venv .venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install requirements
Write-Host "Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
pip install -r requirements.txt

# Check installation
Write-Host "Verifying installation..." -ForegroundColor Yellow
$packages = @("flask", "opencv-python", "insightface", "pymongo")

foreach ($package in $packages) {
    try {
        $result = pip show $package 2>&1
        if ($result -match "Name: $package") {
            Write-Host "✅ $package installed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ $package installation failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $package installation failed" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Installation Complete!" -ForegroundColor Green
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host "1. Ensure MongoDB is running" -ForegroundColor White
Write-Host "2. Run: python app.py" -ForegroundColor White
Write-Host "3. Open browser: http://localhost:5000" -ForegroundColor White

Write-Host "`n📚 For detailed instructions, see SETUP_GUIDE.md" -ForegroundColor Cyan
