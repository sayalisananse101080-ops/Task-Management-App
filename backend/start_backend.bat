@echo off
REM Ha file backend folder madhe thevaa (jithe main.py ahe). Double-click kra.
cd /d "%~dp0"

if exist "venv\Scripts\activate.bat" call "venv\Scripts\activate.bat"
if exist "..\venv\Scripts\activate.bat" call "..\venv\Scripts\activate.bat"

echo.
echo ===== Tumcha PC cha IPv4 Address (Wi-Fi) =====
ipconfig | findstr /i "IPv4"
echo ===============================================
echo.

REM USB ne phone jodla asel tar backend port phone la forward kara (adb asel tarach)
where adb >nul 2>nul
if %errorlevel%==0 (
    adb reverse tcp:8000 tcp:8000
    echo adb reverse 8000 done
) else (
    echo adb sapadla nahi - Wi-Fi ne connect hoil
)
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause