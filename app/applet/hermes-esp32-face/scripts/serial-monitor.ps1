<#
.SYNOPSIS
Opens the ESP-IDF serial monitor for the given COM port.

.PARAMETER COMPort
The COM port where the ESP32 is connected (e.g., COM3).
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$COMPort
)

Write-Host "Opening Serial Monitor on $COMPort..." -ForegroundColor Cyan
Write-Host "Use Ctrl+] to exit the monitor." -ForegroundColor Yellow

if (-not $env:IDF_PATH) {
    Write-Host "[ERROR] ESP-IDF not found. Please run this in the ESP-IDF Command Prompt." -ForegroundColor Red
    exit 1
}

$firmwareDir = Join-Path $PSScriptRoot "..\firmware\xiaozhi"
Set-Location $firmwareDir

idf.py -p $COMPort monitor
