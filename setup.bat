@echo off
REM Installation script per Windows PowerShell

echo.
echo 🚀 NavalLogistic Simulators - Setup (Windows)
echo ==========================================
echo.

echo Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not found. Please install: https://docker.com
    exit /b 1
)
echo ✓ Docker found
docker --version

echo.
echo Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose not found
    exit /b 1
)
echo ✓ Docker Compose found
docker-compose --version

echo.
echo ✅ All prerequisites met!
echo.
echo 🚀 Next steps:
echo.
echo 1. Start the simulators:
echo    docker-compose up --build
echo.
echo 2. Test the APIs:
echo    test.bat
echo.
echo 3. View logs:
echo    docker-compose logs -f
echo.
pause
