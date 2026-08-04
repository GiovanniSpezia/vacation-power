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

## Login di gruppo e sincronizzazione tra dispositivi

L'app ha un accesso protetto da password per il gruppo (utente `leanime`).

- **Senza login**: i dati restano salvati solo su quel dispositivo/browser
  (localStorage). Nessuna condivisione con altri dispositivi.
- **Con login**: appena entri, il dispositivo si collega automaticamente
  all'archivio condiviso del gruppo su GitHub — owner, repository, branch
  e percorso del file sono già configurati di default (vedi
  `GROUP_SYNC_DEFAULTS` in `js/storage.js`), non serve inserirli a mano.
  Da quel momento:
  1. scarica subito lo stato più recente inserito da altri dispositivi;
  2. ricontrolla automaticamente ogni 20 secondi, più un controllo
     immediato ogni volta che torni sulla scheda del browser;
  3. quando accendi/spegni un elettrodomestico, cambi casa o modifichi il
     limite, l'app carica in automatico la modifica su GitHub, così gli
     altri dispositivi la vedono al giro di controllo successivo.

Per **vedere** gli aggiornamenti degli altri non serve altro (se il
repository è pubblico). Per **salvare** le tue modifiche (in modo che gli
altri le vedano) serve un token GitHub personale, da incollare una sola
volta nel pannello "Sincronizzazione GitHub" di quel dispositivo — resta
solo nel browser locale, non viene mai condiviso altrove. Usa un token
*fine-grained* con permessi `Contents: read and write` limitato al solo
   repository del progetto.

### Creare il token GitHub (procedura rapida)

1. Vai su GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.
2. Clicca "Generate new token".
3. Seleziona l'account e scegli il repository usato dall'app.
4. Nella sezione Permissions seleziona `Contents` → `Read & write` (solo per quel repository).
5. Imposta una scadenza se lo desideri e genera il token.
6. Copia il token immediatamente (non sarà mostrato di nuovo) e incollalo nel campo `Token GitHub` nell'app su ogni dispositivo dove vuoi poter salvare i dati.

Importante: il token permette all'app di scrivere nel repository. Non condividerlo: resta salvato solo nel browser del dispositivo.

Se due dispositivi salvano quasi nello stesso istante, l'app scarica
automaticamente l'ultima versione altrui e riprova a salvare la tua una
volta prima di segnalare un errore.

Puoi comunque usare i campi e i pulsanti manuali del pannello per puntare
a un repository diverso, o per forzare scarica/carica immediati.

Nota: il token viene salvato solo nel browser del dispositivo, non nel
repository. Su un sito statico non esiste un modo sicuro per fare sync
scrivendo su GitHub senza una credenziale di questo tipo — è il motivo
per cui resta comunque un'operazione manuale una tantum per dispositivo.

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
