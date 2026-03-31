@echo off
REM Script di test per i simulatori su Windows

echo.
echo 🚀 NavalLogistic Simulators - Test Script (Windows)
echo ==========================================
echo.

REM Test Health Check
echo 1. Testing Disaster Simulator Health...
curl -s http://localhost:3001/health
echo.
echo.

REM Test Create Random Disaster
echo 2. Creating a test disaster...
curl -s -X POST http://localhost:3001/disasters/random
echo.
echo.

REM Test List Disasters
echo 3. Listing all disasters...
curl -s http://localhost:3001/disasters
echo.
echo.

REM Test API Endpoints
echo 4. Testing GET /disasters endpoint...
curl -s http://localhost:3001/disasters
echo.
echo.

echo ==========================================
echo ✓ Basic tests completed!
echo Run "docker-compose logs -f" to view full logs
echo ==========================================
pause
