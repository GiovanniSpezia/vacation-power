/**
 * groupSync.js
 * Sincronizzazione in tempo reale tra tutti i dispositivi che fanno
 * login con l'account di gruppo. Usa Firebase Realtime Database
 * (caricato via CDN in index.html) con la configurazione definita in
 * js/firebaseConfig.js.
 *
 * Comportamento:
 * - Senza login: questo modulo non viene mai usato, i dati restano
 *   solo in localStorage su quel dispositivo (per-dispositivo).
 * - Con login: appena connesso, riceve subito lo stato più recente del
 *   gruppo e resta in ascolto in tempo reale: qualsiasi modifica fatta
 *   da un altro dispositivo loggato arriva qui appena viene salvata,
 *   senza bisogno di ricaricare la pagina o aspettare un intervallo.
 *
 * Non serve gestire manualmente i conflitti: il database mantiene
 * sempre e solo l'ultima versione scritta, e la notifica a tutti i
 * dispositivi in ascolto.
 */

const GroupSync = {
  _ref: null,
  _pushTimer: null,

  isConfigured() {
    const cfg = typeof FIREBASE_CONFIG !== "undefined" ? FIREBASE_CONFIG : null;
    return !!(cfg && cfg.databaseURL && !String(cfg.databaseURL).includes("INCOLLA_QUI"));
  },

  isAvailable() {
    return typeof firebase !== "undefined" && this.isConfigured();
  },

  /**
   * Avvia la sincronizzazione per il gruppo.
   * @param {(remoteState: object) => void} onRemoteChange - chiamata ogni
   *   volta che il database condiviso ha un nuovo stato.
   * @param {object} seedState - stato locale attuale: viene pubblicato
   *   come base SOLO se il gruppo non ha ancora nessun dato salvato
   *   (es. primo utilizzo in assoluto).
   */
  start(onRemoteChange, seedState) {
    if (!this.isAvailable()) {
      console.warn("Firebase non configurato: la sincronizzazione di gruppo è disattivata. Compila js/firebaseConfig.js.");
      return false;
    }

    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }

    this._ref = firebase.database().ref(FIREBASE_GROUP_PATH);

    this._ref.once("value").then((snapshot) => {
      if (!snapshot.exists() && seedState) {
        this.push(seedState).catch((err) => console.error("Impossibile inizializzare il gruppo:", err));
      }
    });

    this._ref.on("value", (snapshot) => {
      const remote = snapshot.val();
      if (remote) onRemoteChange(remote);
    });

    return true;
  },

  stop() {
    if (this._ref) {
      this._ref.off();
      this._ref = null;
    }
    clearTimeout(this._pushTimer);
  },

  /** Pubblica subito lo stato attuale sul database condiviso. */
  async push(state) {
    if (!this._ref) return;
    await this._ref.set(state);
  },

  /** Pubblica lo stato con un piccolo ritardo, per non spammare ad ogni click veloce. */
  queuePush(state, delay = 400) {
    if (!this._ref) return;
    clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this.push(state).catch((err) => console.error("Sync gruppo non riuscita:", err));
    }, delay);
  }
};
