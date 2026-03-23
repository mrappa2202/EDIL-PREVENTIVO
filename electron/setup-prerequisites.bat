@echo off
setlocal enabledelayedexpansion

:: ============================================================================
::  Preventivi Pittura Edile - Setup Prerequisiti Build
::  Questo script configura automaticamente la macchina di build con tutti
::  i prerequisiti necessari (Python, Node.js, dipendenze pip e npm).
:: ============================================================================

:: Colori e simboli
set "OK=[OK]"
set "WARN=[!!]"
set "ERR=[ERRORE]"
set "INFO=[INFO]"
set "ARROW=  --^>"

:: ============================================================================
:: BANNER
:: ============================================================================
echo.
echo ========================================================================
echo.
echo   Preventivi Pittura Edile - Setup Prerequisiti Build
echo.
echo   Questo script installa e configura tutti i prerequisiti necessari
echo   per compilare l'applicazione desktop (Electron + React + FastAPI).
echo.
echo ========================================================================
echo.

:: ============================================================================
:: CONTROLLO PRIVILEGI AMMINISTRATORE
:: ============================================================================
echo %INFO% Controllo privilegi amministratore...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo %WARN% Lo script NON sta girando come Amministratore.
    echo %WARN% Alcune installazioni potrebbero richiedere privilegi elevati.
    echo %WARN% Se l'installazione fallisce, riesegui come Amministratore.
    echo.
) else (
    echo %OK% Privilegi amministratore rilevati.
    echo.
)

:: ============================================================================
:: VARIABILI DI CONFIGURAZIONE
:: ============================================================================
set "PYTHON_VERSION=3.12.8"
set "PYTHON_URL=https://www.python.org/ftp/python/%PYTHON_VERSION%/python-%PYTHON_VERSION%-amd64.exe"
set "PYTHON_INSTALLER=%TEMP%\python-%PYTHON_VERSION%-amd64.exe"

set "NODE_VERSION=20.18.0"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-x64.msi"
set "NODE_INSTALLER=%TEMP%\node-v%NODE_VERSION%-x64.msi"

set "PYTHON_INSTALLED=0"
set "NODE_INSTALLED=0"
set "PYTHON_FRESHINSTALL=0"
set "NODE_FRESHINSTALL=0"

:: Salva la directory del progetto (lo script viene eseguito dalla root del progetto)
set "PROJECT_ROOT=%CD%"

:: ============================================================================
:: CONTROLLO PYTHON
:: ============================================================================
echo ========================================================================
echo   1. Controllo Python
echo ========================================================================
echo.

:: Prova prima "python --version"
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('python --version 2^>^&1') do set "PY_VER=%%v"
    echo %OK% Python trovato: !PY_VER!
    set "PYTHON_INSTALLED=1"
    goto :python_done
)

:: Prova "python3 --version"
python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('python3 --version 2^>^&1') do set "PY_VER=%%v"
    echo %OK% Python trovato: !PY_VER!
    set "PYTHON_INSTALLED=1"
    goto :python_done
)

:: Python non trovato - procedi con l'installazione
echo %WARN% Python non trovato nel PATH.
echo %INFO% Download di Python %PYTHON_VERSION% in corso...
echo %ARROW% URL: %PYTHON_URL%
echo.

:: Prova con curl.exe (disponibile su Windows 10 1803+)
curl.exe --version >nul 2>&1
if %errorlevel% equ 0 (
    echo %INFO% Utilizzo curl per il download...
    curl.exe -L -o "%PYTHON_INSTALLER%" "%PYTHON_URL%" --progress-bar
    if !errorlevel! neq 0 (
        echo %WARN% curl fallito, provo con bitsadmin...
        goto :python_bitsadmin
    )
    goto :python_install
)

:python_bitsadmin
:: Fallback con bitsadmin
echo %INFO% Utilizzo bitsadmin per il download...
bitsadmin /transfer "PythonDownload" /download /priority high "%PYTHON_URL%" "%PYTHON_INSTALLER%"
if %errorlevel% neq 0 (
    echo.
    echo %ERR% Download di Python fallito!
    echo %ERR% Scarica manualmente Python da:
    echo %ARROW% %PYTHON_URL%
    echo %ERR% Installa con l'opzione "Add Python to PATH" abilitata.
    echo.
    goto :python_done
)

:python_install
if not exist "%PYTHON_INSTALLER%" (
    echo %ERR% File installer non trovato: %PYTHON_INSTALLER%
    echo %ERR% Scarica manualmente Python da: %PYTHON_URL%
    goto :python_done
)

echo.
echo %INFO% Installazione di Python %PYTHON_VERSION% in corso...
echo %INFO% (installazione silenziosa, potrebbe richiedere qualche minuto)
echo.

"%PYTHON_INSTALLER%" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
if %errorlevel% neq 0 (
    echo %ERR% Installazione di Python fallita (codice errore: %errorlevel%).
    echo %ERR% Prova a eseguire lo script come Amministratore.
    echo %ERR% Oppure installa manualmente da: %PYTHON_URL%
    goto :python_done
)

echo %OK% Installazione di Python completata.
set "PYTHON_FRESHINSTALL=1"

:: Pulizia installer
del "%PYTHON_INSTALLER%" >nul 2>&1

:: Aggiorna PATH dopo installazione Python
call :refresh_path

:: Verifica installazione
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('python --version 2^>^&1') do set "PY_VER=%%v"
    echo %OK% Verifica: !PY_VER! installato correttamente.
    set "PYTHON_INSTALLED=1"
) else (
    echo %WARN% Python installato ma non ancora nel PATH della sessione corrente.
    echo %WARN% Potrebbe essere necessario riaprire il terminale.
)

:python_done
echo.

:: ============================================================================
:: CONTROLLO NODE.JS
:: ============================================================================
echo ========================================================================
echo   2. Controllo Node.js
echo ========================================================================
echo.

node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node --version 2^>^&1') do set "NODE_VER=%%v"
    echo %OK% Node.js trovato: !NODE_VER!
    set "NODE_INSTALLED=1"
    goto :node_done
)

:: Node.js non trovato - procedi con l'installazione
echo %WARN% Node.js non trovato nel PATH.
echo %INFO% Download di Node.js v%NODE_VERSION% in corso...
echo %ARROW% URL: %NODE_URL%
echo.

:: Prova con curl.exe
curl.exe --version >nul 2>&1
if %errorlevel% equ 0 (
    echo %INFO% Utilizzo curl per il download...
    curl.exe -L -o "%NODE_INSTALLER%" "%NODE_URL%" --progress-bar
    if !errorlevel! neq 0 (
        echo %WARN% curl fallito, provo con bitsadmin...
        goto :node_bitsadmin
    )
    goto :node_install
)

:node_bitsadmin
:: Fallback con bitsadmin
echo %INFO% Utilizzo bitsadmin per il download...
bitsadmin /transfer "NodeDownload" /download /priority high "%NODE_URL%" "%NODE_INSTALLER%"
if %errorlevel% neq 0 (
    echo.
    echo %ERR% Download di Node.js fallito!
    echo %ERR% Scarica manualmente Node.js da:
    echo %ARROW% %NODE_URL%
    echo.
    goto :node_done
)

:node_install
if not exist "%NODE_INSTALLER%" (
    echo %ERR% File installer non trovato: %NODE_INSTALLER%
    echo %ERR% Scarica manualmente Node.js da: %NODE_URL%
    goto :node_done
)

echo.
echo %INFO% Installazione di Node.js v%NODE_VERSION% in corso...
echo %INFO% (installazione silenziosa, potrebbe richiedere qualche minuto)
echo.

msiexec /i "%NODE_INSTALLER%" /quiet /norestart
if %errorlevel% neq 0 (
    echo %ERR% Installazione di Node.js fallita (codice errore: %errorlevel%).
    echo %ERR% Prova a eseguire lo script come Amministratore.
    echo %ERR% Oppure installa manualmente da: %NODE_URL%
    goto :node_done
)

echo %OK% Installazione di Node.js completata.
set "NODE_FRESHINSTALL=1"

:: Pulizia installer
del "%NODE_INSTALLER%" >nul 2>&1

:: Aggiorna PATH dopo installazione Node.js
call :refresh_path

:: Verifica installazione
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node --version 2^>^&1') do set "NODE_VER=%%v"
    echo %OK% Verifica: Node.js !NODE_VER! installato correttamente.
    set "NODE_INSTALLED=1"
) else (
    echo %WARN% Node.js installato ma non ancora nel PATH della sessione corrente.
    echo %WARN% Potrebbe essere necessario riaprire il terminale.
)

:node_done
echo.

:: ============================================================================
:: INSTALLAZIONE DIPENDENZE PIP
:: ============================================================================
echo ========================================================================
echo   3. Installazione dipendenze Python (pip)
echo ========================================================================
echo.

if %PYTHON_INSTALLED% equ 0 (
    echo %ERR% Python non disponibile. Impossibile installare le dipendenze pip.
    echo %ERR% Installa Python manualmente e riesegui questo script.
    echo.
    goto :pip_done
)

echo %INFO% Installazione pacchetti Python per il build...
echo %ARROW% pyinstaller, fastapi, uvicorn, aiosqlite, pyjwt, python-multipart,
echo %ARROW% reportlab, python-dateutil, bcrypt, python-dotenv, pydantic
echo.

python -m pip install pyinstaller fastapi "uvicorn[standard]" aiosqlite pyjwt python-multipart reportlab python-dateutil bcrypt python-dotenv pydantic --quiet --upgrade
if %errorlevel% neq 0 (
    echo.
    echo %WARN% Alcune dipendenze pip potrebbero non essere state installate correttamente.
    echo %WARN% Prova a eseguire manualmente:
    echo %ARROW% pip install pyinstaller fastapi "uvicorn[standard]" aiosqlite pyjwt python-multipart reportlab python-dateutil bcrypt python-dotenv pydantic
) else (
    echo %OK% Dipendenze Python installate correttamente.
)

:pip_done
echo.

:: ============================================================================
:: INSTALLAZIONE DIPENDENZE NPM - FRONTEND
:: ============================================================================
echo ========================================================================
echo   4. Installazione dipendenze npm (frontend)
echo ========================================================================
echo.

if %NODE_INSTALLED% equ 0 (
    echo %ERR% Node.js non disponibile. Impossibile installare le dipendenze npm.
    echo %ERR% Installa Node.js manualmente e riesegui questo script.
    echo.
    goto :npm_frontend_done
)

if not exist "%PROJECT_ROOT%\frontend\package.json" (
    echo %ERR% File frontend\package.json non trovato!
    echo %ERR% Assicurati di eseguire lo script dalla directory root del progetto.
    goto :npm_frontend_done
)

echo %INFO% Installazione dipendenze npm per il frontend...
echo.

cd "%PROJECT_ROOT%\frontend"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo %WARN% npm install per il frontend potrebbe aver avuto problemi.
    echo %WARN% Prova a eseguire manualmente: cd frontend ^&^& npm install
) else (
    echo.
    echo %OK% Dipendenze frontend installate correttamente.
)
cd "%PROJECT_ROOT%"

:npm_frontend_done
echo.

:: ============================================================================
:: INSTALLAZIONE DIPENDENZE NPM - ELECTRON
:: ============================================================================
echo ========================================================================
echo   5. Installazione dipendenze npm (electron)
echo ========================================================================
echo.

if %NODE_INSTALLED% equ 0 (
    echo %ERR% Node.js non disponibile. Impossibile installare le dipendenze npm.
    echo %ERR% Installa Node.js manualmente e riesegui questo script.
    echo.
    goto :npm_electron_done
)

if not exist "%PROJECT_ROOT%\electron\package.json" (
    echo %ERR% File electron\package.json non trovato!
    echo %ERR% Assicurati di eseguire lo script dalla directory root del progetto.
    goto :npm_electron_done
)

echo %INFO% Installazione dipendenze npm per Electron...
echo.

cd "%PROJECT_ROOT%\electron"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo %WARN% npm install per Electron potrebbe aver avuto problemi.
    echo %WARN% Prova a eseguire manualmente: cd electron ^&^& npm install
) else (
    echo.
    echo %OK% Dipendenze Electron installate correttamente.
)
cd "%PROJECT_ROOT%"

:npm_electron_done
echo.

:: ============================================================================
:: VERIFICA FINALE
:: ============================================================================
echo ========================================================================
echo   6. Verifica finale
echo ========================================================================
echo.

set "ALL_OK=1"

:: Verifica Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('python --version 2^>^&1') do set "FINAL_PY=%%v"
    echo   Python    : !FINAL_PY! ............. %OK%
) else (
    echo   Python    : NON TROVATO ............ %ERR%
    set "ALL_OK=0"
)

:: Verifica pip
python -m pip --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=1,2" %%a in ('python -m pip --version 2^>^&1') do set "FINAL_PIP=%%a %%b"
    echo   pip       : !FINAL_PIP! ............ %OK%
) else (
    echo   pip       : NON TROVATO ............ %ERR%
    set "ALL_OK=0"
)

:: Verifica Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node --version 2^>^&1') do set "FINAL_NODE=%%v"
    echo   Node.js   : !FINAL_NODE! .............. %OK%
) else (
    echo   Node.js   : NON TROVATO ............ %ERR%
    set "ALL_OK=0"
)

:: Verifica npm
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('npm --version 2^>^&1') do set "FINAL_NPM=%%v"
    echo   npm       : v!FINAL_NPM! ............... %OK%
) else (
    echo   npm       : NON TROVATO ............ %ERR%
    set "ALL_OK=0"
)

echo.

:: ============================================================================
:: RIEPILOGO E PROSSIMI PASSI
:: ============================================================================
echo ========================================================================

if %ALL_OK% equ 1 (
    echo.
    echo   %OK% Tutti i prerequisiti sono installati correttamente!
    echo.
    echo   Ambiente pronto! Ora puoi eseguire:
    echo     electron\build-standalone.bat
    echo.
) else (
    echo.
    echo   %WARN% Alcuni prerequisiti non sono stati trovati.
    echo   %WARN% Controlla i messaggi di errore sopra e risolvi i problemi.
    echo   %WARN% Poi riesegui questo script per verificare.
    echo.
)

echo ========================================================================
echo.

:: Pulizia eventuali installer rimasti
if exist "%PYTHON_INSTALLER%" del "%PYTHON_INSTALLER%" >nul 2>&1
if exist "%NODE_INSTALLER%" del "%NODE_INSTALLER%" >nul 2>&1

endlocal
pause
exit /b 0

:: ============================================================================
:: FUNZIONE: Aggiorna PATH dalla registry
:: ============================================================================
:refresh_path
echo %INFO% Aggiornamento PATH dalla registry di sistema...

:: Leggi PATH di sistema dal registro
set "SYSPATH="
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYSPATH=%%b"

:: Leggi PATH utente dal registro
set "USRPATH="
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USRPATH=%%b"

:: Combina i PATH
if defined SYSPATH (
    if defined USRPATH (
        set "PATH=!SYSPATH!;!USRPATH!"
    ) else (
        set "PATH=!SYSPATH!"
    )
) else (
    if defined USRPATH (
        set "PATH=!USRPATH!"
    )
)

echo %OK% PATH aggiornato.
goto :eof
