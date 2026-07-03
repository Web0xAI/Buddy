<#
.SYNOPSIS
Checks the Windows environment for Hermes ESP32 Face prerequisites.

.DESCRIPTION
This script checks for Git, Python, and ESP-IDF installations.
It does NOT make destructive changes. It only reports missing dependencies.
#>

Write-Host "Checking Hermes ESP32 Face Build Environment..." -ForegroundColor Cyan

# 1. Check Git
try {
    $gitVer = git --version
    Write-Host "[OK] Git found: $gitVer" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Git not found. Please install Git for Windows." -ForegroundColor Yellow
}

# 2. Check Python
try {
    $pyVer = python --version
    Write-Host "[OK] Python found: $pyVer" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Python not found. ESP-IDF requires Python 3.8+." -ForegroundColor Yellow
}

# 3. Check ESP-IDF
if ($env:IDF_PATH) {
    Write-Host "[OK] ESP-IDF found at: $($env:IDF_PATH)" -ForegroundColor Green
} else {
    Write-Host "[WARNING] ESP-IDF not detected in environment variables." -ForegroundColor Yellow
    Write-Host "If you installed ESP-IDF, please run the 'ESP-IDF Command Prompt' or export its environment." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup Check Complete. If warnings appear, please resolve them before building." -ForegroundColor Cyan
