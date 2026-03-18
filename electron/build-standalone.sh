#!/bin/bash
# ============================================================
#   BUILD STANDALONE - Preventivi Pittura Edile
#   Versione che NON richiede Python installato sul PC finale
# ============================================================

set -e

echo ""
echo "============================================================"
echo "  PREVENTIVI PITTURA EDILE - Build Standalone per Windows"
echo "============================================================"
echo ""
echo "Questo script genera un'applicazione completamente autonoma."
echo "Non sarà necessario installare Python sul PC di destinazione."
echo ""

# Verifica requisiti
echo "[1/7] Verifica requisiti..."

if ! command -v node &> /dev/null; then
    echo "ERRORE: Node.js non trovato!"
    echo "Installalo da: https://nodejs.org/"
    exit 1
fi

if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "ERRORE: Python non trovato!"
    exit 1
fi

PYTHON_CMD=$(command -v python3 || command -v python)
PIP_CMD=$(command -v pip3 || command -v pip)

echo "  [OK] Node.js: $(node --version)"
echo "  [OK] Python: $($PYTHON_CMD --version)"
echo ""

# Installa dipendenze Python
echo "[2/7] Installazione dipendenze Python..."
$PIP_CMD install pyinstaller fastapi uvicorn aiosqlite pyjwt python-multipart reportlab python-dateutil --quiet
echo "  [OK] Dipendenze Python installate"
echo ""

# Pulisci build precedenti
echo "[3/7] Pulizia build precedenti..."
rm -rf electron/backend
rm -rf electron/frontend-build
rm -rf electron/dist
rm -rf backend/dist
rm -rf backend/build
echo "  [OK] Pulizia completata"
echo ""

# Genera backend exe con PyInstaller
echo "[4/7] Generazione backend standalone (PyInstaller)..."
echo "       Questo passaggio può richiedere alcuni minuti..."
cd backend
$PYTHON_CMD -m PyInstaller --onefile --name preventivi-backend \
    --hidden-import=uvicorn.logging \
    --hidden-import=uvicorn.loops \
    --hidden-import=uvicorn.loops.auto \
    --hidden-import=uvicorn.protocols \
    --hidden-import=uvicorn.protocols.http \
    --hidden-import=uvicorn.protocols.http.auto \
    --hidden-import=uvicorn.protocols.websockets \
    --hidden-import=uvicorn.protocols.websockets.auto \
    --hidden-import=uvicorn.lifespan \
    --hidden-import=uvicorn.lifespan.on \
    --hidden-import=aiosqlite \
    --hidden-import=reportlab.lib.colors \
    --hidden-import=reportlab.lib.pagesizes \
    --hidden-import=reportlab.pdfgen.canvas \
    --hidden-import=reportlab.platypus \
    --clean \
    server.py
cd ..

if [ ! -f "backend/dist/preventivi-backend" ] && [ ! -f "backend/dist/preventivi-backend.exe" ]; then
    echo "ERRORE: Generazione backend fallita!"
    exit 1
fi
echo "  [OK] Backend standalone generato"
echo ""

# Prepara cartella backend
echo "[5/7] Preparazione backend per Electron..."
mkdir -p electron/backend/dist
cp backend/dist/preventivi-backend* electron/backend/dist/
echo "  [OK] Backend copiato"
echo ""

# Build frontend
echo "[6/7] Compilazione frontend React..."
cd frontend
echo "REACT_APP_BACKEND_URL=http://127.0.0.1:8001/api" > .env.production.local
npm run build
cd ..

if [ ! -f "frontend/build/index.html" ]; then
    echo "ERRORE: Build frontend fallita!"
    exit 1
fi

cp -r frontend/build electron/frontend-build
echo "  [OK] Frontend compilato"
echo ""

# Build Electron
echo "[7/7] Generazione applicazione desktop..."
cd electron
npm install
npm run build:win
cd ..

echo ""
echo "============================================================"
echo "  BUILD COMPLETATO CON SUCCESSO!"
echo "============================================================"
echo ""
echo "File generati in: electron/dist/"
ls -la electron/dist/*.exe 2>/dev/null || echo "  (controlla la cartella electron/dist/)"
echo ""
echo "ISTRUZIONI:"
echo "  1. Copia uno dei file .exe su qualsiasi PC Windows"
echo "  2. Eseguilo - NON serve installare nient'altro!"
echo "  3. L'applicazione è completamente autonoma"
echo ""
echo "Credenziali di accesso:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
