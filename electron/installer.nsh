; ============================================================================
; Custom NSIS Installer Script for Preventivi Pittura Edile
; This file is included by electron-builder during NSIS installer generation
; ============================================================================

!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"

; ============================================================================
; CUSTOM HEADER — Called at the beginning
; ============================================================================
!macro customHeader
  !define APP_DATA_FOLDER "$APPDATA\preventivi-pittura-edile"
  !define BACKEND_EXE "$INSTDIR\resources\backend\preventivi-backend.exe"
  !define FIREWALL_RULE_NAME "Preventivi Pittura Backend"
  !define REGISTRY_KEY "Software\PreventiviPittura"
!macroend

; ============================================================================
; PRE-INIT — Called before installer init
; ============================================================================
!macro preInit
  ; Ensure we run with admin privileges for firewall configuration
  RequestExecutionLevel admin
!macroend

; ============================================================================
; CUSTOM INIT — Called during installer init
; ============================================================================
!macro customInit
  ; Display a welcome message in Italian
  MessageBox MB_OK|MB_ICONINFORMATION \
    "Benvenuto nell'installazione di Preventivi Pittura Edile!$\r$\n$\r$\n\
    Questa applicazione consente di gestire preventivi,$\r$\n\
    clienti, materiali e spese per imprese di pittura edile.$\r$\n$\r$\n\
    L'installazione configurerà automaticamente:$\r$\n\
    • L'applicazione desktop$\r$\n\
    • Il server backend locale$\r$\n\
    • Le regole del firewall necessarie$\r$\n$\r$\n\
    Clicca OK per continuare."
!macroend

; ============================================================================
; CUSTOM INSTALL — Called after files are installed
; ============================================================================
!macro customInstall
  ; --- Show installation progress messages ---
  DetailPrint "Configurazione dell'applicazione in corso..."
  DetailPrint ""

  ; --- Add Windows Firewall exception for backend ---
  DetailPrint "Aggiunta regola firewall per il server backend..."
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Preventivi Pittura Backend" dir=in action=allow program="$INSTDIR\resources\backend\preventivi-backend.exe" enable=yes profile=private'
  Pop $0
  ${If} $0 == 0
    DetailPrint "Regola firewall aggiunta con successo."
  ${Else}
    DetailPrint "Attenzione: impossibile aggiungere la regola firewall (codice: $0)."
    DetailPrint "Potrebbe essere necessario configurare manualmente il firewall."
  ${EndIf}
  DetailPrint ""

  ; --- Write registry keys for app info ---
  DetailPrint "Scrittura informazioni nel registro di sistema..."
  WriteRegStr HKCU "${REGISTRY_KEY}" "InstallPath" "$INSTDIR"
  WriteRegStr HKCU "${REGISTRY_KEY}" "Version" "${VERSION}"
  WriteRegStr HKCU "${REGISTRY_KEY}" "ProductName" "Preventivi Pittura Edile"
  WriteRegStr HKCU "${REGISTRY_KEY}" "Publisher" "Pittura Edile S.r.l."
  WriteRegStr HKCU "${REGISTRY_KEY}" "AppDataPath" "${APP_DATA_FOLDER}"
  DetailPrint "Informazioni registro scritte con successo."
  DetailPrint ""

  ; --- Create AppData directory if it doesn't exist ---
  DetailPrint "Creazione cartella dati applicazione..."
  CreateDirectory "${APP_DATA_FOLDER}"
  CreateDirectory "${APP_DATA_FOLDER}\backups"
  DetailPrint "Cartella dati: ${APP_DATA_FOLDER}"
  DetailPrint ""

  DetailPrint "Installazione completata con successo!"
!macroend

; ============================================================================
; CUSTOM UNINSTALL — Called during uninstall
; ============================================================================
!macro customUnInstall
  ; --- Ask user if they want to keep their data ---
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Vuoi conservare i tuoi dati (database e backup)?$\r$\n$\r$\n\
    Seleziona 'Sì' per mantenere i dati in:$\r$\n\
    ${APP_DATA_FOLDER}$\r$\n$\r$\n\
    Seleziona 'No' per eliminare tutti i dati.$\r$\n\
    ATTENZIONE: questa operazione è irreversibile!" \
    IDYES KeepData IDNO DeleteData

  DeleteData:
    ; User chose to delete data
    DetailPrint "Eliminazione dati applicazione..."
    RMDir /r "${APP_DATA_FOLDER}"
    DetailPrint "Dati applicazione eliminati."
    Goto DataDone

  KeepData:
    ; User chose to keep data
    DetailPrint "I dati dell'applicazione verranno conservati in:"
    DetailPrint "${APP_DATA_FOLDER}"

  DataDone:

  ; --- Remove Windows Firewall rule ---
  DetailPrint "Rimozione regola firewall..."
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Preventivi Pittura Backend"'
  Pop $0
  ${If} $0 == 0
    DetailPrint "Regola firewall rimossa con successo."
  ${Else}
    DetailPrint "Attenzione: impossibile rimuovere la regola firewall (codice: $0)."
  ${EndIf}

  ; --- Remove registry keys ---
  DetailPrint "Rimozione informazioni dal registro di sistema..."
  DeleteRegKey HKCU "${REGISTRY_KEY}"
  DetailPrint "Informazioni registro rimosse."

  DetailPrint "Disinstallazione completata."
!macroend
