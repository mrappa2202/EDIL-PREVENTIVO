# PRD - Preventivi Pittura Edile

## Applicazione Desktop Standalone per Windows

### Descrizione
Applicazione completa per la gestione di preventivi per imprese di pittura edile. 
**Versione STANDALONE**: non richiede installazione di Python o altri software sul PC finale.

---

## ✅ Funzionalità Complete

### Core
- [x] Autenticazione JWT + "Ricordami 30 giorni"
- [x] Gestione sessioni con timeout inattività
- [x] CRUD Clienti con Combobox (input libero)
- [x] Costruttore Preventivi con categorie colorate
- [x] Storico Preventivi
- [x] Inventario Materiali con alert scorte
- [x] Gestione Spese
- [x] Dipendenti + Worklogs + Pagamenti
- [x] Dashboard statistiche
- [x] Generazione PDF
- [x] Ricerca globale (Ctrl+K)
- [x] Gestore Categorie drag-and-drop
- [x] UI completamente in italiano

### Desktop (Electron + PyInstaller)
- [x] Eseguibile standalone (no Python richiesto)
- [x] System Tray con menu
- [x] Backup automatici ogni 24h
- [x] Setup Wizard primo avvio
- [x] Single instance
- [x] Icona personalizzata

---

## 📁 Struttura Progetto

```
/app/
├── backend/
│   ├── server.py            # FastAPI + SQLite
│   ├── backend.spec         # Config PyInstaller
│   └── requirements.txt
├── frontend/
│   └── src/                  # React app
├── electron/
│   ├── main.js              # Entry point Electron
│   ├── preload.js           # Bridge sicuro
│   ├── splash.html          # Splash screen
│   ├── icon.ico             # Icona Windows
│   ├── icon_original.png    # Icona sorgente
│   ├── package.json         # Config electron-builder
│   ├── build-standalone.bat # ⭐ Script build Windows
│   ├── build-standalone.sh  # Script build Linux/Mac
│   ├── INSTALLAZIONE_WINDOWS.md
│   ├── GUIDA_RAPIDA.md
│   └── LICENSE.txt
└── memory/
    └── PRD.md
```

---

## 🚀 Come Generare l'EXE Standalone

### Sul PC di sviluppo (una volta sola):

```cmd
cd C:\progetto
electron\build-standalone.bat
```

### Output:
- `electron\dist\PreventiviPittura-Standalone-1.0.0.exe` (Portable)
- `electron\dist\Preventivi Pittura Edile Setup 1.0.0.exe` (Installer)

### Sul PC finale:
1. Copia l'EXE
2. Doppio click
3. **FATTO** - Nessun altro software richiesto!

---

## 🔑 Credenziali
- Username: `admin`
- Password: `admin123`

---

## 📋 Requisiti

### Per il BUILD:
- Node.js 18+
- Python 3.10+
- 10-15 minuti

### Per l'USO FINALE:
- Windows 10/11 64-bit
- 300 MB spazio disco
- **NIENT'ALTRO!**

---

## 📦 Backlog Futuro
- [ ] Modifica in linea tabelle preventivi
- [ ] Avviso modifiche non salvate
- [ ] Export CSV/Excel
- [ ] Sincronizzazione cloud (opzionale)
