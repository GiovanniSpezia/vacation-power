# Vacation Power ⚡

Contatore virtuale di potenza per case vacanza (Airbnb, B&B, affitti brevi).
Ti aiuta a non superare la potenza massima della casa e a non far scattare
il salvavita, tenendo traccia di quali elettrodomestici hai acceso.

## Come funziona

Non esiste un modo per collegare un sito web direttamente al contatore
elettrico reale di una casa che non è tua (servirebbe un dispositivo
hardware dedicato, tipo pinza amperometrica o smart plug già installati
dal proprietario). La soluzione pratica adottata qui è un **calcolo
manuale in tempo reale**:

1. Imposti il limite di potenza della casa (in kW o in Ampere), che trovi
   scritto sul contatore o sull'interruttore generale (salvavita).
2. Attivi l'interruttore virtuale accanto a ogni elettrodomestico che
   accendi davvero in quel momento.
3. L'app somma i watt di tutto ciò che è acceso e mostra un quadrante
   con lo stato: verde (tutto ok), giallo (vicino al limite), rosso
   (limite superato, spegni qualcosa).

## Struttura del progetto

```
vacation-power/
├── index.html          Pagina principale
├── manifest.json        Per installare l'app sulla home del telefono
├── css/
│   └── style.css        Stile grafico
├── js/
│   ├── defaultData.js   Elenco predefinito di elettrodomestici
│   ├── storage.js       Salvataggio locale + esportazione/importazione JSON
│   ├── gauge.js          Disegno del quadrante circolare
│   └── app.js            Logica dell'interfaccia
└── icons/               Icone dell'app
```

## Salvataggio dei dati

- **In locale**: tutti i dati (case, elettrodomestici, limiti) vengono
  salvati automaticamente nel `localStorage` del browser. Funziona anche
  aprendo `index.html` offline, senza server.
- **Backup / trasferimento dati**: dal pannello "Dati e backup" puoi
  scaricare un file `.json` (di una singola casa o di tutto), utile per:
  - fare un backup,
  - portare i dati su un altro telefono/computer,
  - versionare i tuoi profili "casa" dentro il repository GitHub stesso.

  Lo stesso pannello permette di importare un file `.json` esportato in
  precedenza.

## Più case contemporaneamente

Puoi creare un profilo per ogni casa vacanza (limite di potenza ed
elenco elettrodomestici diversi) e passare dall'uno all'altro dal menu
in alto.

## Pubblicazione su GitHub Pages

1. Crea un repository chiamato ad esempio `vacation-power` e carica
   tutto il contenuto di questa cartella nella root del repository.
2. Vai su **Settings → Pages**, scegli il branch `main` e la cartella
   `/ (root)`.
3. Il sito sarà raggiungibile su `https://<tuo-utente>.github.io/vacation-power/`.

Essendo un sito statico (nessun backend/database), il salvataggio resta
quello descritto sopra: locale nel browser + esportazione/importazione
JSON manuale.

## Aggiungere l'app alla home del telefono

Aprendo il sito da smartphone, usa la funzione del browser "Aggiungi a
schermata Home": grazie al `manifest.json` incluso, l'app si comporterà
come un'icona a schermo intero, utile per l'uso rapido in vacanza anche
senza connessione.
