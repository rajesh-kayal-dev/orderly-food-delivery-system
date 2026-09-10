@echo off
echo ========================================================
echo           Starting Orderly Platform Services            
echo ========================================================

echo [1/7] Starting API Gateway (Port 8000)...
start "Orderly - API Gateway" cmd /k "cd /d %~dp0gateway && npm run dev"

echo [2/7] Starting Identity Service (Port 5003)...
start "Orderly - Identity Service" cmd /k "cd /d %~dp0identity-service && npm run dev"

echo [3/7] Starting Restaurant Service (Port 5004)...
start "Orderly - Restaurant Service" cmd /k "cd /d %~dp0restaurant-service && npm run dev"

echo [4/7] Starting Order Service (Port 5002)...
start "Orderly - Order Service" cmd /k "cd /d %~dp0order-service && npm run dev"

echo [5/7] Starting Notification Service (Port 5005)...
start "Orderly - Notification Service" cmd /k "cd /d %~dp0notification-service && npm run dev"

echo [6/7] Starting Backend Monolith (Port 5000/5001)...
start "Orderly - Backend Service" cmd /k "cd /d %~dp0backend && npm run dev"

echo [7/7] Starting Frontend Application (Port 5173)...
start "Orderly - Frontend App" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ========================================================
echo All Orderly services launched!
echo Frontend URL : http://localhost:5173
echo API Gateway  : http://localhost:8000
echo ========================================================
ping 127.0.0.1 -n 3 >nul
