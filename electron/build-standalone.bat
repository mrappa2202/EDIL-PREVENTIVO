@echo off
REM ============================================================
REM   BUILD STANDALONE - Preventivi Pittura Edile v1.1
REM   Versione che NON richiede Python installato sul PC finale
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   PREVENTIVI PITTURA EDILE - Build Standalone per Windows
echo ============================================================
echo.

REM === VERIFICA REQUISITI ===
echo [1/7] Verifica requisiti...

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERRORE: Node.js non trovato!
    echo Scaricalo da: https://nodejs.org/
    pause
    exit /b 1
)

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERRORE: Python non trovato!
    echo Scaricalo da: https://www.python.org/downloads/
    echo IMPORTANTE: Seleziona "Add Python to PATH"!
    pause
    exit /b 1
)

echo   [OK] Node.js e Python trovati
echo.

REM === INSTALLA DIPENDENZE PYTHON ===
echo [2/7] Installazione dipendenze Python (PyInstaller + app)...
pip install pyinstaller fastapi uvicorn[standard] aiosqlite pyjwt python-multipart reportlab python-dateutil --quiet --upgrade
if %ERRORLEVEL% neq 0 (
    echo ERRORE: Installazione dipendenze fallita!
    pause
    exit /b 1
)
echo   [OK] Dipendenze installate
echo.

REM === PULISCI BUILD PRECEDENTI ===
echo [3/7] Pulizia build precedenti...
if exist electron\backend rd /s /q electron\backend 2>nul
if exist electron\frontend-build rd /s /q electron\frontend-build 2>nul
if exist electron\dist rd /s /q electron\dist 2>nul
if exist backend\dist rd /s /q backend\dist 2>nul
if exist backend\build rd /s /q backend\build 2>nul
echo   [OK] Pulizia completata
echo.

REM === GENERA BACKEND EXE CON PYINSTALLER ===
echo [4/7] Generazione backend standalone (PyInstaller)...
echo        Questo puo' richiedere 3-5 minuti...
cd backend

python -m PyInstaller ^
    --onefile ^
    --name preventivi-backend ^
    --hidden-import=uvicorn.logging ^
    --hidden-import=uvicorn.loops ^
    --hidden-import=uvicorn.loops.auto ^
    --hidden-import=uvicorn.protocols ^
    --hidden-import=uvicorn.protocols.http ^
    --hidden-import=uvicorn.protocols.http.auto ^
    --hidden-import=uvicorn.protocols.http.h11_impl ^
    --hidden-import=uvicorn.protocols.http.httptools_impl ^
    --hidden-import=uvicorn.protocols.websockets ^
    --hidden-import=uvicorn.protocols.websockets.auto ^
    --hidden-import=uvicorn.protocols.websockets.websockets_impl ^
    --hidden-import=uvicorn.lifespan ^
    --hidden-import=uvicorn.lifespan.on ^
    --hidden-import=uvicorn.lifespan.off ^
    --hidden-import=aiosqlite ^
    --hidden-import=sqlite3 ^
    --hidden-import=reportlab ^
    --hidden-import=reportlab.lib ^
    --hidden-import=reportlab.lib.colors ^
    --hidden-import=reportlab.lib.pagesizes ^
    --hidden-import=reportlab.lib.styles ^
    --hidden-import=reportlab.lib.units ^
    --hidden-import=reportlab.pdfgen ^
    --hidden-import=reportlab.pdfgen.canvas ^
    --hidden-import=reportlab.platypus ^
    --hidden-import=reportlab.platypus.paragraph ^
    --hidden-import=reportlab.platypus.tables ^
    --hidden-import=email.mime.multipart ^
    --hidden-import=email.mime.text ^
    --collect-all uvicorn ^
    --collect-all starlette ^
    --collect-all fastapi ^
    --clean ^
    --noconfirm ^
    server.py

cd ..

if not exist backend\dist\preventivi-backend.exe (
    echo.
    echo ERRORE: Generazione backend fallita!
    echo Controlla gli errori sopra.
    pause
    exit /b 1
)

echo   [OK] Backend EXE generato: backend\dist\preventivi-backend.exe
echo.

REM === PREPARA CARTELLA BACKEND PER ELECTRON ===
echo [5/7] Preparazione backend per Electron...
mkdir electron\backend 2>nul
copy backend\dist\preventivi-backend.exe electron\backend\
if %ERRORLEVEL% neq 0 (
    echo ERRORE: Copia backend fallita!
    pause
    exit /b 1
)
echo   [OK] Backend copiato in electron\backend\
echo.

REM === BUILD FRONTEND ===
echo [6/7] Compilazione frontend React...
cd frontend

REM Crea .env.production.local per build locale
echo REACT_APP_BACKEND_URL=http://127.0.0.1:8001/api> .env.production.local

call npm install --silent 2>nul
call npm run build

cd ..

if not exist frontend\build\index.html (
    echo ERRORE: Build frontend fallita!
    pause
    exit /b 1
)

xcopy /E /I /Y /Q frontend\build electron\frontend-build >nul
echo   [OK] Frontend compilato
echo.

REM === BUILD ELECTRON ===
echo [7/7] Generazione applicazione desktop Electron...
cd electron

call npm install --silent 2>nul
call npm run build:win

cd ..

echo.
echo ============================================================
echo   BUILD COMPLETATO!
echo ============================================================
echo.
echo File generati in: electron\dist\
echo.

if exist "electron\dist\Preventivi Pittura Edile Setup 1.0.0.exe" (
    echo   [INSTALLER] Preventivi Pittura Edile Setup 1.0.0.exe
    for %%A in ("electron\dist\Preventivi Pittura Edile Setup 1.0.0.exe") do echo              Dimensione: %%~zA bytes
)
if exist "electron\dist\PreventiviPittura-Standalone-1.0.0.exe" (
    echo   [PORTABLE]  PreventiviPittura-Standalone-1.0.0.exe
    for %%A in ("electron\dist\PreventiviPittura-Standalone-1.0.0.exe") do echo              Dimensione: %%~zA bytes
)

echo.
echo ============================================================
echo   ISTRUZIONI PER L'USO
echo ============================================================
echo.
echo   1. Copia uno dei file .exe su QUALSIASI PC Windows
echo   2. Eseguilo con doppio click
echo   3. NON serve installare Python, Node.js o altro!
echo.
echo   Credenziali di accesso:
echo     Username: admin
echo     Password: admin123
echo.
echo ============================================================
pause
