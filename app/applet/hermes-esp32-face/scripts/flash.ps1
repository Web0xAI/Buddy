<#
.SYNOPSIS
Flashes the compiled firmware to the ESP32.

.PARAMETER COMPort
The COM port where the ESP32 is connected (e.g., COM3).

.PARAMETER Target
The ESP-IDF target (default is esp32s3).
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$COMPort,
    
    [string]$Target = "esp32s3"
)

Write-Host "Flashing Hermes ESP32 Face to $COMPort (Target: $Target)..." -ForegroundColor Cyan

if (-not $env:IDF_PATH) {
    Write-Host "[ERROR] ESP-IDF not found. Please run this in the ESP-IDF Command Prompt." -ForegroundColor Red
    exit 1
}

$firmwareDir = Join-Path $PSScriptRoot "..\firmware\xiaozhi"

Set-Location $firmwareDir

Write-Host "Running: idf.py -p $COMPort flash" -ForegroundColor Yellow
idf.py -p $COMPort flash

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Flashing complete!" -ForegroundColor Green
    Write-Host "Next Steps: Run .\scripts\serial-monitor.ps1 -COMPort $COMPort to view logs and test commands." -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Flashing failed. Check the COM port, ensure the board is plugged in, and no other terminal is using it." -ForegroundColor Red
}
