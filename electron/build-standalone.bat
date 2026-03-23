@echo off
REM ============================================================
REM   BUILD STANDALONE - Preventivi Pittura Edile
REM   Versione che NON richiede Python installato sul PC finale
REM   Integra setup-prerequisites.bat per auto-installazione
REM ============================================================

setlocal enabledelayedexpansion

REM === CONFIGURAZIONE ===
set APP_VERSION=1.0.0
set CLEAN_BUILD=0

REM === PARAMETRI DA LINEA DI COMANDO ===
:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--clean" (
    set CLEAN_BUILD=1
    shift
    goto :parse_args
)
shift
goto :parse_args
:args_done

REM === SALVA TEMPO INIZIO BUILD ===
set "BUILD_START_H=%TIME:~0,2%"
set "BUILD_START_M=%TIME:~3,2%"
set "BUILD_START_S=%TIME:~6,2%"
REM Rimuovi spazi iniziali (ore < 10)
set "BUILD_START_H=%BUILD_START_H: =0%"

echo.
echo ============================================================
echo   PREVENTIVI PITTURA EDILE v%APP_VERSION%
echo   Build Standalone per Windows
echo ============================================================
echo.

if %CLEAN_BUILD%==1 (
    echo   [INFO] Modalita' CLEAN BUILD attiva - ricostruzione completa
    echo.
)

REM ============================================================
REM   STEP 1/7 - VERIFICA REQUISITI
REM ============================================================
echo [1/7] Verifica requisiti...
set "STEP1_START_H=%TIME:~0,2%"
set "STEP1_START_M=%TIME:~3,2%"
set "STEP1_START_S=%TIME:~6,2%"
set "STEP1_START_H=%STEP1_START_H: =0%"

set NEED_SETUP=0

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo   [!] Node.js non trovato.
    set NEED_SETUP=1
)

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo   [!] Python non trovato.
    set NEED_SETUP=1
)

if !NEED_SETUP!==1 (
    echo.
    echo   Prerequisiti mancanti rilevati.
    echo.
    set /p "SETUP_CHOICE=   Vuoi eseguire setup-prerequisites.bat per installarli automaticamente? (S/N): "
    if /i "!SETUP_CHOICE!"=="S" (
        echo.
        echo   Avvio setup-prerequisites.bat...
        echo.
        if exist "electron\setup-prerequisites.bat" (
            call electron\setup-prerequisites.bat
        ) else (
            echo   ERRORE: electron\setup-prerequisites.bat non trovato!
            echo   Assicurati di eseguire questo script dalla directory root del progetto.
            pause
            exit /b 1
        )

        echo.
        echo   Aggiornamento PATH dal registro di sistema...
        REM Ricarica PATH dal registro per rilevare le nuove installazioni
        for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYSPATH=%%b"
        for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USRPATH=%%b"
        set "PATH=!SYSPATH!;!USRPATH!"

        echo   [OK] PATH aggiornato.
        echo.

        REM Verifica di nuovo dopo il setup
        where node >nul 2>nul
        if !ERRORLEVEL! neq 0 (
            echo   ERRORE: Node.js ancora non trovato dopo il setup!
            echo   Prova a chiudere e riaprire il terminale, poi riesegui questo script.
            pause
            exit /b 1
        )
        where python >nul 2>nul
        if !ERRORLEVEL! neq 0 (
            echo   ERRORE: Python ancora non trovato dopo il setup!
            echo   Prova a chiudere e riaprire il terminale, poi riesegui questo script.
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo   Build annullata. Installa i prerequisiti manualmente:
        echo     - Node.js: https://nodejs.org/
        echo     - Python:  https://www.python.org/downloads/ (seleziona "Add to PATH")
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
for /f "tokens=*" %%v in ('python --version 2^>nul') do set "PYTHON_VER=%%v"
echo   [OK] Node.js: %NODE_VER%
echo   [OK] %PYTHON_VER%

set "STEP1_END_H=%TIME:~0,2%"
set "STEP1_END_M=%TIME:~3,2%"
set "STEP1_END_S=%TIME:~6,2%"
set "STEP1_END_H=%STEP1_END_H: =0%"
call :calc_elapsed STEP1_START_H STEP1_START_M STEP1_START_S STEP1_END_H STEP1_END_M STEP1_END_S STEP1_ELAPSED
echo   [TEMPO] Step 1 completato in %STEP1_ELAPSED%
echo.

REM ============================================================
REM   STEP 2/7 - INSTALLAZIONE DIPENDENZE PYTHON
REM ============================================================
echo [2/7] Installazione dipendenze Python (PyInstaller + app)...
set "STEP2_START_H=%TIME:~0,2%"
set "STEP2_START_M=%TIME:~3,2%"
set "STEP2_START_S=%TIME:~6,2%"
set "STEP2_START_H=%STEP2_START_H: =0%"

:step2_retry
pip install pyinstaller fastapi uvicorn[standard] aiosqlite pyjwt python-multipart reportlab python-dateutil bcrypt python-dotenv pydantic --quiet --upgrade
if %ERRORLEVEL% neq 0 (
    echo.
    echo   [!] ERRORE: Installazione dipendenze Python fallita!
    set /p "RETRY2=   Vuoi riprovare? (S/N): "
    if /i "!RETRY2!"=="S" (
        echo   Nuovo tentativo...
        goto :step2_retry
    )
    echo   Build annullata.
    pause
    exit /b 1
)
echo   [OK] Dipendenze Python installate

set "STEP2_END_H=%TIME:~0,2%"
set "STEP2_END_M=%TIME:~3,2%"
set "STEP2_END_S=%TIME:~6,2%"
set "STEP2_END_H=%STEP2_END_H: =0%"
call :calc_elapsed STEP2_START_H STEP2_START_M STEP2_START_S STEP2_END_H STEP2_END_M STEP2_END_S STEP2_ELAPSED
echo   [TEMPO] Step 2 completato in %STEP2_ELAPSED%
echo.

REM ============================================================
REM   STEP 3/7 - PULIZIA BUILD PRECEDENTI
REM ============================================================
echo [3/7] Pulizia build precedenti...
set "STEP3_START_H=%TIME:~0,2%"
set "STEP3_START_M=%TIME:~3,2%"
set "STEP3_START_S=%TIME:~6,2%"
set "STEP3_START_H=%STEP3_START_H: =0%"

if exist electron\backend rd /s /q electron\backend 2>nul
if exist electron\frontend-build rd /s /q electron\frontend-build 2>nul
if exist electron\dist rd /s /q electron\dist 2>nul
if exist backend\dist rd /s /q backend\dist 2>nul
if exist backend\build rd /s /q backend\build 2>nul

if %CLEAN_BUILD%==1 (
    echo   Pulizia completa: rimozione node_modules e cache...
    if exist electron\node_modules rd /s /q electron\node_modules 2>nul
    if exist frontend\node_modules rd /s /q frontend\node_modules 2>nul
    if exist frontend\build rd /s /q frontend\build 2>nul
    echo   [OK] Pulizia completa eseguita (node_modules rimossi)
) else (
    echo   [OK] Pulizia standard completata
)

set "STEP3_END_H=%TIME:~0,2%"
set "STEP3_END_M=%TIME:~3,2%"
set "STEP3_END_S=%TIME:~6,2%"
set "STEP3_END_H=%STEP3_END_H: =0%"
call :calc_elapsed STEP3_START_H STEP3_START_M STEP3_START_S STEP3_END_H STEP3_END_M STEP3_END_S STEP3_ELAPSED
echo   [TEMPO] Step 3 completato in %STEP3_ELAPSED%
echo.

REM ============================================================
REM   STEP 4/7 - GENERAZIONE BACKEND EXE (PYINSTALLER)
REM ============================================================
echo [4/7] Generazione backend standalone (PyInstaller)...
echo        Questo puo' richiedere 3-5 minuti...
set "STEP4_START_H=%TIME:~0,2%"
set "STEP4_START_M=%TIME:~3,2%"
set "STEP4_START_S=%TIME:~6,2%"
set "STEP4_START_H=%STEP4_START_H: =0%"

:step4_retry
cd backend

python -m PyInstaller ^
    --onefile ^
    --name preventivi-backend ^
    --log-level WARN ^
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
    --hidden-import=bcrypt ^
    --hidden-import=dotenv ^
    --hidden-import=pydantic ^
    --hidden-import=pydantic_core ^
    --collect-all uvicorn ^
    --collect-all starlette ^
    --collect-all fastapi ^
    --collect-all reportlab ^
    --clean ^
    --noconfirm ^
    server.py

cd ..

if not exist backend\dist\preventivi-backend.exe (
    echo.
    echo   [!] ERRORE: Generazione backend fallita!
    echo   Controlla gli errori sopra.
    set /p "RETRY4=   Vuoi riprovare? (S/N): "
    if /i "!RETRY4!"=="S" (
        echo   Nuovo tentativo...
        goto :step4_retry
    )
    echo   Build annullata.
    pause
    exit /b 1
)

echo   [OK] Backend EXE generato: backend\dist\preventivi-backend.exe

set "STEP4_END_H=%TIME:~0,2%"
set "STEP4_END_M=%TIME:~3,2%"
set "STEP4_END_S=%TIME:~6,2%"
set "STEP4_END_H=%STEP4_END_H: =0%"
call :calc_elapsed STEP4_START_H STEP4_START_M STEP4_START_S STEP4_END_H STEP4_END_M STEP4_END_S STEP4_ELAPSED
echo   [TEMPO] Step 4 completato in %STEP4_ELAPSED%
echo.

REM ============================================================
REM   STEP 5/7 - COPIA BACKEND IN ELECTRON
REM ============================================================
echo [5/7] Preparazione backend per Electron...
set "STEP5_START_H=%TIME:~0,2%"
set "STEP5_START_M=%TIME:~3,2%"
set "STEP5_START_S=%TIME:~6,2%"
set "STEP5_START_H=%STEP5_START_H: =0%"

mkdir electron\backend 2>nul
copy backend\dist\preventivi-backend.exe electron\backend\
if %ERRORLEVEL% neq 0 (
    echo   ERRORE: Copia backend fallita!
    pause
    exit /b 1
)
echo   [OK] Backend copiato in electron\backend\

set "STEP5_END_H=%TIME:~0,2%"
set "STEP5_END_M=%TIME:~3,2%"
set "STEP5_END_S=%TIME:~6,2%"
set "STEP5_END_H=%STEP5_END_H: =0%"
call :calc_elapsed STEP5_START_H STEP5_START_M STEP5_START_S STEP5_END_H STEP5_END_M STEP5_END_S STEP5_ELAPSED
echo   [TEMPO] Step 5 completato in %STEP5_ELAPSED%
echo.

REM ============================================================
REM   STEP 6/7 - BUILD FRONTEND REACT
REM ============================================================
echo [6/7] Compilazione frontend React...
set "STEP6_START_H=%TIME:~0,2%"
set "STEP6_START_M=%TIME:~3,2%"
set "STEP6_START_S=%TIME:~6,2%"
set "STEP6_START_H=%STEP6_START_H: =0%"

:step6_retry
cd frontend

REM Crea .env.production.local per build locale
echo REACT_APP_BACKEND_URL=http://127.0.0.1:8001/api> .env.production.local

call npm install --silent 2>nul
call npm run build

cd ..

if not exist frontend\build\index.html (
    echo.
    echo   [!] ERRORE: Build frontend fallita!
    set /p "RETRY6=   Vuoi riprovare? (S/N): "
    if /i "!RETRY6!"=="S" (
        echo   Nuovo tentativo...
        goto :step6_retry
    )
    echo   Build annullata.
    pause
    exit /b 1
)

xcopy /E /I /Y /Q frontend\build electron\frontend-build >nul
echo   [OK] Frontend compilato e copiato in electron\frontend-build\

set "STEP6_END_H=%TIME:~0,2%"
set "STEP6_END_M=%TIME:~3,2%"
set "STEP6_END_S=%TIME:~6,2%"
set "STEP6_END_H=%STEP6_END_H: =0%"
call :calc_elapsed STEP6_START_H STEP6_START_M STEP6_START_S STEP6_END_H STEP6_END_M STEP6_END_S STEP6_ELAPSED
echo   [TEMPO] Step 6 completato in %STEP6_ELAPSED%
echo.

REM ============================================================
REM   STEP 7/7 - BUILD ELECTRON
REM ============================================================
echo [7/7] Generazione applicazione desktop Electron...
set "STEP7_START_H=%TIME:~0,2%"
set "STEP7_START_M=%TIME:~3,2%"
set "STEP7_START_S=%TIME:~6,2%"
set "STEP7_START_H=%STEP7_START_H: =0%"

:step7_retry
cd electron

call npm install --silent 2>nul
call npm run build:win

cd ..

REM Verifica che almeno un file di output esista
set ELECTRON_OK=0
if exist "electron\dist\Preventivi Pittura Edile Setup %APP_VERSION%.exe" set ELECTRON_OK=1
if exist "electron\dist\PreventiviPittura-Standalone-%APP_VERSION%.exe" set ELECTRON_OK=1

if !ELECTRON_OK!==0 (
    echo.
    echo   [!] ERRORE: Build Electron fallita! Nessun file di output trovato.
    set /p "RETRY7=   Vuoi riprovare? (S/N): "
    if /i "!RETRY7!"=="S" (
        echo   Nuovo tentativo...
        goto :step7_retry
    )
    echo   Build annullata.
    pause
    exit /b 1
)

set "STEP7_END_H=%TIME:~0,2%"
set "STEP7_END_M=%TIME:~3,2%"
set "STEP7_END_S=%TIME:~6,2%"
set "STEP7_END_H=%STEP7_END_H: =0%"
call :calc_elapsed STEP7_START_H STEP7_START_M STEP7_START_S STEP7_END_H STEP7_END_M STEP7_END_S STEP7_ELAPSED
echo   [TEMPO] Step 7 completato in %STEP7_ELAPSED%
echo.

REM ============================================================
REM   CALCOLO TEMPO TOTALE
REM ============================================================
set "BUILD_END_H=%TIME:~0,2%"
set "BUILD_END_M=%TIME:~3,2%"
set "BUILD_END_S=%TIME:~6,2%"
set "BUILD_END_H=%BUILD_END_H: =0%"
call :calc_elapsed BUILD_START_H BUILD_START_M BUILD_START_S BUILD_END_H BUILD_END_M BUILD_END_S TOTAL_ELAPSED

REM ============================================================
REM   RIEPILOGO BUILD
REM ============================================================
echo.
echo ============================================================
echo   BUILD COMPLETATO CON SUCCESSO!
echo   Preventivi Pittura Edile v%APP_VERSION%
echo ============================================================
echo.
echo   +-----------------------------------------------------------+
echo   ^|  RIEPILOGO FILE GENERATI                                  ^|
echo   +-----------------------------------------------------------+
echo   ^|  File                                    ^| Dimensione     ^|
echo   +-----------------------------------------------------------+

REM Backend EXE
if exist "backend\dist\preventivi-backend.exe" (
    for %%A in ("backend\dist\preventivi-backend.exe") do (
        set "FSIZE=%%~zA"
        set /a "FSIZE_MB=!FSIZE! / 1048576"
        echo   ^|  preventivi-backend.exe                  ^| !FSIZE_MB! MB            ^|
    )
)

REM Installer
if exist "electron\dist\Preventivi Pittura Edile Setup %APP_VERSION%.exe" (
    for %%A in ("electron\dist\Preventivi Pittura Edile Setup %APP_VERSION%.exe") do (
        set "FSIZE=%%~zA"
        set /a "FSIZE_MB=!FSIZE! / 1048576"
        echo   ^|  Setup %APP_VERSION%.exe [INSTALLER]              ^| !FSIZE_MB! MB            ^|
    )
)

REM Portable
if exist "electron\dist\PreventiviPittura-Standalone-%APP_VERSION%.exe" (
    for %%A in ("electron\dist\PreventiviPittura-Standalone-%APP_VERSION%.exe") do (
        set "FSIZE=%%~zA"
        set /a "FSIZE_MB=!FSIZE! / 1048576"
        echo   ^|  Standalone %APP_VERSION%.exe [PORTABLE]          ^| !FSIZE_MB! MB            ^|
    )
)

echo   +-----------------------------------------------------------+
echo.
echo   Durata totale build: %TOTAL_ELAPSED%
echo.
echo   Tempi per step:
echo     Step 1 (Verifica requisiti):      %STEP1_ELAPSED%
echo     Step 2 (Dipendenze Python):       %STEP2_ELAPSED%
echo     Step 3 (Pulizia):                 %STEP3_ELAPSED%
echo     Step 4 (Backend PyInstaller):     %STEP4_ELAPSED%
echo     Step 5 (Copia backend):           %STEP5_ELAPSED%
echo     Step 6 (Frontend React):          %STEP6_ELAPSED%
echo     Step 7 (Electron builder):        %STEP7_ELAPSED%
echo.
echo   File di output in: electron\dist\
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
exit /b 0

REM ============================================================
REM   FUNZIONE: Calcola tempo trascorso tra due timestamp
REM   Parametri: %1=start_h %2=start_m %3=start_s %4=end_h %5=end_m %6=end_s %7=output_var
REM ============================================================
:calc_elapsed
set /a "S_H=!%~1!"
set /a "S_M=!%~2!"
set /a "S_S=!%~3!"
set /a "E_H=!%~4!"
set /a "E_M=!%~5!"
set /a "E_S=!%~6!"

set /a "START_TOTAL=S_H*3600 + S_M*60 + S_S"
set /a "END_TOTAL=E_H*3600 + E_M*60 + E_S"

REM Gestisci il caso in cui il tempo attraversa la mezzanotte
if !END_TOTAL! lss !START_TOTAL! (
    set /a "END_TOTAL=END_TOTAL + 86400"
)

set /a "DIFF=END_TOTAL - START_TOTAL"
set /a "DIFF_M=DIFF / 60"
set /a "DIFF_S=DIFF %% 60"

if !DIFF_M! gtr 0 (
    set "%~7=!DIFF_M!m !DIFF_S!s"
) else (
    set "%~7=!DIFF_S!s"
)
goto :eof
