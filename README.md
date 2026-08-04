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
