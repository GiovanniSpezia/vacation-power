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

## Salvataggio dei dati: locale vs gruppo

- **Senza login**: l'app funziona comunque, sempre. I dati (case,
  elettrodomestici, limiti) restano salvati solo su quel dispositivo/
  browser (`localStorage`). Ogni telefono/PC ha i propri dati,
  indipendenti dagli altri.
- **Con login** (account di gruppo `leanime`): tutti i dispositivi che
  fanno accesso con lo stesso account vedono e aggiornano **gli stessi
  dati in tempo reale**. Appena accendi/spegni un elettrodomestico, cambi
  casa o modifichi un limite, la modifica viene pubblicata subito su un
  piccolo database condiviso (Firebase Realtime Database) e arriva a
  tutti gli altri dispositivi collegati, senza bisogno di ricaricare la
  pagina.

Il pulsante 🔐 in alto apre il login; una volta dentro diventa ⎋ per
uscire dal gruppo (i dati restano comunque salvati in locale anche dopo
il logout).

## Impostazione della sincronizzazione di gruppo (una volta sola)

La sincronizzazione tra dispositivi usa **Firebase Realtime Database**
(gratuito, di Google), perché un sito statico su GitHub Pages non ha un
proprio server/database. Va configurato **una sola volta per tutto il
progetto**, non su ogni dispositivo:

1. Vai su https://console.firebase.google.com e crea un progetto (anche
   gratuito, es. "vacation-power").
2. Nel menu apri **Realtime Database → Crea database**, scegli una
   regione, avvialo in modalità "test".
3. Vai su **Impostazioni progetto → Le tue app → Aggiungi app Web** (icona
   `</>`), dagli un nome e registrala.
4. Firebase mostrerà un oggetto `firebaseConfig`: copia quei valori dentro
   `js/firebaseConfig.js` (nel repository), al posto dei segnaposto.
5. In **Realtime Database → Regole** incolla:
   ```json
   {
     "rules": {
       "groups": {
         "leanime": {
           ".read": true,
           ".write": true
         }
       },
       "$other": {
         ".read": false,
         ".write": false
       }
     }
   }
   ```
6. Carica `js/firebaseConfig.js` aggiornato sul repository GitHub (o
   Pages). Da quel momento, chiunque faccia login nell'app vede subito i
   dati condivisi, senza configurare nulla sul proprio dispositivo.

**Nota sulla sicurezza**: non essendoci un vero server, questa modalità
resta adatta a un piccolo gruppo di fiducia (protetto dalla password di
login), non a dati sensibili: chiunque conoscesse l'indirizzo del
database potrebbe in teoria leggerlo o scriverlo.

## Struttura del progetto

```
vacation-power/
├── index.html            Pagina principale
├── manifest.json         Per installare l'app sulla home del telefono
├── css/
│   └── style.css         Stile grafico
├── js/
│   ├── defaultData.js    Elenco predefinito di elettrodomestici
│   ├── storage.js        Salvataggio locale + login + esportazione/importazione JSON
│   ├── firebaseConfig.js Configurazione del database condiviso (da compilare una volta)
│   ├── groupSync.js      Sincronizzazione in tempo reale tra dispositivi loggati
│   ├── gauge.js          Disegno del quadrante circolare
│   └── app.js            Logica dell'interfaccia
└── icons/                Icone dell'app
```
