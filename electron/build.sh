#!/bin/bash

# Build script per Preventivi Pittura Edile
# Esegui questo script dalla cartella principale del progetto

set -e  # Exit on error

echo "========================================="
echo "  Build Preventivi Pittura Edile"
echo "========================================="
echo ""

# Verifica requisiti
echo "[1/6] Verifica requisiti..."
command -v node >/dev/null 2>&1 || { echo "Node.js non trovato. Installalo da https://nodejs.org/"; exit 1; }
command -v python3 >/dev/null 2>&1 || command -v python >/dev/null 2>&1 || { echo "Python non trovato. Installalo da https://www.python.org/"; exit 1; }
echo "  ✓ Node.js $(node --version)"
echo "  ✓ Python $(python3 --version 2>/dev/null || python --version)"
echo ""

# Pulisci build precedenti
echo "[2/6] Pulizia build precedenti..."
rm -rf electron/backend
rm -rf electron/frontend-build
rm -rf electron/dist
echo "  ✓ Cartelle pulite"
echo ""

# Copia backend
echo "[3/6] Copia backend..."
mkdir -p electron/backend
cp backend/server.py electron/backend/
cp backend/requirements.txt electron/backend/
# Rimuovi file non necessari se esistono
rm -rf electron/backend/__pycache__ 2>/dev/null || true
echo "  ✓ Backend copiato"
echo ""

# Build frontend
echo "[4/6] Build frontend React..."
cd frontend
# Crea .env.production per build locale
echo "REACT_APP_BACKEND_URL=http://127.0.0.1:8001/api" > .env.production.local
npm run build
cd ..
cp -r frontend/build electron/frontend-build
echo "  ✓ Frontend compilato"
echo ""

# Installa dipendenze Electron
echo "[5/6] Installa dipendenze Electron..."
cd electron
npm install
cd ..
echo "  ✓ Dipendenze installate"
echo ""

# Build Electron
echo "[6/6] Build applicazione desktop..."
cd electron

# Verifica se esiste l'icona, altrimenti crea placeholder
if [ ! -f "icon.ico" ]; then
    echo "  ⚠ icon.ico non trovato - usando placeholder"
    # Crea un ICO minimo (1x1 pixel trasparente) - placeholder
    # In produzione, sostituire con icona reale
fi

# Build
npm run build:win

echo ""
echo "========================================="
echo "  BUILD COMPLETATO!"
echo "========================================="
echo ""
echo "File generati in: electron/dist/"
ls -la dist/*.exe 2>/dev/null || echo "  (nessun .exe generato - controlla errori sopra)"
echo ""
echo "Per testare l'app:"
echo "  - Installer: dist/Preventivi Pittura Edile Setup 1.0.0.exe"
echo "  - Portable:  dist/PreventiviPittura-Portable-1.0.0.exe"
