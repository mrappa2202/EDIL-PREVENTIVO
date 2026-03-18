@echo off
REM Build script per Preventivi Pittura Edile - Windows
REM Esegui questo script dalla cartella principale del progetto

echo =========================================
echo   Build Preventivi Pittura Edile
echo =========================================
echo.

REM Verifica requisiti
echo [1/6] Verifica requisiti...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js non trovato. Installalo da https://nodejs.org/
    pause
    exit /b 1
)
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Python non trovato. Installalo da https://www.python.org/
    pause
    exit /b 1
)
echo   √ Node.js e Python trovati
echo.

REM Pulisci build precedenti
echo [2/6] Pulizia build precedenti...
if exist electron\backend rmdir /s /q electron\backend
if exist electron\frontend-build rmdir /s /q electron\frontend-build
if exist electron\dist rmdir /s /q electron\dist
echo   √ Cartelle pulite
echo.

REM Copia backend
echo [3/6] Copia backend...
mkdir electron\backend
copy backend\server.py electron\backend\
copy backend\requirements.txt electron\backend\
echo   √ Backend copiato
echo.

REM Build frontend
echo [4/6] Build frontend React...
cd frontend
echo REACT_APP_BACKEND_URL=http://127.0.0.1:8001/api > .env.production.local
call npm run build
cd ..
xcopy /E /I /Y frontend\build electron\frontend-build
echo   √ Frontend compilato
echo.

REM Installa dipendenze Electron
echo [5/6] Installa dipendenze Electron...
cd electron
call npm install
cd ..
echo   √ Dipendenze installate
echo.

REM Build Electron
echo [6/6] Build applicazione desktop...
cd electron
call npm run build:win
cd ..

echo.
echo =========================================
echo   BUILD COMPLETATO!
echo =========================================
echo.
echo File generati in: electron\dist\
dir /b electron\dist\*.exe 2>nul
echo.
echo Per testare l'app:
echo   - Installer: electron\dist\Preventivi Pittura Edile Setup 1.0.0.exe
echo   - Portable:  electron\dist\PreventiviPittura-Portable-1.0.0.exe
echo.
pause
