const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // Backup functions
    createBackup: () => ipcRenderer.invoke('create-backup'),
    getLastBackup: () => ipcRenderer.invoke('get-last-backup'),
    
    // Settings
    getSetting: (key) => ipcRenderer.invoke('get-setting', key),
    setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
    
    // Window controls
    minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
    
    // Platform info
    platform: process.platform,
    isElectron: true
});

// Notify renderer when app is ready
window.addEventListener('DOMContentLoaded', () => {
    console.log('Preload script loaded - Electron environment detected');
});
