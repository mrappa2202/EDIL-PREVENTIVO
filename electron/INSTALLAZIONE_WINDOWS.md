# 🏗️ Preventivi Pittura Edile - Guida Completa Installazione Windows v2.0

**Preventivi Pittura Edile** è un'applicazione desktop professionale per la gestione di preventivi, clienti, materiali e spese nel settore della pittura edile. L'app combina un'interfaccia moderna React con un backend Python FastAPI, il tutto racchiuso in un pacchetto Electron pronto all'uso.

---

## 📑 Indice

1. [Panoramica](#1-panoramica)
2. [Requisiti](#2-requisiti)
3. [Setup Rapido (Quick Start)](#3-setup-rapido-quick-start)
4. [Setup Prerequisiti Dettagliato](#4-setup-prerequisiti-dettagliato)
5. [Build Dettagliato](#5-build-dettagliato)
6. [File Generati](#6-file-generati)
7. [Installazione sul PC Finale](#7-installazione-sul-pc-finale)
8. [Versione Portable](#8-versione-portable)
9. [Dove Sono i Dati](#9-dove-sono-i-dati)
10. [Backup e Ripristino](#10-backup-e-ripristino)
11. [Disinstallazione](#11-disinstallazione)
12. [Credenziali Default](#12-credenziali-default)
13. [Struttura del Progetto](#13-struttura-del-progetto)
14. [Troubleshooting](#14-troubleshooting)
15. [Aggiornamento Versione](#15-aggiornamento-versione)
16. [Note Tecniche](#16-note-tecniche)
17. [Changelog](#17-changelog)

---

## 1. Panoramica

### Cosa fa l'applicazione

Preventivi Pittura Edile permette di:

- **Creare e gestire preventivi** per lavori di pittura edile
- **Gestire l'anagrafica clienti** con storico lavori
- **Catalogare materiali** con prezzi e fornitori
- **Tracciare spese** e costi di progetto
- **Gestire dipendenti** e assegnazioni
- **Esportare preventivi** in formato professionale

### Architettura

L'applicazione è composta da tre livelli:

```
┌─────────────────────────────────┐
│        Electron Shell           │  ← Contenitore desktop nativo
│  ┌───────────────────────────┐  │
│  │     React Frontend        │  │  ← Interfaccia utente moderna
│  └───────────┬───────────────┘  │
│              │ HTTP/REST        │
│  ┌───────────▼───────────────┐  │
│  │   Python FastAPI Backend  │  │  ← Logica di business + Database
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

- **Electron** — Shell desktop che gestisce finestra, tray icon, ciclo di vita dell'app
- **React** — Frontend SPA con interfaccia utente responsive e moderna
- **Python FastAPI** — Backend REST API con database SQLite

### Distribuzione

Il backend Python viene compilato in un **eseguibile standalone** tramite PyInstaller. Questo significa che l'utente finale **non ha bisogno di installare Python** né alcun altro prerequisito.

L'app viene distribuita in due formati:

| Formato | Descrizione |
|---------|-------------|
| **Installer NSIS** | Wizard di installazione classico Windows con scorciatoie, registro, firewall |
| **Portable EXE** | Eseguibile singolo, nessuna installazione richiesta |

---

## 2. Requisiti

### 2a. PC di Build (dove si genera l'installer)

Questi requisiti sono necessari **solo** sulla macchina dove si compila l'applicazione:

| Requisito | Dettaglio |
|-----------|-----------|
| **Sistema Operativo** | Windows 10/11 64-bit |
| **RAM** | 4 GB minimo (8 GB consigliati) |
| **Spazio Disco** | 2 GB liberi (per dipendenze + output build) |
| **Connessione Internet** | Necessaria per scaricare dipendenze al primo setup |
| **Python** | 3.10 o superiore — *installato automaticamente da `setup-prerequisites.bat`* |
| **Node.js** | 18 o superiore — *installato automaticamente da `setup-prerequisites.bat`* |

> 💡 **Nota:** Non è necessario installare manualmente Python o Node.js. Lo script `setup-prerequisites.bat` si occupa di tutto automaticamente.

### 2b. PC Finale (dove si usa l'app)

Questi sono i requisiti per l'utente finale che utilizza l'applicazione:

| Requisito | Dettaglio |
|-----------|-----------|
| **Sistema Operativo** | Windows 10/11 64-bit |
| **Spazio Disco** | 300 MB |

> ✅ **NIENT'ALTRO** — L'applicazione è completamente standalone. Non richiede Python, Node.js, né alcun altro software aggiuntivo. Tutto il necessario è incluso nell'installer o nell'eseguibile portable.

---

## 3. Setup Rapido (Quick Start)

Per chi vuole semplicemente compilare l'applicazione il più velocemente possibile:

```batch
:: 1. Clona il repository
git clone <URL_REPOSITORY>
cd EDIL-PREVENTIVO

:: 2. Esegui il setup automatico dei prerequisiti
electron\setup-prerequisites.bat

:: 3. Esegui la build
electron\build-standalone.bat

:: 4. Trova gli eseguibili generati in:
::    electron\dist\
```

Al termine della build, nella cartella `electron\dist\` troverai:
- `PreventiviPittura-Setup-1.0.0.exe` — Installer NSIS
- `PreventiviPittura-Standalone-1.0.0.exe` — Versione portable

---

## 4. Setup Prerequisiti Dettagliato

### Cos'è `setup-prerequisites.bat`

Lo script `setup-prerequisites.bat` è un installer automatico che verifica e installa tutti i prerequisiti necessari per la build. È progettato per essere eseguito una sola volta (o quando si cambia macchina di build).

### Come eseguirlo

```batch
:: Dalla root del progetto
electron\setup-prerequisites.bat
```

> ⚠️ **Importante:** Eseguire come Amministratore se si desidera l'installazione automatica di Python e Node.js a livello di sistema.

### Cosa installa

Lo script esegue i seguenti passaggi in ordine:

1. **Verifica Python 3.10+**
   - Se non trovato, scarica e installa automaticamente Python 3.12 dal sito ufficiale
   - Configura il PATH di sistema automaticamente

2. **Verifica Node.js 18+**
   - Se non trovato, scarica e installa automaticamente Node.js 20 LTS
   - Configura il PATH di sistema automaticamente

3. **Installa dipendenze Python**
   - Esegue `pip install -r backend/requirements.txt`
   - Include FastAPI, Uvicorn, SQLAlchemy, PyInstaller e tutte le altre dipendenze

4. **Installa dipendenze Node.js**
   - Esegue `npm install` nella cartella `electron/`
   - Include electron, electron-builder e tutte le dipendenze di build

### Gestione del PATH

Lo script aggiorna automaticamente la variabile d'ambiente `PATH` per includere:
- La directory di installazione di Python
- La directory `Scripts` di Python (per pip, pyinstaller, ecc.)
- La directory di installazione di Node.js

Le modifiche al PATH sono persistenti e sopravvivono al riavvio del terminale.

### Troubleshooting Setup

| Problema | Soluzione |
|----------|-----------|
| Download fallito | Verificare la connessione internet e riprovare |
| Permessi insufficienti | Eseguire il terminale come Amministratore |
| Python installato ma non trovato | Chiudere e riaprire il terminale, poi riprovare |
| npm install fallisce | Eliminare `electron/node_modules` e `electron/package-lock.json`, poi riprovare |
| Antivirus blocca il download | Aggiungere un'eccezione temporanea per la cartella del progetto |

---

## 5. Build Dettagliato

### Cos'è `build-standalone.bat`

Lo script `build-standalone.bat` è il cuore del processo di build. Compila il backend Python, il frontend React e crea i pacchetti di distribuzione finali (installer NSIS + portable EXE).

### Come eseguirlo

```batch
:: Build standard
electron\build-standalone.bat

:: Build pulita (elimina cache e artefatti precedenti)
electron\build-standalone.bat --clean
```

### Le 7 Fasi della Build

Lo script esegue le seguenti fasi in sequenza:

| Fase | Descrizione | Tempo Stimato |
|------|-------------|---------------|
| **1. Verifica Prerequisiti** | Controlla che Python e Node.js siano installati e nelle versioni corrette | ~5 sec |
| **2. Pulizia (se --clean)** | Elimina cartelle `dist/`, `build/`, `node_modules/.cache` | ~10 sec |
| **3. Build Backend** | Compila il server Python in un EXE standalone con PyInstaller | ~3-5 min |
| **4. Build Frontend** | Compila l'app React in file statici ottimizzati | ~1-3 min |
| **5. Copia Risorse** | Copia frontend build, backend EXE e risorse nella struttura Electron | ~10 sec |
| **6. Build Electron** | Crea il pacchetto Electron con electron-builder | ~2-4 min |
| **7. Riepilogo** | Mostra i file generati, dimensioni e tempo totale | ~1 sec |

### Opzione `--clean`

L'opzione `--clean` è utile quando:
- La build precedente è fallita a metà
- Si sono aggiornate dipendenze significative
- Si verificano errori inspiegabili nella build
- Si vuole una build completamente pulita

```batch
electron\build-standalone.bat --clean
```

### Tempi di Build Attesi

| Scenario | Tempo |
|----------|-------|
| **Prima build** (download dipendenze incluso) | 10-15 minuti |
| **Build successive** (cache presente) | 5-8 minuti |
| **Build con --clean** | 8-12 minuti |

### Recovery Automatico degli Errori

Lo script include meccanismi di recovery automatico:
- Se una fase fallisce, mostra un messaggio di errore chiaro con la fase specifica
- Il timing di ogni fase viene registrato per identificare colli di bottiglia
- I file temporanei vengono puliti anche in caso di errore

---

## 6. File Generati

Al termine della build, nella cartella `electron\dist\` troverai:

| File | Tipo | Dimensione Tipica | Uso |
|------|------|-------------------|-----|
| `PreventiviPittura-Setup-1.0.0.exe` | Installer NSIS | ~80-120 MB | Installa l'app con wizard guidato, crea scorciatoie, configura firewall e registro |
| `PreventiviPittura-Standalone-1.0.0.exe` | Portable | ~80-120 MB | Esegui direttamente senza installazione, ideale per chiavette USB |

> 📦 L'installer NSIS utilizza compressione massima (LZMA) per ridurre al minimo la dimensione del file.

---

## 7. Installazione sul PC Finale

### Installazione con Wizard (Consigliata)

1. **Copiare** `PreventiviPittura-Setup-1.0.0.exe` sul PC di destinazione
2. **Doppio click** sull'installer
3. **Seguire il wizard** — accettare la licenza, scegliere la cartella di installazione
4. **Completare** l'installazione

### Cosa fa l'installer

L'installer NSIS personalizzato esegue automaticamente:

- ✅ **Copia i file** nella directory di installazione
- ✅ **Crea regole firewall** per consentire la comunicazione interna del backend (porta 8001)
- ✅ **Aggiunge chiavi di registro** per la disinstallazione tramite Impostazioni di Windows
- ✅ **Crea scorciatoie** sul Desktop e nel Menu Start
- ✅ **Registra l'applicazione** nel sistema per la gestione delle app di Windows

### Directory di Installazione

L'installazione predefinita è **per-macchina** (tutti gli utenti):

```
C:\Program Files\PreventiviPittura\
```

### Installazione Silenziosa

Per installazioni automatizzate o deployment su più macchine:

```batch
:: Installazione silenziosa (nessuna interfaccia grafica)
PreventiviPittura-Setup-1.0.0.exe /S

:: Installazione silenziosa con directory personalizzata
PreventiviPittura-Setup-1.0.0.exe /S /D=D:\MiaCartella\PreventiviPittura
```

### Per-Machine vs Per-User

L'installer è configurato per l'installazione **per-machine** (richiede privilegi di amministratore). Questo significa che:
- L'app è disponibile per **tutti gli utenti** del PC
- I file vengono installati in `Program Files`
- Le regole firewall vengono create a livello di sistema
- La disinstallazione è visibile a tutti gli utenti

---

## 8. Versione Portable

### Come usarla

1. **Copiare** `PreventiviPittura-Standalone-1.0.0.exe` dove si preferisce (Desktop, chiavetta USB, ecc.)
2. **Doppio click** per avviare — nessuna installazione necessaria
3. L'app si avvia direttamente

### Dove vengono salvati i dati

Anche nella versione portable, i dati vengono salvati nella cartella AppData dell'utente:

```
C:\Users\[UTENTE]\AppData\Roaming\preventivi-pittura-edile\
```

### Limitazioni rispetto alla versione Installer

| Funzionalità | Installer | Portable |
|--------------|-----------|----------|
| Scorciatoia Desktop | ✅ | ❌ |
| Scorciatoia Menu Start | ✅ | ❌ |
| Regole Firewall automatiche | ✅ | ❌ |
| Disinstallazione da Impostazioni | ✅ | ❌ |
| Aggiornamento automatico | ✅ | ❌ |
| Esecuzione da USB | ❌ | ✅ |
| Nessun privilegio admin richiesto | ❌ | ✅ |

> 💡 **Nota:** Se il firewall di Windows blocca la versione portable, potrebbe essere necessario aggiungere manualmente un'eccezione per la porta 8001.

---

## 9. Dove Sono i Dati

Tutti i dati dell'applicazione sono salvati nella seguente cartella:

```
C:\Users\[UTENTE]\AppData\Roaming\preventivi-pittura-edile\
├── preventivi.db        ← Database SQLite (tutti i dati dell'app)
├── backups\             ← Backup automatici del database
└── config.json          ← Configurazione dell'applicazione
```

### Come accedere alla cartella

1. Premere `Win + R`
2. Digitare `%APPDATA%\preventivi-pittura-edile`
3. Premere Invio

Oppure dalla barra degli indirizzi di Esplora File:
```
%APPDATA%\preventivi-pittura-edile
```

> ⚠️ **Attenzione:** Non modificare manualmente il file `preventivi.db` mentre l'applicazione è in esecuzione. Potrebbe causare corruzione dei dati.

---

## 10. Backup e Ripristino

### Backup Automatico

L'applicazione esegue un **backup automatico** del database ogni **24 ore**. I backup vengono salvati in:

```
C:\Users\[UTENTE]\AppData\Roaming\preventivi-pittura-edile\backups\
```

### Backup Manuale

È possibile eseguire un backup manuale in qualsiasi momento:

1. **Click destro** sull'icona nella system tray (area di notifica)
2. Selezionare **"Backup Database"**
3. Il backup viene creato immediatamente

### Politica di Retention

- Vengono mantenuti gli **ultimi 10 backup**
- I backup più vecchi vengono eliminati automaticamente
- Ogni file di backup è nominato con data e ora: `preventivi_backup_2026-03-23_14-30-00.db`

### Come Ripristinare un Backup

1. **Chiudere** l'applicazione completamente (anche dalla system tray)
2. **Navigare** alla cartella dei backup:
   ```
   %APPDATA%\preventivi-pittura-edile\backups\
   ```
3. **Scegliere** il backup desiderato (in base alla data)
4. **Copiare** il file di backup e rinominarlo in `preventivi.db`
5. **Sostituire** il file `preventivi.db` nella cartella principale:
   ```
   %APPDATA%\preventivi-pittura-edile\preventivi.db
   ```
6. **Riavviare** l'applicazione

> 💡 **Consiglio:** Prima di ripristinare, fare una copia del database attuale come precauzione.

---

## 11. Disinstallazione

### Tramite Impostazioni di Windows (Consigliato)

1. Aprire **Impostazioni** → **App** → **App installate**
2. Cercare **"Preventivi Pittura Edile"**
3. Cliccare **"Disinstalla"**
4. Seguire le istruzioni

### Tramite Menu Start

1. Aprire il **Menu Start**
2. Cercare **"Preventivi Pittura Edile"**
3. Cliccare su **"Uninstall"** (se presente nel gruppo dell'app)

### Cosa viene rimosso

La disinstallazione rimuove:

- ✅ File dell'applicazione dalla directory di installazione
- ✅ Scorciatoie dal Desktop e Menu Start
- ✅ Regole firewall create durante l'installazione
- ✅ Chiavi di registro dell'applicazione

### Cosa viene preservato

La disinstallazione **NON** rimuove i dati utente:

- 📁 Database (`preventivi.db`)
- 📁 Backup (`backups/`)
- 📁 Configurazione (`config.json`)

Questi file rimangono in `%APPDATA%\preventivi-pittura-edile\` e possono essere eliminati manualmente se non più necessari.

> 💡 **Nota:** Questa scelta è intenzionale per preservare i dati in caso di reinstallazione o aggiornamento.

---

## 12. Credenziali Default

Al primo avvio, l'applicazione è configurata con le seguenti credenziali:

```
👤 Username: admin
🔑 Password: admin123
```

> ⚠️ **IMPORTANTE:** Cambiare la password immediatamente dopo il primo accesso! Andare in **Impostazioni** → **Gestione Utenti** → **Modifica Password** per impostare una password sicura.

---

## 13. Struttura del Progetto

```
EDIL-PREVENTIVO/
├── backend/
│   ├── server.py                  ← Backend FastAPI (API REST + logica di business)
│   ├── requirements.txt           ← Dipendenze Python
│   └── backend.spec               ← Configurazione PyInstaller
├── frontend/
│   ├── src/                       ← Codice sorgente React
│   │   ├── pages/                 ← Pagine dell'applicazione
│   │   ├── components/            ← Componenti UI riutilizzabili
│   │   ├── store/                 ← State management (auth, theme)
│   │   └── lib/                   ← Utility e API client
│   └── package.json               ← Dipendenze frontend
├── electron/
│   ├── main.js                    ← Entry point Electron (gestione finestra, tray, lifecycle)
│   ├── preload.js                 ← Preload script (bridge sicuro renderer ↔ main)
│   ├── splash.html                ← Splash screen durante il caricamento
│   ├── package.json               ← Configurazione electron-builder
│   ├── installer.nsh              ← Script NSIS personalizzato (firewall, registro)
│   ├── setup-prerequisites.bat    ← Setup automatico prerequisiti (Python, Node.js, dipendenze)
│   ├── build-standalone.bat       ← Script di build principale (7 fasi)
│   ├── INSTALLAZIONE_WINDOWS.md   ← Questa documentazione
│   └── dist/                      ← Output della build (installer + portable)
├── memory/
│   └── PRD.md                     ← Product Requirements Document
└── ...
```

---

## 14. Troubleshooting

### Problemi di Build

| Problema | Causa | Soluzione |
|----------|-------|-----------|
| **"Python non trovato"** | Python non è installato o non è nel PATH | Eseguire `electron\setup-prerequisites.bat` |
| **"Node non trovato"** | Node.js non è installato o non è nel PATH | Eseguire `electron\setup-prerequisites.bat` |
| **"PyInstaller fallito"** | Antivirus interferisce con la compilazione | Disattivare temporaneamente l'antivirus o aggiungere eccezione per la cartella del progetto. Provare con `--clean` |
| **Build fallisce con "EPERM"** | File bloccati da un'altra istanza dell'app | Chiudere **tutte** le istanze dell'applicazione (controllare anche la system tray) e riprovare |
| **Antivirus blocca l'EXE generato** | Falso positivo dell'antivirus | Aggiungere un'eccezione per la cartella `electron\dist\` |
| **npm install fallisce** | Cache corrotta o conflitti di versione | Eliminare `electron\node_modules\` e `electron\package-lock.json`, poi riprovare |
| **Build lentissima** | Antivirus scansiona ogni file durante la build | Aggiungere la cartella del progetto alle esclusioni dell'antivirus |

### Problemi di Esecuzione

| Problema | Causa | Soluzione |
|----------|-------|-----------|
| **"Backend non si avvia"** | Porta 8001 già occupata o firewall blocca | Verificare che la porta 8001 sia libera: `netstat -an \| findstr 8001`. Controllare le regole del firewall |
| **Schermo bianco all'avvio** | Il backend non ha ancora completato l'avvio | Attendere 10-15 secondi. Il backend ha bisogno di tempo per inizializzarsi |
| **"Database corrotto"** | Chiusura anomala o modifica manuale del DB | Ripristinare da un backup (vedi [sezione 10](#10-backup-e-ripristino)) |
| **L'app non si avvia (nessun errore)** | Un'altra istanza è già in esecuzione | Controllare la system tray. L'app supporta una sola istanza alla volta |
| **Errore di connessione al backend** | Il backend EXE non è stato trovato | Verificare che il file backend sia presente nella directory di installazione |

### Diagnostica Avanzata

Per ottenere log dettagliati, avviare l'applicazione da terminale:

```batch
:: Dalla directory di installazione
"C:\Program Files\PreventiviPittura\PreventiviPittura.exe" --verbose
```

I log vengono scritti nella console e possono aiutare a identificare il problema.

---

## 15. Aggiornamento Versione

Per rilasciare una nuova versione dell'applicazione, aggiornare il numero di versione nei seguenti file:

### Passaggi

1. **Aggiornare `APP_VERSION`** in `electron/build-standalone.bat`:
   ```batch
   set APP_VERSION=1.1.0
   ```

2. **Aggiornare `version`** in `electron/package.json`:
   ```json
   {
     "version": "1.1.0"
   }
   ```

3. **Ricompilare** l'applicazione:
   ```batch
   electron\build-standalone.bat --clean
   ```

> 💡 **Consiglio:** Usare il [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH) per la numerazione delle versioni.

---

## 16. Note Tecniche

### Architettura Runtime

| Componente | Dettaglio |
|------------|-----------|
| **Backend** | Esegue su `127.0.0.1:8001` (solo localhost, non accessibile dall'esterno) |
| **Frontend** | Servito da file locali tramite il protocollo `file://` (non via HTTP) |
| **Database** | SQLite, salvato in `%APPDATA%\preventivi-pittura-edile\preventivi.db` |
| **Istanza singola** | L'app implementa un lock per impedire l'apertura di più istanze contemporanee |
| **System Tray** | L'app si minimizza nella system tray invece di chiudersi, per mantenere il backend attivo |
| **Auto-backup** | Backup automatico del database ogni 24 ore |

### Sicurezza

- Il backend ascolta **solo su localhost** (`127.0.0.1`) — non è raggiungibile dalla rete
- Le regole firewall create dall'installer sono configurate per bloccare connessioni esterne
- Le credenziali sono gestite con hashing sicuro lato backend
- Il preload script di Electron limita l'accesso alle API di sistema

### Performance

- Il backend compilato con PyInstaller ha un tempo di avvio di ~5-10 secondi
- Lo splash screen viene mostrato durante l'inizializzazione del backend
- Il frontend React è ottimizzato con code splitting e lazy loading

---

## 17. Changelog

```
v2.0 - Marzo 2026
──────────────────
✨ Novità:
  - Setup automatico prerequisiti (setup-prerequisites.bat)
  - Build migliorato con timing e recovery errori
  - Installer NSIS personalizzato con regole firewall
  - Supporto installazione silenziosa (/S)
  - Compressione massima LZMA per installer più piccoli
  - Installazione per-machine (tutti gli utenti)
  - Documentazione completa (questa guida)

🔧 Miglioramenti:
  - Rilevamento automatico prerequisiti nella build
  - Opzione --clean per build pulita
  - Preservazione dati utente durante disinstallazione
  - Chiavi di registro per disinstallazione da Impostazioni Windows

v1.1 - Marzo 2026
──────────────────
✨ Novità:
  - Build standalone con PyInstaller
  - Versione portable (EXE singolo)
  - Splash screen durante il caricamento

v1.0 - Febbraio 2026
──────────────────
🎉 Release iniziale:
  - Gestione preventivi, clienti, materiali, spese
  - Interfaccia React moderna
  - Backend FastAPI con database SQLite
  - Autenticazione utenti
```

---

<div align="center">

📧 Per supporto tecnico, aprire una issue sul repository del progetto.

**Preventivi Pittura Edile** — © 2026

</div>
