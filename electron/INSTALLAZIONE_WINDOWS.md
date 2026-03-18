# 🏗️ Preventivi Pittura Edile - VERSIONE STANDALONE

## ✅ Cosa Significa "Standalone"?

**L'applicazione è completamente autonoma!**

Una volta generato l'EXE, puoi:
1. Copiarlo su qualsiasi PC Windows
2. Eseguirlo con doppio click
3. **NON serve installare Python, Node.js o altro software**

Tutto ciò che serve è incluso nell'EXE.

---

## 🚀 Come Generare l'EXE (Una Sola Volta)

### Prerequisiti (solo per il BUILD, non per l'uso finale)

Sul PC dove fai il build, installa:

1. **Node.js 18+** → https://nodejs.org/ (versione LTS)
2. **Python 3.10+** → https://www.python.org/downloads/
   - ⚠️ **IMPORTANTE**: Seleziona "Add Python to PATH"

### Procedura Build

1. **Apri il Prompt dei comandi** (cmd)

2. **Vai nella cartella del progetto**:
   ```cmd
   cd C:\percorso\preventivi-pittura
   ```

3. **Esegui lo script di build**:
   ```cmd
   electron\build-standalone.bat
   ```

4. **Attendi** (10-15 minuti la prima volta)

5. **Trova gli EXE** in `electron\dist\`:
   - `Preventivi Pittura Edile Setup 1.0.0.exe` → Installer
   - `PreventiviPittura-Standalone-1.0.0.exe` → Portable

---

## 📦 Usare l'Applicazione

### Versione Portable (Consigliata)

1. Copia `PreventiviPittura-Standalone-1.0.0.exe` sul PC di destinazione
2. Doppio click per avviare
3. **FATTO!** Nessuna installazione richiesta

### Versione Installer

1. Copia `Preventivi Pittura Edile Setup 1.0.0.exe` sul PC
2. Doppio click per installare
3. Segui la procedura guidata
4. L'app apparirà nel menu Start e sul desktop

---

## 🔐 Primo Accesso

**Credenziali predefinite:**
- Username: `admin`
- Password: `admin123`

⚠️ Cambia la password dopo il primo accesso!

---

## 📁 Dove Sono Salvati i Dati?

```
C:\Users\[UTENTE]\AppData\Roaming\preventivi-pittura-edile\
├── preventivi.db      ← Database (tutti i tuoi dati)
└── backups\           ← Backup automatici
```

---

## 💾 Backup

### Automatici
- Ogni 24 ore l'app crea un backup
- Vengono mantenuti gli ultimi 10 backup

### Manuali
- Click destro sull'icona nella barra di sistema (vicino all'orologio)
- Seleziona "Backup Database"

---

## 🔧 System Tray

Quando chiudi la finestra, l'app **non si chiude** ma resta attiva nella barra di sistema.

**Menu (click destro sull'icona):**
- Apri Preventivi
- Backup Database
- Apri Cartella Backup
- Apri Cartella Dati
- Esci

---

## ❓ FAQ

### "Posso usare l'app su più PC?"
Sì! Copia l'EXE su ogni PC. Ogni PC avrà il suo database locale.

### "Come trasferisco i dati su un altro PC?"
Copia il file `preventivi.db` dalla cartella dati del PC vecchio a quella del nuovo.

### "L'antivirus blocca l'app"
Alcune app impacchettate con PyInstaller possono essere segnalate. Aggiungi un'eccezione nell'antivirus.

### "L'app non si avvia"
1. Prova ad eseguire come Amministratore
2. Verifica che Windows sia 64-bit
3. Controlla i log nella cartella dati

---

## 📋 Requisiti Sistema (PC Finale)

| Requisito | Minimo |
|-----------|--------|
| Sistema | Windows 10/11 64-bit |
| RAM | 4 GB |
| Spazio | 300 MB |
| **Python** | ❌ **NON richiesto** |
| **Node.js** | ❌ **NON richiesto** |
| **Altri software** | ❌ **NESSUNO** |

---

## 📝 Note Tecniche

- L'app usa **SQLite** come database (tutto in un file)
- Il backend Python è stato convertito in EXE con **PyInstaller**
- Il frontend React è stato compilato e incluso
- Tutto è impacchettato insieme con **Electron**

---

**Versione**: 1.0.0 Standalone  
**Ultimo aggiornamento**: Dicembre 2025
