# 🏗️ Preventivi Pittura Edile - Guida Installazione Windows

## Applicazione Desktop per la Gestione Preventivi

Questa guida ti accompagnerà passo-passo nell'installazione e configurazione dell'applicazione sul tuo PC Windows.

---

## 📋 Requisiti di Sistema

### Hardware Minimo
- **Processore**: Intel Core i3 o equivalente
- **RAM**: 4 GB
- **Spazio disco**: 500 MB liberi
- **Sistema Operativo**: Windows 10/11 (64-bit)

### Software Necessario

#### 1. Node.js (per il build)
- **Versione**: 18 o superiore
- **Download**: https://nodejs.org/
- Scegli la versione **LTS** (Long Term Support)

#### 2. Python (per il backend)
- **Versione**: 3.10 o superiore
- **Download**: https://www.python.org/downloads/
- ⚠️ **IMPORTANTE**: Durante l'installazione, seleziona **"Add Python to PATH"**

#### 3. Git (opzionale, per clonare il progetto)
- **Download**: https://git-scm.com/download/win

---

## 🚀 Installazione Passo-Passo

### PASSO 1: Installa Node.js

1. Vai su https://nodejs.org/
2. Scarica la versione **LTS** (es. 20.x.x LTS)
3. Esegui l'installer `.msi`
4. Clicca **Next** su tutte le schermate
5. Alla fine, clicca **Install**

**Verifica installazione:**
```cmd
node --version
npm --version
```
Dovresti vedere i numeri di versione (es. `v20.10.0` e `10.2.3`)

---

### PASSO 2: Installa Python

1. Vai su https://www.python.org/downloads/
2. Clicca su **Download Python 3.12.x** (o versione più recente)
3. Esegui l'installer
4. ⚠️ **IMPORTANTE**: Spunta la casella **"Add Python 3.x to PATH"** in basso
5. Clicca **Install Now**

**Verifica installazione:**
```cmd
python --version
pip --version
```
Dovresti vedere i numeri di versione (es. `Python 3.12.0` e `pip 23.3.1`)

---

### PASSO 3: Installa le Dipendenze Python

Apri il **Prompt dei comandi** (cerca "cmd" nel menu Start) ed esegui:

```cmd
pip install fastapi uvicorn aiosqlite pyjwt python-multipart reportlab python-dateutil
```

Attendi il completamento dell'installazione.

---

### PASSO 4: Scarica il Progetto

**Opzione A - Con Git:**
```cmd
git clone [URL_DEL_PROGETTO] preventivi-pittura
cd preventivi-pittura
```

**Opzione B - Download ZIP:**
1. Scarica il file ZIP del progetto
2. Estrai in una cartella (es. `C:\preventivi-pittura`)
3. Apri il Prompt dei comandi e vai nella cartella:
```cmd
cd C:\preventivi-pittura
```

---

### PASSO 5: Genera l'Applicazione Desktop

Dalla cartella principale del progetto, esegui:

```cmd
electron\build.bat
```

Questo script automatizzato:
1. ✅ Verifica i requisiti
2. ✅ Compila il frontend React
3. ✅ Prepara il backend Python
4. ✅ Genera l'eseguibile Windows

**Tempo stimato**: 5-10 minuti (dipende dalla connessione internet)

---

### PASSO 6: Installa l'Applicazione

Al termine del build, troverai i file in `electron\dist\`:

| File | Descrizione |
|------|-------------|
| `Preventivi Pittura Edile Setup 1.0.0.exe` | **Installer** - Installa l'app nel PC |
| `PreventiviPittura-Portable-1.0.0.exe` | **Portable** - Eseguibile diretto (no installazione) |

**Per installare:**
1. Vai nella cartella `electron\dist\`
2. Doppio click su `Preventivi Pittura Edile Setup 1.0.0.exe`
3. Segui la procedura guidata
4. L'app verrà installata e apparirà un'icona sul desktop

**Per versione portable:**
1. Copia `PreventiviPittura-Portable-1.0.0.exe` dove preferisci
2. Doppio click per avviare (nessuna installazione richiesta)

---

## 🖥️ Primo Avvio

1. Avvia l'applicazione dal desktop o dal menu Start
2. Apparirà una **schermata di benvenuto** (Setup Wizard)
3. Clicca **Continua** per configurare automaticamente:
   - Database locale
   - Cartella backup
4. L'applicazione si aprirà

**Credenziali di accesso predefinite:**
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Consiglio**: Cambia la password dopo il primo accesso!

---

## 📁 Dove Vengono Salvati i Dati?

I tuoi dati sono salvati in una cartella sicura di Windows:

```
C:\Users\[TUO_UTENTE]\AppData\Roaming\preventivi-pittura-edile\
```

Contiene:
- `preventivi.db` - Il database con tutti i tuoi dati
- `backups\` - Cartella con i backup automatici

---

## 💾 Backup Automatici

L'applicazione crea **backup automatici** ogni 24 ore:
- Vengono mantenuti gli **ultimi 10 backup**
- Salvati in `AppData\Roaming\preventivi-pittura-edile\backups\`

**Per creare un backup manuale:**
1. Click destro sull'icona nella **System Tray** (vicino all'orologio)
2. Seleziona **"Backup Database"**

**Per accedere ai backup:**
1. Click destro sull'icona nella System Tray
2. Seleziona **"Apri Cartella Backup"**

---

## 🔧 System Tray (Icona nell'Area di Notifica)

Quando chiudi la finestra, l'app **non si chiude** ma si riduce nella System Tray (vicino all'orologio).

**Opzioni disponibili (click destro sull'icona):**
- **Apri Preventivi** - Riapre la finestra principale
- **Backup Database** - Crea un backup manuale
- **Apri Cartella Backup** - Apre la cartella dei backup
- **Esci** - Chiude completamente l'applicazione

**Per riaprire la finestra:**
- Doppio click sull'icona nella System Tray

---

## ❓ Risoluzione Problemi

### "Python non è riconosciuto come comando"
**Soluzione:**
1. Disinstalla Python
2. Reinstalla Python
3. ⚠️ Assicurati di selezionare **"Add Python to PATH"**

### "npm non è riconosciuto come comando"
**Soluzione:**
1. Riavvia il Prompt dei comandi
2. Se non funziona, riavvia il PC
3. Se ancora non funziona, reinstalla Node.js

### "Errore durante il build"
**Soluzione:**
1. Assicurati di essere nella cartella corretta del progetto
2. Verifica che tutti i requisiti siano installati:
```cmd
node --version
python --version
pip --version
```
3. Riprova il build

### "L'applicazione non si avvia"
**Soluzione:**
1. Verifica che Python sia installato e nel PATH
2. Prova la versione Portable invece dell'Installer
3. Controlla l'antivirus (potrebbe bloccare l'app)

### "Database non trovato"
**Soluzione:**
Il database viene creato al primo avvio. Se non esiste:
1. Elimina la cartella `AppData\Roaming\preventivi-pittura-edile\`
2. Riavvia l'applicazione

---

## 📞 Supporto

Per assistenza tecnica:
- Controlla questa guida
- Verifica i requisiti di sistema
- Riprova l'installazione da zero

---

## 📝 Note Tecniche

### Struttura del Progetto
```
preventivi-pittura/
├── backend/           # Server Python (FastAPI)
├── frontend/          # Interfaccia React
├── electron/          # Configurazione desktop
│   ├── main.js        # Entry point Electron
│   ├── build.bat      # Script build Windows
│   ├── build.sh       # Script build Linux/Mac
│   └── dist/          # Output: file .exe generati
└── memory/            # Documentazione
```

### Porte Utilizzate
- **Backend**: `127.0.0.1:8001` (solo locale)
- **Frontend**: Integrato nell'app Electron

### Sicurezza
- I dati sono salvati **solo localmente** sul tuo PC
- Nessuna connessione a server esterni
- Password criptate con algoritmo sicuro (bcrypt)
- Token JWT per l'autenticazione

---

## ✅ Checklist Pre-Installazione

- [ ] Windows 10/11 (64-bit)
- [ ] Node.js 18+ installato
- [ ] Python 3.10+ installato (con PATH)
- [ ] Dipendenze Python installate
- [ ] Progetto scaricato/clonato
- [ ] 500 MB di spazio libero

---

**Versione**: 1.0.0  
**Ultimo aggiornamento**: Dicembre 2025
