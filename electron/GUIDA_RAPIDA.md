# ⚡ Guida Rapida - Installazione in 5 Minuti

## Prerequisiti (scarica e installa in ordine)

1. **Node.js** → https://nodejs.org/ (versione LTS)
2. **Python** → https://www.python.org/downloads/
   - ⚠️ Seleziona "Add Python to PATH" durante l'installazione!

## Comandi da Eseguire

Apri il **Prompt dei comandi** (cmd) ed esegui:

```cmd
:: 1. Installa dipendenze Python
pip install fastapi uvicorn aiosqlite pyjwt python-multipart reportlab python-dateutil

:: 2. Vai nella cartella del progetto
cd C:\percorso\preventivi-pittura

:: 3. Genera l'applicazione
electron\build.bat
```

## Risultato

Troverai gli eseguibili in `electron\dist\`:
- **Setup**: `Preventivi Pittura Edile Setup 1.0.0.exe`
- **Portable**: `PreventiviPittura-Portable-1.0.0.exe`

## Primo Accesso

- **Username**: `admin`
- **Password**: `admin123`

---
Per istruzioni dettagliate, vedi `INSTALLAZIONE_WINDOWS.md`
