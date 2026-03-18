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
- **Database**: SQLite (migrato da MongoDB)
- **Packaging Futuro**: Electron

## Stato Implementazione

### Completato (Dicembre 2025)
- [x] MVP completa con autenticazione JWT
- [x] Migrazione da MongoDB a SQLite completata
- [x] Login con "Ricordami per 30 giorni"
- [x] Gestione sessioni avanzata (tracciamento, revoca)
- [x] CRUD Clienti completo
- [x] CRUD Preventivi con voci
- [x] CRUD Materiali con alert scorte
- [x] CRUD Spese
- [x] CRUD Dipendenti + Worklogs + Pagamenti
- [x] Dashboard con statistiche
- [x] Ricerca globale
- [x] Generazione PDF preventivi
- [x] Categorie predefinite (11 categorie)
- [x] Impostazioni azienda complete
- [x] UI completamente in italiano
- [x] Test backend 100% (25/25 test)
- [x] Test frontend 100%

### In Attesa / Backlog

#### P1 - Prossime Funzionalità
- [ ] Componente Combobox per input libero (già creato, da integrare nei form)
- [ ] Gestore Categorie con drag-and-drop nelle impostazioni
- [ ] Barra di ricerca globale nell'header
- [ ] Modifica in linea nelle tabelle preventivi
- [ ] Avviso modifiche non salvate
- [ ] Logout automatico per inattività (logica backend pronta)

#### P2 - Miglioramenti
- [ ] Timeout inattività configurabile nelle impostazioni
- [ ] Export dati in CSV/Excel
- [ ] Report mensili/annuali

#### P0 - Fase Finale
- [ ] Packaging con Electron per distribuzione Windows
  - Setup wizard primo avvio
  - Icona system tray
  - Backup automatico database

## File Principali
- `/app/backend/server.py` - Backend FastAPI completo (~1700 righe)
- `/app/backend/preventivi.db` - Database SQLite
- `/app/frontend/src/pages/` - Pagine React
- `/app/frontend/src/store/authStore.js` - Gestione autenticazione
- `/app/frontend/src/lib/api.js` - Client API
- `/app/frontend/src/components/ui/combobox.jsx` - Componente input libero

## Credenziali Test
- Username: `admin`
- Password: `admin123`

## API Base URL
```
https://costruzioni-desk.preview.emergentagent.com/api
```

## Database Schema (SQLite)
- users, sessions
- categories (con sotto-categorie)
- saved_options
- clients
- quotes, quote_items, quote_drafts
- materials
- expenses
- employees, worklogs, payments
- settings
