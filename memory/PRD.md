# PRD - Preventivi Pittura Edile

## Problema Originale
Applicazione web full-stack per la gestione di preventivi per un'impresa di costruzioni/edile, con funzionalità offline e distribuzione desktop.

## Requisiti Core
- Autenticazione (Admin/Operator) con "Ricordami" e gestione sessioni
- Gestione Clienti (CRUD completo, ricerca)
- Costruttore Preventivi (intestazione, voci personalizzabili, totali)
- Storico Preventivi (filtri, duplicazione)
- Inventario Materiali e Spese
- Tracciamento Pagamenti Dipendenti
- Generazione PDF
- Impostazioni configurabili
- UI in italiano

## Architettura Tecnica
- **Frontend**: React + Tailwind CSS + shadcn/ui + Zustand
- **Backend**: FastAPI + Python
- **Database**: SQLite
- **Desktop**: Electron (per distribuzione Windows)

## Stato Implementazione

### ✅ Fase 1 - Completata (Dicembre 2025)
- [x] MVP completa con autenticazione JWT
- [x] Migrazione da MongoDB a SQLite completata
- [x] Login con "Ricordami per 30 giorni"
- [x] Gestione sessioni avanzata
- [x] CRUD Clienti, Preventivi, Materiali, Spese, Dipendenti
- [x] Dashboard con statistiche
- [x] Generazione PDF preventivi
- [x] Categorie predefinite (11 categorie)
- [x] UI completamente in italiano

### ✅ Fase 2 - Completata (Dicembre 2025)
- [x] Barra di ricerca globale (Ctrl+K)
- [x] Combobox per input libero (Città, Provincia, Condizioni Pagamento)
- [x] Gestore Categorie con CRUD e drag-and-drop
- [x] Timeout inattività configurabile
- [x] Logout automatico per inattività

### ✅ Fase 3 - Electron Desktop (Dicembre 2025)
- [x] **Bug fix**: Selezione categorie nel costruttore preventivi
- [x] **Configurazione Electron** completa (`/app/electron/`)
- [x] **main.js**: Entry point con gestione backend, finestre, tray
- [x] **preload.js**: Bridge sicuro per API Electron
- [x] **splash.html**: Splash screen animato all'avvio
- [x] **System Tray**: Icona con menu contestuale
- [x] **Backup automatici**: Ogni 24 ore, mantiene ultimi 10
- [x] **Setup Wizard**: Primo avvio con configurazione guidata
- [x] **Single Instance**: Impedisce istanze multiple
- [x] **Build scripts**: `build.sh` (Linux/Mac), `build.bat` (Windows)
- [x] **Documentazione**: README.md con istruzioni complete

### In Attesa / Backlog
- [ ] Modifica in linea nelle tabelle preventivi
- [ ] Avviso modifiche non salvate (beforeunload)
- [ ] Export CSV/Excel

## File Principali

### Backend
- `/app/backend/server.py` - Backend FastAPI (~1700 righe)
- `/app/backend/preventivi.db` - Database SQLite

### Frontend
- `/app/frontend/src/pages/QuoteBuilderPage.jsx` - Costruttore preventivi (fix categorie)
- `/app/frontend/src/pages/SettingsPage.jsx` - Impostazioni + Gestore Categorie
- `/app/frontend/src/pages/ClientsPage.jsx` - Form con Combobox
- `/app/frontend/src/components/layout/MainLayout.jsx` - Ricerca globale + inattività
- `/app/frontend/src/components/ui/combobox.jsx` - Input libero

### Electron
- `/app/electron/package.json` - Config npm e electron-builder
- `/app/electron/main.js` - Entry point Electron
- `/app/electron/preload.js` - Bridge sicuro
- `/app/electron/splash.html` - Splash screen
- `/app/electron/build.sh` - Script build Linux/Mac
- `/app/electron/build.bat` - Script build Windows
- `/app/electron/README.md` - Istruzioni build

## Credenziali Test
- Username: `admin`
- Password: `admin123`

## Come Generare l'EXE Windows

```bash
# 1. Clona/scarica il progetto
# 2. Vai nella cartella principale
cd /path/to/progetto

# 3. Esegui lo script di build
# Linux/Mac:
./electron/build.sh

# Windows:
electron\build.bat

# 4. Trova l'EXE in: electron/dist/
```

## Funzionalità Desktop

### System Tray
- Minimizza in tray invece di chiudere
- Doppio click per riaprire
- Menu: Apri, Backup, Cartella Backup, Esci

### Backup Automatici
- Ogni 24 ore (configurabile)
- Mantiene ultimi 10 backup
- Backup manuale dal menu tray

### Setup Wizard
- Primo avvio guidato
- Crea cartelle dati automaticamente

## Note Tecniche
- Route FastAPI: statiche prima di dinamiche
- IVA auto-impostata dalla categoria selezionata
- Timeout inattività: 5-480 minuti
