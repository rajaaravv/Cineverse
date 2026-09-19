# Script to start StreamHub Backend with Java 21 / Maven
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting StreamHub Spring Boot Backend..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if java is in PATH or find JDK
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    $jdkLocations = @(
        "$env:JAVA_HOME\bin",
        "C:\Program Files\Java\*\bin",
        "C:\Program Files\Microsoft\jdk-21*\bin",
        "C:\Program Files\Eclipse Adoptium\jdk-21*\bin"
    )

    foreach ($loc in $jdkLocations) {
        $found = Get-Item $loc -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            Write-Host "Discovered JDK at $($found.FullName). Adding to session PATH..." -ForegroundColor Green
            $env:PATH = "$($found.FullName);$env:PATH"
            break
        }
    }
}

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "Java 21 is required. You can install it via: winget install Microsoft.OpenJDK.21" -ForegroundColor Yellow
    Write-Host "Or run the entire stack using Docker: docker-compose up -d --build" -ForegroundColor Yellow
    exit 1
}

Set-Location -Path "$PSScriptRoot\backend"
if (Get-Command mvn -ErrorAction SilentlyContinue) {
    mvn spring-boot:run
} else {
    Write-Host "Maven not found in PATH. Please install Maven or run via Docker." -ForegroundColor Yellow
}
