# Preventivi Pittura Edile - Build Desktop

## Requisiti per il Build

### Software necessario:
1. **Node.js 18+** - https://nodejs.org/
2. **Python 3.10+** - https://www.python.org/
3. **Git** - https://git-scm.com/

### Dipendenze Python:
```bash
pip install fastapi uvicorn aiosqlite pyjwt python-multipart reportlab python-dateutil
```

## Struttura Progetto

```
electron/
├── main.js              # Entry point Electron
├── preload.js           # Script preload (bridge sicuro)
├── splash.html          # Splash screen all'avvio
├── package.json         # Config npm e electron-builder
├── LICENSE.txt          # Licenza MIT
├── icon.ico             # Icona Windows (da creare)
├── backend/             # Copia del backend Python (da copiare)
└── frontend-build/      # Build React (da generare)
```

## Istruzioni di Build

### 1. Preparazione

```bash
# Posizionati nella cartella electron
cd electron

# Installa dipendenze Node
npm install
```

### 2. Copia Backend

```bash
# Copia la cartella backend
cp -r ../backend ./backend

# Rimuovi file non necessari
rm -rf ./backend/__pycache__
rm -rf ./backend/*.pyc
rm -rf ./backend/preventivi.db  # Il DB verrà creato dall'utente
```

### 3. Build Frontend

```bash
# Vai alla cartella frontend
cd ../frontend

# Modifica .env per produzione locale
echo "REACT_APP_BACKEND_URL=http://127.0.0.1:8001" > .env.production

# Genera build di produzione
npm run build

# Copia nella cartella electron
cp -r build ../electron/frontend-build
```

### 4. Crea Icona

L'icona `icon.ico` deve essere un file ICO valido con multiple risoluzioni:
- 16x16, 32x32, 48x48, 64x64, 128x128, 256x256

Puoi convertire un PNG in ICO usando strumenti online o:
```bash
# Con ImageMagick
convert icon.png -resize 256x256 -define icon:auto-resize="256,128,64,48,32,16" icon.ico
```

### 5. Build Electron

```bash
cd electron

# Build per Windows (installer NSIS)
npm run build:win

# Oppure versione portable (no installazione)
npm run build:portable
```

### 6. Output

I file generati saranno in `electron/dist/`:
- `Preventivi Pittura Edile Setup 1.0.0.exe` - Installer
- `PreventiviPittura-Portable-1.0.0.exe` - Versione portable

## Funzionalità Desktop

### System Tray
- L'app si minimizza nella system tray invece di chiudersi
- Doppio click sull'icona per riaprire
- Menu contestuale con:
  - Apri Preventivi
  - Backup Database
  - Apri Cartella Backup
  - Esci

### Backup Automatici
- Backup automatico ogni 24 ore
- Mantiene gli ultimi 10 backup
- Cartella backup: `%APPDATA%/preventivi-pittura-edile/backups/`

### Setup Wizard
- Al primo avvio mostra un wizard di benvenuto
- Crea automaticamente le cartelle necessarie

### Single Instance
- Impedisce l'avvio di multiple istanze
- Se l'app è già in esecuzione, porta in primo piano la finestra esistente

## Risoluzione Problemi

### "Python non trovato"
- Assicurati che Python sia nel PATH di sistema
- Verifica con `python --version` da terminale

### "Errore avvio backend"
- Controlla che tutte le dipendenze Python siano installate
- Verifica i permessi della cartella dati

### "Build fallisce"
- Verifica che tutte le dipendenze npm siano installate
- Controlla che l'icona ICO sia valida

## Note per lo Sviluppo

Per testare in modalità sviluppo:
```bash
# Terminal 1: Avvia backend
cd backend
python -m uvicorn server:app --host 127.0.0.1 --port 8001

# Terminal 2: Avvia frontend
cd frontend
npm start

# Terminal 3: Avvia Electron
cd electron
npm start
```

## Licenza

MIT License - Vedi LICENSE.txt
