@echo off
echo ========================================================
echo           Stopping All Orderly Services                 
echo ========================================================

echo Stopping Node.js backend and frontend processes...
taskkill /F /IM node.exe /T 2>nul

echo Closing all Orderly service command windows...
taskkill /F /FI "WINDOWTITLE eq Orderly - *" 2>nul
taskkill /F /FI "WINDOWTITLE eq Orderly*" 2>nul
taskkill /F /FI "WINDOWTITLE eq FoodFlow*" 2>nul

echo ========================================================
echo All Orderly services stopped and windows closed!
echo ========================================================
ping 127.0.0.1 -n 3 >nul
