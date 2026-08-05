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

## Account di gruppo: registrazione, login e profilo

- **Senza login**: l'app funziona comunque, sempre. I dati (case,
  elettrodomestici, limiti) restano salvati solo su quel dispositivo/
  browser (`localStorage`). Ogni telefono/PC ha i propri dati,
  indipendenti dagli altri.
- **Registrazione**: chiunque può creare un nuovo gruppo vacanza dal
  pulsante 🔐 → scheda "Nuovo gruppo", scegliendo un nome gruppo, il
  proprio nome e una password. Il nome gruppo diventa l'identificativo
  univoco usato per accedere (es. "leanime").
- **Login**: chi conosce nome gruppo e password entra e da quel momento
  vede e aggiorna **gli stessi dati in tempo reale** di tutti gli altri
  dispositivi collegati allo stesso gruppo. Ogni modifica (interruttore
  acceso/spento, nuova casa, nuovo limite) viene pubblicata subito su
  Firebase Realtime Database e arriva a tutti, senza ricaricare la pagina.
- **Profilo** (pulsante 👤, visibile dopo il login): permette di cambiare
  il nome visualizzato del gruppo, il proprio nome, l'emoji e la password.
  L'ID del gruppo (usato internamente per il login) non è modificabile.

Il pulsante 🔐/⎋ in alto apre il login o effettua il logout (i dati
restano comunque salvati in locale anche dopo il logout).

**Nota sulla sicurezza**: la password non viene mai salvata in chiaro
(solo hash + salt casuale calcolati nel browser), ma essendo un sito
statico senza un vero server, il controllo avviene lato client: chi
conoscesse l'indirizzo del database potrebbe in teoria leggere i record
degli account. Va bene per un piccolo gruppo di fiducia (famiglia/amici),
non per dati sensibili. Non esiste un recupero password: se viene persa
va creato un nuovo gruppo (o modificata a mano dalla console Firebase).

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
       "accounts": {
         "$groupSlug": {
           ".read": true,
           ".write": true
         }
       },
       "groups": {
         "$groupSlug": {
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
   (`accounts/` contiene gli account dei gruppi registrati, `groups/`
   contiene i dati condivisi di ciascun gruppo — uno per ogni nome
   gruppo registrato, non più uno fisso.)
6. Carica `js/firebaseConfig.js` aggiornato sul repository GitHub (o
   Pages). Da quel momento, chiunque può registrare il proprio gruppo e
   accedervi da qualsiasi dispositivo, senza configurare nulla in più.

## Struttura del progetto

```
vacation-power/
├── index.html            Pagina principale
├── manifest.json         Per installare l'app sulla home del telefono
├── css/
│   └── style.css         Stile grafico
├── js/
│   ├── defaultData.js    Elenco predefinito di elettrodomestici
│   ├── storage.js        Salvataggio locale + sessione + esportazione/importazione JSON
│   ├── firebaseConfig.js Configurazione del database condiviso (da compilare una volta)
│   ├── groupAuth.js      Registrazione, login e profilo del gruppo
│   ├── groupSync.js      Sincronizzazione in tempo reale dei dati tra dispositivi loggati
│   ├── gauge.js          Disegno del quadrante circolare
│   └── app.js            Logica dell'interfaccia
└── icons/                Icone dell'app
```
