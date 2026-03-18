const { app, BrowserWindow, Tray, Menu, nativeImage, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
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
const resourcesPath = isDev ? __dirname : process.resourcesPath;
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'preventivi.db');
const backupDir = path.join(userDataPath, 'backups');

// Backend executable path (PyInstaller generated)
const backendExePath = isDev 
    ? path.join(__dirname, 'backend', 'dist', 'preventivi-backend.exe')
    : path.join(resourcesPath, 'backend', 'preventivi-backend.exe');

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

    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
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
        icon = nativeImage.createFromPath(iconPath);
        icon = icon.resize({ width: 16, height: 16 });
    } catch (e) {
        console.log('Icon not found, using default');
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
        console.log('Starting backend server (standalone)...');
        console.log('Backend path:', backendExePath);
        console.log('DB path:', dbPath);
        
        // Check if backend exists
        if (!fs.existsSync(backendExePath)) {
            const error = new Error(`Backend non trovato: ${backendExePath}`);
            console.error(error.message);
            reject(error);
            return;
        }
        
        // Set environment variables
        const env = {
            ...process.env,
            DB_PATH: dbPath,
            HOST: '127.0.0.1',
            PORT: '8001'
        };
        
        backendProcess = spawn(backendExePath, [], {
            env: env,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true
        });
        
        let started = false;
        
        backendProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('Backend:', output);
            if (output.includes('Uvicorn running') || output.includes('Application startup complete') || output.includes('Started server')) {
                if (!started) {
                    started = true;
                    resolve();
                }
            }
        });
        
        backendProcess.stderr.on('data', (data) => {
            const output = data.toString();
            console.error('Backend stderr:', output);
            // Uvicorn logs to stderr by default
            if (output.includes('Uvicorn running') || output.includes('Application startup complete') || output.includes('Started server')) {
                if (!started) {
                    started = true;
                    resolve();
                }
            }
        });
        
        backendProcess.on('error', (err) => {
            console.error('Failed to start backend:', err);
            reject(err);
        });
        
        backendProcess.on('close', (code) => {
            console.log('Backend process exited with code:', code);
            if (!started) {
                reject(new Error(`Backend closed with code: ${code}`));
            }
        });
        
        // Timeout - try to continue anyway after 10 seconds
        setTimeout(() => {
            if (!started) {
                console.log('Backend startup timeout, attempting to continue...');
                started = true;
                resolve();
            }
        }, 10000);
    });
}

// Stop backend server
function stopBackend() {
    if (backendProcess) {
        console.log('Stopping backend server...');
        
        // On Windows, we need to kill the process tree
        if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
        } else {
            backendProcess.kill('SIGTERM');
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
            detail: 'Non è possibile creare un backup perché il database non esiste ancora.'
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
            message: 'Backup creato con successo',
            detail: `Il backup è stato salvato in:\n${backupPath}`
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
    
    setTimeout(scheduleAutoBackup, 60 * 60 * 1000); // Check every hour
}

// First run setup wizard
async function showSetupWizard() {
    const result = await dialog.showMessageBox({
        type: 'info',
        title: 'Benvenuto in Preventivi Pittura Edile',
        message: 'Configurazione iniziale',
        detail: 'È la prima volta che avvii l\'applicazione.\n\nL\'applicazione creerà automaticamente:\n• Un database locale per i tuoi dati\n• Una cartella per i backup automatici\n\nI tuoi dati saranno salvati in:\n' + userDataPath + '\n\nNessuna installazione di software aggiuntivo è richiesta!',
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
    ensureDirectories();
    
    // Show splash
    createSplashWindow();
    
    // First run check
    if (store.get('isFirstRun')) {
        const proceed = await showSetupWizard();
        if (!proceed) return;
    }
    
    // Start backend
    try {
        await startBackend();
        console.log('Backend started successfully');
    } catch (err) {
        console.error('Backend startup error:', err);
        
        const result = await dialog.showMessageBox({
            type: 'error',
            title: 'Errore Avvio',
            message: 'Impossibile avviare il server backend',
            detail: 'Errore: ' + err.message + '\n\nVuoi provare ad avviare comunque l\'applicazione?',
            buttons: ['Riprova', 'Avvia Comunque', 'Esci'],
            defaultId: 0
        });
        
        if (result.response === 2) {
            app.quit();
            return;
        }
        
        if (result.response === 0) {
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
    // Keep running in tray
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
    dialog.showMessageBox({
        type: 'error',
        title: 'Errore',
        message: 'Si è verificato un errore imprevisto',
        detail: error.message
    });
});
