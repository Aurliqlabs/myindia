$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host ""
  Write-Host "Node.js is required to run REPUBLIC: 543 locally." -ForegroundColor Red
  Write-Host "Install the current LTS version and run this file again."
  Start-Process "https://nodejs.org/en/download"
  Read-Host "Press Enter to close"
  exit 1
}

Write-Host ""
Write-Host "REPUBLIC: 543" -ForegroundColor Red
Write-Host "Starting local server at http://localhost:3000"
Write-Host "Keep this window open. Press Ctrl+C to stop."
Write-Host ""

Start-Process "http://localhost:3000"
node scripts/dev-server.mjs
