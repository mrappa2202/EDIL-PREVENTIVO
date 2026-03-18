# PRD - Preventivi Pittura Edile

## Problema Originale
Applicazione web full-stack per la gestione di preventivi per un'impresa di costruzioni/edile, con funzionalità offline e distribuzione desktop.

## Architettura Tecnica
- **Frontend**: React + Tailwind CSS + shadcn/ui + Zustand
- **Backend**: FastAPI + Python + SQLite
- **Desktop**: Electron (Windows .exe)

## ✅ Funzionalità Completate

### Core App
- [x] Autenticazione JWT con "Ricordami 30 giorni"
- [x] Gestione sessioni (timeout inattività configurabile)
- [x] CRUD Clienti con Combobox (input libero)
- [x] Costruttore Preventivi con categorie
- [x] Storico Preventivi
- [x] Inventario Materiali con alert scorte
- [x] Gestione Spese
- [x] Dipendenti + Worklogs + Pagamenti
- [x] Dashboard con statistiche
- [x] Generazione PDF
- [x] Ricerca globale (Ctrl+K)
- [x] Gestore Categorie drag-and-drop
- [x] UI completamente in italiano

### Desktop (Electron)
- [x] Configurazione completa per Windows
- [x] System Tray con menu
- [x] Backup automatici (ogni 24h)
- [x] Setup Wizard primo avvio
- [x] Single instance
- [x] Script di build (build.bat)
- [x] Documentazione installazione

## 📁 Struttura Progetto

```
/app/
├── backend/
│   ├── server.py           # FastAPI + SQLite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/          # Pagine React
│   │   ├── components/     # Componenti UI
│   │   ├── store/          # Zustand stores
│   │   └── lib/            # API client
│   └── package.json
├── electron/
│   ├── main.js             # Entry point Electron
│   ├── preload.js          # Bridge sicuro
│   ├── splash.html         # Splash screen
│   ├── package.json        # Config electron-builder
│   ├── build.bat           # Script Windows
│   ├── build.sh            # Script Linux/Mac
│   ├── INSTALLAZIONE_WINDOWS.md  # Guida dettagliata
│   ├── GUIDA_RAPIDA.md     # Quick start
│   └── COME_CREARE_ICONA.md
└── memory/
    └── PRD.md
```

## 🚀 Come Generare l'EXE

### Prerequisiti
1. Node.js 18+ (https://nodejs.org/)
2. Python 3.10+ (https://python.org/) - con PATH!
3. Dipendenze Python:
   ```
   pip install fastapi uvicorn aiosqlite pyjwt python-multipart reportlab python-dateutil
   ```

### Build
```cmd
cd C:\percorso\progetto
electron\build.bat
```

### Output
- `electron\dist\Preventivi Pittura Edile Setup 1.0.0.exe` (Installer)
- `electron\dist\PreventiviPittura-Portable-1.0.0.exe` (Portable)

## 🔑 Credenziali Test
- Username: `admin`
- Password: `admin123`

## 📋 Backlog
- [ ] Modifica in linea tabelle preventivi
- [ ] Avviso modifiche non salvate
- [ ] Export CSV/Excel
