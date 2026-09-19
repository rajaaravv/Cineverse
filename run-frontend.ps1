# Script to start StreamHub Frontend in dev mode
Write-Host "Starting StreamHub Frontend on http://localhost:5173..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\frontend"
npm run dev
