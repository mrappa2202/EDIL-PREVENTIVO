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

### ✅ Fase 1 - Completata (Dicembre 2025)
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
- [x] Generazione PDF preventivi
- [x] Categorie predefinite (11 categorie)
- [x] Impostazioni azienda complete
- [x] UI completamente in italiano
- [x] Test backend 100% (25/25 test)

### ✅ Fase 2 - Completata (Dicembre 2025)
- [x] **Barra di ricerca globale** - Header con shortcut Ctrl+K
- [x] **Combobox per input libero** - Città, Provincia, Condizioni Pagamento
- [x] **Salvataggio opzioni personalizzate** - API /api/options
- [x] **Gestore Categorie** - Tab dedicato nelle Impostazioni
- [x] **CRUD Categorie** - Creazione, modifica, eliminazione con conferma
- [x] **Drag-and-drop categorie** - Riordino visuale
- [x] **Sotto-categorie** - Supporto via parent_id
- [x] **Indicatore timeout inattività** - Visibile nell'header
- [x] **Avviso sessione in scadenza** - Dialog 2 minuti prima
- [x] **Logout automatico per inattività** - Configurabile nelle impostazioni
- [x] Test backend 100% (21/21 test Fase 2)
- [x] Test frontend 100%

### In Attesa / Backlog

#### P1 - Prossime Funzionalità
- [ ] Modifica in linea nelle tabelle preventivi
- [ ] Avviso modifiche non salvate (beforeunload)
- [ ] Export dati in CSV/Excel

#### P0 - Fase Finale (Electron)
- [ ] Packaging con Electron per distribuzione Windows
  - Setup wizard primo avvio
  - Icona system tray
  - Backup automatico database
  - Avvio automatico con Windows

## File Principali
- `/app/backend/server.py` - Backend FastAPI completo (~1700 righe)
- `/app/backend/preventivi.db` - Database SQLite
- `/app/frontend/src/components/layout/MainLayout.jsx` - Layout con ricerca e inattività
- `/app/frontend/src/pages/SettingsPage.jsx` - Impostazioni con Gestore Categorie
- `/app/frontend/src/pages/ClientsPage.jsx` - Form con Combobox
- `/app/frontend/src/components/ui/combobox.jsx` - Componente input libero
- `/app/frontend/src/store/authStore.js` - Gestione autenticazione
- `/app/frontend/src/lib/api.js` - Client API

## Credenziali Test
- Username: `admin`
- Password: `admin123`

## API Base URL
```
https://costruzioni-desk.preview.emergentagent.com/api
```

## Note Tecniche
- **FastAPI Route Order**: Le route statiche (es. `/categories/reorder`) devono precedere le route dinamiche (es. `/categories/{category_id}`)
- **Combobox**: Salva opzioni via `/api/options` con `option_type` e `option_value`
- **Inattività**: Configurabile da 5 a 480 minuti, utenti con "Ricordami" esclusi
