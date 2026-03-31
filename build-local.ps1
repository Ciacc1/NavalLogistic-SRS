# NavalLogistic Simulators - PowerShell Helper Script
# Uso: .\build-local.ps1 [comando]

param(
    [string]$Command = "help"
)

$simulators = @("fleet-simulator", "cargo-simulator", "disaster-simulator")

function Show-Help {
    Write-Host "NavalLogistic Simulators - Build Helper" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\build-local.ps1 [comando]" -ForegroundColor White
    Write-Host ""
    Write-Host "Comandi:" -ForegroundColor Yellow
    Write-Host "  install     - Installa dipendenze per tutti i simulatori" -ForegroundColor White
    Write-Host "  build       - Compila TypeScript per tutti i simulatori" -ForegroundColor White
    Write-Host "  clean       - Rimuove dist/ e node_modules/" -ForegroundColor White
    Write-Host "  status      - Mostra stato build" -ForegroundColor White
    Write-Host "  help        - Mostra questo messaggio" -ForegroundColor White
    Write-Host ""
}

function Install-Dependencies {
    Write-Host "📦 Installazione dipendenze..." -ForegroundColor Cyan
    foreach ($sim in $simulators) {
        $path = "simulators\$sim"
        if (Test-Path $path) {
            Write-Host "  → $sim" -ForegroundColor Yellow
            Push-Location $path
            npm install
            Pop-Location
        }
    }
    Write-Host "✓ Installazione completata" -ForegroundColor Green
}

function Build-TypeScript {
    Write-Host "🔨 Compilazione TypeScript..." -ForegroundColor Cyan
    foreach ($sim in $simulators) {
        $path = "simulators\$sim"
        if (Test-Path $path) {
            Write-Host "  → $sim" -ForegroundColor Yellow
            Push-Location $path
            npm run build
            Pop-Location
        }
    }
    Write-Host "✓ Build completato" -ForegroundColor Green
}

function Clean-Build {
    Write-Host "🧹 Pulizia build..." -ForegroundColor Cyan
    foreach ($sim in $simulators) {
        $path = "simulators\$sim"
        if (Test-Path "$path\dist") {
            Write-Host "  → Rimuovendo $path\dist" -ForegroundColor Yellow
            Remove-Item -Recurse -Force "$path\dist"
        }
        if (Test-Path "$path\node_modules") {
            Write-Host "  → Rimuovendo $path\node_modules" -ForegroundColor Yellow
            Remove-Item -Recurse -Force "$path\node_modules"
        }
    }
    Write-Host "✓ Pulizia completata" -ForegroundColor Green
}

function Show-Status {
    Write-Host "📊 Stato build..." -ForegroundColor Cyan
    foreach ($sim in $simulators) {
        $path = "simulators\$sim"
        $hasNodeModules = Test-Path "$path\node_modules"
        $hasDist = Test-Path "$path\dist"
        
        Write-Host "  $sim" -ForegroundColor Yellow
        Write-Host "    node_modules: $(if ($hasNodeModules) { 'OK ✓' } else { 'MISSING ✗' })" -ForegroundColor $(if ($hasNodeModules) { 'Green' } else { 'Red' })
        Write-Host "    dist: $(if ($hasDist) { 'OK ✓' } else { 'MISSING ✗' })" -ForegroundColor $(if ($hasDist) { 'Green' } else { 'Red' })
    }
}

# Main Switch
switch ($Command.ToLower()) {
    "install" { Install-Dependencies }
    "build" { Build-TypeScript }
    "clean" { Clean-Build }
    "status" { Show-Status }
    "help" { Show-Help }
    default { Show-Help }
}
