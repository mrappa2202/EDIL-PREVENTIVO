# Come Creare l'Icona (icon.ico)

L'applicazione richiede un file `icon.ico` per l'icona di Windows.

## Opzione 1: Usa un Convertitore Online

1. Prepara un'immagine PNG quadrata (almeno 256x256 pixel)
2. Vai su uno di questi siti:
   - https://icoconvert.com/
   - https://convertio.co/png-ico/
   - https://www.freeconvert.com/png-to-ico
3. Carica la tua immagine PNG
4. Seleziona le dimensioni: 16, 32, 48, 64, 128, 256
5. Scarica il file ICO
6. Rinomina in `icon.ico` e metti nella cartella `electron/`

## Opzione 2: Usa ImageMagick (Avanzato)

Se hai ImageMagick installato:
```cmd
magick convert icon.png -resize 256x256 -define icon:auto-resize="256,128,64,48,32,16" icon.ico
```

## Opzione 3: Usa GIMP

1. Apri GIMP (https://www.gimp.org/)
2. Crea/apri un'immagine 256x256
3. File → Esporta come → icon.ico
4. Seleziona tutte le dimensioni disponibili

## Suggerimenti per il Design

- Usa uno sfondo colorato (es. #005f73 - il colore dell'app)
- Icona semplice e riconoscibile
- Testo minimo (si vedrà male nelle dimensioni piccole)
- Formato quadrato

## Icona Temporanea

Se non hai un'icona pronta, il build funzionerà comunque ma:
- Windows mostrerà un'icona generica
- L'installer non avrà un'icona personalizzata

Potrai sempre sostituire l'icona in seguito e rifare il build.
