@echo off
chcp 65001 > nul
cd /d "%~dp0"
title LEXILEARN PLATFORM - LOCAL SERVER
cls

echo ================================================================
echo    LEXILEARN - ENGLISH LEARNING VA FLASHCARD PLATFORM
echo ================================================================
echo.
echo [*] Dang khoi dong Local Web Server tai cong 5500...
echo [*] Duong dan thu muc: %~dp0
echo.
echo [OK] Mo trinh duyet tai: http://localhost:5500
start "" "http://localhost:5500"
echo.
echo [*] Server dang chay tren port 5500 (Nhan Ctrl + C de dung)
echo ================================================================
echo.
python -m http.server 5500
pause
