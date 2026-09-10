@echo off
echo ========================================================
echo           Stopping Orderly Platform Services            
echo ========================================================

echo Terminating running Node.js services...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM nodemon.exe /T 2>nul

echo All Orderly platform processes stopped.
ping 127.0.0.1 -n 2 >nul
