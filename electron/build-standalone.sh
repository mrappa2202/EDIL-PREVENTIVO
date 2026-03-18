#!/bin/bash
# ============================================================
#   BUILD STANDALONE - Preventivi Pittura Edile v1.1
#   Versione che NON richiede Python installato sul PC finale
# ============================================================

set -e

echo ""
echo "============================================================"
echo "  PREVENTIVI PITTURA EDILE - Build Standalone"
echo "============================================================"
echo ""

# === VERIFICA REQUISITI ===
echo "[1/7] Verifica requisiti..."

if ! command -v node &> /dev/null; then
    echo "ERRORE: Node.js non trovato!"
    echo "Installalo da: https://nodejs.org/"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "ERRORE: Python non trovato!"
    echo "Installalo da: https://www.python.org/downloads/"
    exit 1
fi

echo "  [OK] Node.js e Python trovati"
echo ""

# === INSTALLA DIPENDENZE PYTHON ===
echo "[2/7] Installazione dipendenze Python (PyInstaller + app)..."
pip3 install pyinstaller fastapi 'uvicorn[standard]' aiosqlite pyjwt python-multipart reportlab python-dateutil --quiet --upgrade
echo "  [OK] Dipendenze installate"
echo ""

# === PULISCI BUILD PRECEDENTI ===
echo "[3/7] Pulizia build precedenti..."
rm -rf electron/backend 2>/dev/null
rm -rf electron/frontend-build 2>/dev/null
rm -rf electron/dist 2>/dev/null
rm -rf backend/dist 2>/dev/null
rm -rf backend/build 2>/dev/null
echo "  [OK] Pulizia completata"
echo ""

# === GENERA BACKEND EXE CON PYINSTALLER ===
echo "[4/7] Generazione backend standalone (PyInstaller)..."
echo "       Questo puo' richiedere 3-5 minuti..."
cd backend

python3 -m PyInstaller \
    --onefile \
    --name preventivi-backend \
    --hidden-import=uvicorn.logging \
    --hidden-import=uvicorn.loops \
    --hidden-import=uvicorn.loops.auto \
    --hidden-import=uvicorn.protocols \
    --hidden-import=uvicorn.protocols.http \
    --hidden-import=uvicorn.protocols.http.auto \
    --hidden-import=uvicorn.protocols.http.h11_impl \
    --hidden-import=uvicorn.protocols.http.httptools_impl \
    --hidden-import=uvicorn.protocols.websockets \
    --hidden-import=uvicorn.protocols.websockets.auto \
    --hidden-import=uvicorn.protocols.websockets.websockets_impl \
    --hidden-import=uvicorn.lifespan \
    --hidden-import=uvicorn.lifespan.on \
    --hidden-import=uvicorn.lifespan.off \
    --hidden-import=aiosqlite \
    --hidden-import=sqlite3 \
    --hidden-import=reportlab \
    --hidden-import=reportlab.lib \
    --hidden-import=reportlab.lib.colors \
    --hidden-import=reportlab.lib.pagesizes \
    --hidden-import=reportlab.lib.styles \
    --hidden-import=reportlab.lib.units \
    --hidden-import=reportlab.pdfgen \
    --hidden-import=reportlab.pdfgen.canvas \
    --hidden-import=reportlab.platypus \
    --hidden-import=reportlab.platypus.paragraph \
    --hidden-import=reportlab.platypus.tables \
    --hidden-import=email.mime.multipart \
    --hidden-import=email.mime.text \
    --collect-all uvicorn \
    --collect-all starlette \
    --collect-all fastapi \
    --clean \
    --noconfirm \
    server.py

cd ..

if [ ! -f "backend/dist/preventivi-backend" ]; then
    echo ""
    echo "ERRORE: Generazione backend fallita!"
    echo "Controlla gli errori sopra."
    exit 1
fi

echo "  [OK] Backend generato: backend/dist/preventivi-backend"
echo ""

# === PREPARA CARTELLA BACKEND PER ELECTRON ===
echo "[5/7] Preparazione backend per Electron..."
mkdir -p electron/backend
cp backend/dist/preventivi-backend electron/backend/
echo "  [OK] Backend copiato in electron/backend/"
echo ""

# === BUILD FRONTEND ===
echo "[6/7] Compilazione frontend React..."
cd frontend

# Crea .env.production.local per build locale
echo "REACT_APP_BACKEND_URL=http://127.0.0.1:8001/api" > .env.production.local

npm install --silent 2>/dev/null
npm run build

cd ..

if [ ! -f "frontend/build/index.html" ]; then
    echo "ERRORE: Build frontend fallita!"
    exit 1
fi

cp -r frontend/build/* electron/frontend-build/ 2>/dev/null || {
    mkdir -p electron/frontend-build
    cp -r frontend/build/* electron/frontend-build/
}
echo "  [OK] Frontend compilato"
echo ""

# === BUILD ELECTRON ===
echo "[7/7] Generazione applicazione desktop Electron..."
cd electron

npm install --silent 2>/dev/null

# Rileva OS per il target di build
case "$(uname -s)" in
    Linux*)  npm run build:linux ;;
    Darwin*) npm run build:mac ;;
    *)       npm run build:linux ;;
esac

cd ..

echo ""
echo "============================================================"
echo "  BUILD COMPLETATO!"
echo "============================================================"
echo ""
echo "File generati in: electron/dist/"
echo ""
echo "============================================================"
echo "  ISTRUZIONI PER L'USO"
echo "============================================================"
echo ""
echo "  1. Copia il file generato sul PC di destinazione"
echo "  2. Eseguilo"
echo "  3. NON serve installare Python, Node.js o altro!"
echo ""
echo "  Credenziali di accesso:"
echo "    Username: admin"
echo "    Password: admin123"
echo ""
echo "============================================================"
