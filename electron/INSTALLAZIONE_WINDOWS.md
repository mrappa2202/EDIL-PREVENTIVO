# 🏗️ Preventivi Pittura Edile - VERSIONE STANDALONE v1.1

## ✅ Cosa Significa "Standalone"?

**L'applicazione è completamente autonoma!**

Una volta generato l'EXE, puoi:
1. Copiarlo su qualsiasi PC Windows
2. Eseguirlo con doppio click
3. **NON serve installare Python, Node.js o altro software**

---

## 🚀 Come Generare l'EXE

### Prerequisiti (SOLO per il PC dove fai il build)

1. **Node.js 18+** → https://nodejs.org/ (scarica LTS)
2. **Python 3.10+** → https://www.python.org/downloads/
   - ⚠️ **IMPORTANTE**: Durante l'installazione seleziona **"Add Python to PATH"**

### Procedura

1. Apri il **Prompt dei comandi** (cmd)

2. Vai nella cartella del progetto:
   ```cmd
   cd C:\percorso\preventivi-pittura
   ```

3. Esegui lo script:
   ```cmd
   electron\build-standalone.bat
   ```

4. Attendi 10-15 minuti (la prima volta)

5. Troverai gli EXE in `electron\dist\`

---

## 📦 File Generati

| File | Tipo | Uso |
|------|------|-----|
| `Preventivi Pittura Edile Setup 1.0.0.exe` | Installer | Installa l'app sul PC |
| `PreventiviPittura-Standalone-1.0.0.exe` | Portable | Esegui direttamente, nessuna installazione |

**Consiglio**: Usa la versione **Portable** per semplicità!

---

## 🖥️ Usare l'Applicazione (PC Finale)

### Requisiti PC Finale
- Windows 10/11 (64-bit)
- 300 MB di spazio
- **NIENT'ALTRO!** ✅

### Avvio
1. Copia l'EXE sul PC
2. Doppio click
3. Al primo avvio appare un wizard di configurazione
4. Accedi con: `admin` / `admin123`

---

## 📁 Dove Sono i Dati?

I dati sono salvati in:
```
C:\Users\[UTENTE]\AppData\Roaming\preventivi-pittura-edile\
├── preventivi.db   ← Il tuo database
└── backups\        ← Backup automatici
```

Per accedere: Click destro sull'icona nella barra → "Apri Cartella Dati"

---

## 💾 Backup

- **Automatico**: Ogni 24 ore
- **Manuale**: Click destro icona → "Backup Database"
- Vengono mantenuti gli ultimi 10 backup

---

## 🔧 System Tray

Quando chiudi la finestra, l'app resta attiva nella barra (vicino all'orologio).

**Menu contestuale:**
- Apri Preventivi
- Backup Database
- Apri Cartella Backup
- Apri Cartella Dati
- Esci

---

## ❓ Risoluzione Problemi

### "Backend EXE non trovato"
Lo script di build non ha completato correttamente. Riesegui `build-standalone.bat`.

### L'app non si avvia
1. Prova come Amministratore (click destro → Esegui come amministratore)
2. Controlla l'antivirus (potrebbe bloccare l'app)
3. Verifica che Windows sia 64-bit

### Come trasferire i dati su un altro PC
1. Vai in `AppData\Roaming\preventivi-pittura-edile\`
2. Copia `preventivi.db`
3. Sul nuovo PC, avvia l'app una volta, poi chiudila
4. Incolla il file `preventivi.db` nella stessa cartella

---

## 📋 Checklist Build

- [ ] Node.js installato (`node --version` funziona)
- [ ] Python installato con PATH (`python --version` funziona)
- [ ] Eseguito `electron\build-standalone.bat`
- [ ] Trovato file .exe in `electron\dist\`

---

**Versione**: 1.1.0  
**Ultimo aggiornamento**: Marzo 2026
