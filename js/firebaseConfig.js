/**
 * firebaseConfig.js
 *
 * Configurazione del database condiviso usato per sincronizzare i dati
 * tra tutti i dispositivi che fanno login con l'account di gruppo.
 *
 * Va compilato UNA SOLA VOLTA per tutto il progetto (non per ogni
 * dispositivo): dopo aver caricato questo file su GitHub, chiunque
 * faccia login vedrà automaticamente gli stessi dati, senza configurare
 * nulla sul proprio telefono/PC.
 *
 * COME OTTENERE QUESTI VALORI (gratis, 5 minuti):
 * 1. Vai su https://console.firebase.google.com e crea un progetto
 *    (puoi chiamarlo "vacation-power").
 * 2. Nel menu a sinistra apri "Realtime Database" -> "Crea database"
 *    -> scegli una regione -> avvia in modalità "test" (poi si sistemano
 *    le regole, vedi sotto).
 * 3. Vai su Impostazioni progetto (icona ingranaggio) -> "Le tue app"
 *    -> aggiungi un'app Web (icona </>) -> dagli un nome -> registra.
 * 4. Firebase mostrerà un oggetto "firebaseConfig": copia i valori qui
 *    sotto, al posto di quelli segnaposto.
 * 5. Nella sezione "Realtime Database -> Regole" incolla queste regole,
 *    per limitare l'accesso al solo percorso usato da questa app:
 *
 *    {
 *      "rules": {
 *        "groups": {
 *          "leanime": {
 *            ".read": true,
 *            ".write": true
 *          }
 *        },
 *        "$other": {
 *          ".read": false,
 *          ".write": false
 *        }
 *      }
 *    }
 *
 * Nota sulla sicurezza: questa configurazione è pensata per un piccolo
 * gruppo di fiducia (come il login già richiede una password). Non è
 * un sistema con autenticazione forte lato server: chiunque conosca
 * l'indirizzo del database e il percorso "groups/leanime" potrebbe in
 * teoria leggerlo/scriverlo. Va bene per l'uso previsto (famiglia/amici
 * che condividono lo stato delle case vacanza), non per dati sensibili.
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCDx-a1sdaZUWXSTIDChOAfaG69M2S2prg",
  authDomain: "vacation-power.firebaseapp.com",
  databaseURL: "https://vacation-power-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "vacation-power",
  storageBucket: "vacation-power.firebasestorage.app",
  messagingSenderId: "392920781530",
  appId: "1:392920781530:web:892229e7d774d947ed4be3"
};

// Percorso del database dove viene salvato lo stato condiviso del gruppo.
const FIREBASE_GROUP_PATH = "groups/leanime";
