@echo off
REM ============================================================
REM   BUILD STANDALONE - Preventivi Pittura Edile
REM   Versione che NON richiede Python installato sul PC finale
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   PREVENTIVI PITTURA EDILE - Build Standalone per Windows
echo ============================================================
echo.
echo Questo script genera un'applicazione completamente autonoma.
echo Non sara' necessario installare Python sul PC di destinazione.
echo.

REM === VERIFICA REQUISITI ===
echo [1/7] Verifica requisiti...

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERRORE: Node.js non trovato!
    echo Scaricalo da: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERRORE: Python non trovato!
    echo Scaricalo da: https://www.python.org/downloads/
    echo IMPORTANTE: Seleziona "Add Python to PATH" durante l'installazione!
    echo.
    pause
    exit /b 1
)

where pip >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERRORE: pip non trovato!
    echo Reinstalla Python e assicurati che pip sia incluso.
    echo.
    pause
    exit /b 1
)

echo   [OK] Node.js trovato
echo   [OK] Python trovato
echo   [OK] pip trovato
echo.

REM === INSTALLA DIPENDENZE PYTHON ===
echo [2/7] Installazione dipendenze Python...
pip install pyinstaller fastapi uvicorn aiosqlite pyjwt python-multipart reportlab python-dateutil --quiet
if %ERRORLEVEL% neq 0 (
    echo ERRORE: Installazione dipendenze Python fallita!
    pause
    exit /b 1
)
echo   [OK] Dipendenze Python installate
echo.

REM === PULISCI BUILD PRECEDENTI ===
echo [3/7] Pulizia build precedenti...
if exist electron\backend rd /s /q electron\backend
if exist electron\frontend-build rd /s /q electron\frontend-build
if exist electron\dist rd /s /q electron\dist
if exist backend\dist rd /s /q backend\dist
if exist backend\build rd /s /q backend\build
echo   [OK] Pulizia completata
echo.

REM === GENERA BACKEND EXE CON PYINSTALLER ===
echo [4/7] Generazione backend standalone (PyInstaller)...
echo        Questo passaggio puo' richiedere alcuni minuti...
cd backend
python -m PyInstaller --onefile --name preventivi-backend --hidden-import=uvicorn.logging --hidden-import=uvicorn.loops --hidden-import=uvicorn.loops.auto --hidden-import=uvicorn.protocols --hidden-import=uvicorn.protocols.http --hidden-import=uvicorn.protocols.http.auto --hidden-import=uvicorn.protocols.websockets --hidden-import=uvicorn.protocols.websockets.auto --hidden-import=uvicorn.lifespan --hidden-import=uvicorn.lifespan.on --hidden-import=aiosqlite --hidden-import=reportlab.lib.colors --hidden-import=reportlab.lib.pagesizes --hidden-import=reportlab.pdfgen.canvas --hidden-import=reportlab.platypus --clean server.py
cd ..

if not exist backend\dist\preventivi-backend.exe (
    echo.
    echo ERRORE: Generazione backend fallita!
    echo Controlla gli errori sopra.
    pause
    exit /b 1
)
echo   [OK] Backend standalone generato
echo.

REM === PREPARA CARTELLA BACKEND ===
echo [5/7] Preparazione backend per Electron...
mkdir electron\backend\dist
copy backend\dist\preventivi-backend.exe electron\backend\dist\
echo   [OK] Backend copiato
echo.

REM === BUILD FRONTEND ===
echo [6/7] Compilazione frontend React...
cd frontend
echo REACT_APP_BACKEND_URL=http://127.0.0.1:8001/api > .env.production.local
call npm run build
cd ..

if not exist frontend\build\index.html (
    echo.
    echo ERRORE: Build frontend fallita!
    pause
    exit /b 1
)

xcopy /E /I /Y /Q frontend\build electron\frontend-build
echo   [OK] Frontend compilato
echo.

REM === BUILD ELECTRON ===
echo [7/7] Generazione applicazione desktop...
cd electron
call npm install
call npm run build:win
cd ..

echo.
echo ============================================================
echo   BUILD COMPLETATO CON SUCCESSO!
echo ============================================================
echo.
echo File generati in: electron\dist\
echo.

if exist "electron\dist\Preventivi Pittura Edile Setup 1.0.0.exe" (
    echo   [INSTALLER] Preventivi Pittura Edile Setup 1.0.0.exe
)
if exist "electron\dist\PreventiviPittura-Standalone-1.0.0.exe" (
    echo   [PORTABLE]  PreventiviPittura-Standalone-1.0.0.exe
)

echo.
echo ISTRUZIONI:
echo   1. Copia uno dei file .exe su qualsiasi PC Windows
echo   2. Eseguilo - NON serve installare nient'altro!
echo   3. L'applicazione e' completamente autonoma
echo.
echo Credenziali di accesso:
echo   Username: admin
echo   Password: admin123
echo.
pause
