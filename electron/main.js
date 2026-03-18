const { app, BrowserWindow, Tray, Menu, nativeImage, dialog, shell } = require('electron');
const path = require('path');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const Store = require('electron-store');

// Configuration store
const store = new Store({
    defaults: {
        isFirstRun: true,
        backupEnabled: true,
        backupInterval: 24,
        lastBackup: null,
        windowBounds: { width: 1400, height: 900 }
    }
});

// Global references
let mainWindow = null;
let splashWindow = null;
let tray = null;
let backendProcess = null;
let isQuitting = false;

// Paths
const isDev = !app.isPackaged;
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'preventivi.db');
const backupDir = path.join(userDataPath, 'backups');

// Get the correct backend path based on environment
function getBackendPath() {
    if (isDev) {
        // Development mode - look in backend/dist folder
        return path.join(__dirname, 'backend', 'dist', 'preventivi-backend.exe');
    } else {
        // Production mode - look in resources folder
        // electron-builder puts extraResources in process.resourcesPath
        const possiblePaths = [
            path.join(process.resourcesPath, 'backend', 'preventivi-backend.exe'),
            path.join(process.resourcesPath, 'preventivi-backend.exe'),
            path.join(path.dirname(app.getPath('exe')), 'resources', 'backend', 'preventivi-backend.exe'),
            path.join(path.dirname(app.getPath('exe')), 'backend', 'preventivi-backend.exe'),
        ];
        
        for (const p of possiblePaths) {
            console.log('Checking backend path:', p);
            if (fs.existsSync(p)) {
                console.log('Found backend at:', p);
                return p;
            }
        }
        
        // Return first path as default (will show error)
        return possiblePaths[0];
    }
}

// Ensure directories exist
function ensureDirectories() {
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
}

// Create splash screen
function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 500,
        height: 350,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    
    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
    splashWindow.center();
}

// Create main window
function createMainWindow() {
    const bounds = store.get('windowBounds');
    
    mainWindow = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        minWidth: 1024,
        minHeight: 700,
        show: false,
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the app - always use localhost since backend runs locally
    const frontendUrl = isDev 
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, 'frontend-build', 'index.html')}`;
    
    console.log('Loading frontend from:', frontendUrl);
    
    if (isDev) {
        mainWindow.loadURL(frontendUrl);
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'frontend-build', 'index.html'));
    }

    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            
            if (tray) {
                tray.displayBalloon({
                    title: 'Preventivi Pittura Edile',
                    content: 'L\'applicazione continua in background. Clicca sull\'icona per riaprirla.',
                    iconType: 'info'
                });
            }
        } else {
            const bounds = mainWindow.getBounds();
            store.set('windowBounds', bounds);
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.once('ready-to-show', () => {
        if (splashWindow) {
            splashWindow.destroy();
            splashWindow = null;
        }
        mainWindow.show();
        mainWindow.focus();
    });
}

// Create system tray
function createTray() {
    const iconPath = path.join(__dirname, 'icon.ico');
    let icon;
    
    try {
        if (fs.existsSync(iconPath)) {
            icon = nativeImage.createFromPath(iconPath);
            icon = icon.resize({ width: 16, height: 16 });
        } else {
            icon = nativeImage.createEmpty();
        }
    } catch (e) {
        console.log('Icon error:', e);
        icon = nativeImage.createEmpty();
    }
    
    tray = new Tray(icon);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Apri Preventivi',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Backup Database',
            click: () => createBackup()
        },
        {
            label: 'Apri Cartella Backup',
            click: () => shell.openPath(backupDir)
        },
        {
            label: 'Apri Cartella Dati',
            click: () => shell.openPath(userDataPath)
        },
        { type: 'separator' },
        {
            label: 'Esci',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip('Preventivi Pittura Edile');
    tray.setContextMenu(contextMenu);
    
    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// Start backend server (STANDALONE EXE VERSION)
function startBackend() {
    return new Promise((resolve, reject) => {
        const backendExePath = getBackendPath();
        
        console.log('=== BACKEND STARTUP ===');
        console.log('isDev:', isDev);
        console.log('Backend EXE path:', backendExePath);
        console.log('DB path:', dbPath);
        console.log('User data path:', userDataPath);
        
        // Check if backend exists
        if (!fs.existsSync(backendExePath)) {
            const error = new Error(`Backend EXE non trovato!\n\nPercorso cercato:\n${backendExePath}\n\nAssicurati che il build sia stato completato correttamente.`);
            console.error(error.message);
            reject(error);
            return;
        }
        
        console.log('Backend EXE found, starting...');
        
        // Set environment variables for the backend
        const env = {
            ...process.env,
            DB_PATH: dbPath,
            HOST: '127.0.0.1',
            PORT: '8001'
        };
        
        // Use execFile for .exe files on Windows
        backendProcess = spawn(backendExePath, [], {
            env: env,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true,
            detached: false
        });
        
        let started = false;
        let outputBuffer = '';
        
        backendProcess.stdout.on('data', (data) => {
            const output = data.toString();
            outputBuffer += output;
            console.log('Backend stdout:', output);
            
            if (!started && (
                output.includes('Uvicorn running') || 
                output.includes('Application startup complete') || 
                output.includes('Started server') ||
                output.includes('INFO:')
            )) {
                started = true;
                console.log('Backend started successfully!');
                resolve();
            }
        });
        
        backendProcess.stderr.on('data', (data) => {
            const output = data.toString();
            outputBuffer += output;
            console.log('Backend stderr:', output);
            
            // Uvicorn logs startup messages to stderr
            if (!started && (
                output.includes('Uvicorn running') || 
                output.includes('Application startup complete') || 
                output.includes('Started server') ||
                output.includes('INFO:')
            )) {
                started = true;
                console.log('Backend started successfully (from stderr)!');
                resolve();
            }
        });
        
        backendProcess.on('error', (err) => {
            console.error('Backend process error:', err);
            reject(new Error(`Errore avvio backend: ${err.message}`));
        });
        
        backendProcess.on('close', (code) => {
            console.log('Backend process closed with code:', code);
            console.log('Output buffer:', outputBuffer);
            if (!started) {
                reject(new Error(`Backend terminato con codice: ${code}\n\nOutput:\n${outputBuffer.slice(-500)}`));
            }
        });
        
        // Timeout - assume started after 8 seconds if no crash
        setTimeout(() => {
            if (!started && backendProcess && !backendProcess.killed) {
                console.log('Backend startup timeout - assuming started');
                started = true;
                resolve();
            }
        }, 8000);
    });
}

// Stop backend server
function stopBackend() {
    if (backendProcess) {
        console.log('Stopping backend server...');
        
        try {
            // On Windows, kill the process tree
            if (process.platform === 'win32') {
                spawn('taskkill', ['/pid', backendProcess.pid.toString(), '/f', '/t'], {
                    windowsHide: true
                });
            } else {
                backendProcess.kill('SIGTERM');
            }
        } catch (e) {
            console.error('Error stopping backend:', e);
        }
        
        backendProcess = null;
    }
}

// Create database backup
function createBackup() {
    if (!fs.existsSync(dbPath)) {
        dialog.showMessageBox({
            type: 'warning',
            title: 'Backup',
            message: 'Database non trovato',
            detail: 'Non è possibile creare un backup perché il database non esiste ancora.\nAvvia l\'applicazione e crea almeno un dato.'
        });
        return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `preventivi-backup-${timestamp}.db`);
    
    try {
        fs.copyFileSync(dbPath, backupPath);
        store.set('lastBackup', Date.now());
        
        dialog.showMessageBox({
            type: 'info',
            title: 'Backup Completato',
            message: 'Backup creato con successo!',
            detail: `Salvato in:\n${backupPath}`
        });
        
        cleanOldBackups();
    } catch (err) {
        dialog.showMessageBox({
            type: 'error',
            title: 'Errore Backup',
            message: 'Impossibile creare il backup',
            detail: err.message
        });
    }
}

// Clean old backups (keep last 10)
function cleanOldBackups() {
    try {
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('preventivi-backup-'))
            .map(f => ({
                name: f,
                path: path.join(backupDir, f),
                time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);
        
        if (files.length > 10) {
            files.slice(10).forEach(f => {
                fs.unlinkSync(f.path);
                console.log('Deleted old backup:', f.name);
            });
        }
    } catch (err) {
        console.error('Error cleaning backups:', err);
    }
}

// Auto backup scheduler
function scheduleAutoBackup() {
    const backupEnabled = store.get('backupEnabled');
    const backupInterval = store.get('backupInterval') * 60 * 60 * 1000;
    const lastBackup = store.get('lastBackup');
    
    if (backupEnabled && fs.existsSync(dbPath)) {
        const now = Date.now();
        if (!lastBackup || (now - lastBackup) > backupInterval) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `preventivi-backup-${timestamp}.db`);
            try {
                fs.copyFileSync(dbPath, backupPath);
                store.set('lastBackup', now);
                console.log('Auto backup created:', backupPath);
                cleanOldBackups();
            } catch (err) {
                console.error('Auto backup failed:', err);
            }
        }
    }
    
    setTimeout(scheduleAutoBackup, 60 * 60 * 1000);
}

// First run setup wizard
async function showSetupWizard() {
    const result = await dialog.showMessageBox({
        type: 'info',
        title: 'Benvenuto in Preventivi Pittura Edile',
        message: 'Prima configurazione',
        detail: `È la prima volta che avvii l'applicazione.

Verrà creato automaticamente:
• Un database locale per i tuoi dati
• Una cartella per i backup automatici

I dati saranno salvati in:
${userDataPath}

Nessun software aggiuntivo è richiesto!`,
        buttons: ['Continua', 'Annulla'],
        defaultId: 0,
        cancelId: 1
    });
    
    if (result.response === 1) {
        app.quit();
        return false;
    }
    
    store.set('isFirstRun', false);
    return true;
}

// App ready handler
app.whenReady().then(async () => {
    console.log('=== APP STARTING ===');
    console.log('App path:', app.getAppPath());
    console.log('Exe path:', app.getPath('exe'));
    console.log('Resources path:', process.resourcesPath);
    console.log('User data path:', userDataPath);
    
    ensureDirectories();
    
    // Show splash
    createSplashWindow();
    
    // First run check
    if (store.get('isFirstRun')) {
        if (splashWindow) {
            splashWindow.hide();
        }
        const proceed = await showSetupWizard();
        if (!proceed) return;
        if (splashWindow) {
            splashWindow.show();
        }
    }
    
    // Start backend
    try {
        await startBackend();
        console.log('Backend ready!');
    } catch (err) {
        console.error('Backend startup error:', err);
        
        if (splashWindow) {
            splashWindow.hide();
        }
        
        const result = await dialog.showMessageBox({
            type: 'error',
            title: 'Errore Avvio Backend',
            message: 'Impossibile avviare il server',
            detail: `${err.message}\n\nVuoi provare ad avviare comunque l'interfaccia?`,
            buttons: ['Riprova', 'Avvia Senza Backend', 'Esci'],
            defaultId: 0
        });
        
        if (result.response === 2) {
            app.quit();
            return;
        }
        
        if (result.response === 0) {
            if (splashWindow) {
                splashWindow.show();
            }
            try {
                await startBackend();
            } catch (e) {
                console.error('Second attempt failed:', e);
            }
        }
    }
    
    // Create window and tray
    createMainWindow();
    createTray();
    
    // Start auto backup scheduler
    scheduleAutoBackup();
});

// Handle all windows closed
app.on('window-all-closed', () => {
    // Keep running in tray on Windows
});

// Handle app activation
app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    } else {
        mainWindow.show();
    }
});

// Handle app quit
app.on('before-quit', () => {
    isQuitting = true;
    stopBackend();
});

// Handle second instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});
