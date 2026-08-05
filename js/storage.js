/**
 * storage.js
 * Gestisce il salvataggio dei dati:
 * - in locale (localStorage), sempre e comunque, per ogni dispositivo;
 * - la definizione dell'account del gruppo usato per il login condiviso
 *   (la sincronizzazione vera e propria tra dispositivi loggati è
 *   gestita da js/groupSync.js tramite Firebase).
 * Gestisce inoltre l'esportazione/importazione manuale in formato JSON,
 * utile per backup o per spostare i dati a mano tra dispositivi.
 */

const STORAGE_KEY = "vacationPowerData_v1";
const AUTH_SESSION_KEY = "vacationPowerAuthSession_v1";
const AUTH_ACCOUNT = {
  username: "leanime",
  salt: "vacation-power-leanime-salt-v1",
  passwordHash: "2b92d985d527ea9b43907e178f6c5f89b0035c6d0a4d69363b26ded6e0886749"
};
const AUTH_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function generateId() {
  return "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

function createEmptyProfile(name) {
  return {
    id: generateId(),
    name: name || "Nuova casa",
    limitKw: 3,
    unit: "kW", // "kW" oppure "A"
    appliances: JSON.parse(JSON.stringify(DEFAULT_APPLIANCES)),
    updatedAt: new Date().toISOString()
  };
}

function defaultState() {
  const profile = createEmptyProfile("Casa vacanza");
  return {
    version: 1,
    activeProfileId: profile.id,
    theme: "dark",
    profiles: { [profile.id]: profile },
    updatedAt: new Date().toISOString()
  };
}

const Storage = {
  async _hashText(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  },

  /** Stato locale del dispositivo (usato sempre come cache, con o senza login) */
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.profiles || Object.keys(parsed.profiles).length === 0) {
        return defaultState();
      }
      if (!parsed.updatedAt) parsed.updatedAt = new Date().toISOString();
      return parsed;
    } catch (e) {
      console.error("Dati salvati corrotti, ripristino i valori di default.", e);
      return defaultState();
    }
  },

  save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  isSessionValid() {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return false;
    try {
      const session = JSON.parse(raw);
      return session.username === AUTH_ACCOUNT.username && session.expiresAt > Date.now();
    } catch (e) {
      return false;
    }
  },

  setSession(username) {
    const session = {
      username,
      loggedInAt: Date.now(),
      expiresAt: Date.now() + AUTH_SESSION_TTL_MS
    };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  },

  clearSession() {
    localStorage.removeItem(AUTH_SESSION_KEY);
  },

  async verifyCredentials(username, password) {
    const normalizedUser = (username || "").trim();
    if (normalizedUser !== AUTH_ACCOUNT.username) return false;
    const candidateHash = await this._hashText(`${AUTH_ACCOUNT.salt}|${normalizedUser}|${password || ""}`);
    return candidateHash === AUTH_ACCOUNT.passwordHash;
  },

  /** Scarica il profilo attivo (o tutti) come file .json */
  exportProfile(profile) {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    this._download(blob, this._slugify(profile.name) + ".json");
  },

  exportAll(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    this._download(blob, "vacation-power-backup.json");
  },

  _download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  _slugify(text) {
    return text
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "casa";
  },

  /**
   * Legge un file JSON importato. Riconosce sia un intero "state"
   * (con più profili) sia un singolo profilo esportato singolarmente.
   */
  parseImportedFile(fileText) {
    const data = JSON.parse(fileText);
    if (data.profiles && data.activeProfileId) {
      return { type: "state", data };
    }
    if (data.id && data.appliances) {
      return { type: "profile", data };
    }
    throw new Error("Formato file non riconosciuto.");
  }
};
