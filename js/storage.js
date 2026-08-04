/**
 * storage.js
 * Gestisce il salvataggio dei dati in localStorage (persistenza locale,
 * funziona anche offline e a doppio click sul file) e l'esportazione /
 * importazione in formato JSON (utile per fare backup, spostare i dati
 * su un altro dispositivo, o versionarli in un repository GitHub, dato
 * che un sito statico su GitHub Pages non ha un database server).
 */

const STORAGE_KEY = "vacationPowerData_v1";
const AUTH_SESSION_KEY = "vacationPowerAuthSession_v1";
const GITHUB_SYNC_KEY = "vacationPowerGitHubSync_v1";
const AUTH_ACCOUNT = {
  username: "leanime",
  salt: "vacation-power-leanime-salt-v1",
  passwordHash: "2b92d985d527ea9b43907e178f6c5f89b0035c6d0a4d69363b26ded6e0886749"
};
const AUTH_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

// Destinazione condivisa di default per il gruppo "leanime": appena si
// fa login e non c'è già una configurazione salvata su questo
// dispositivo, l'app punta automaticamente qui, senza bisogno di
// inserire owner/repo/percorso a mano su ogni telefono/PC.
// Il token invece resta personale e va incollato una volta per
// dispositivo (serve solo per SALVARE le modifiche, non per leggerle
// se il repository è pubblico).
const GROUP_SYNC_DEFAULTS = {
  owner: "GiovanniSpezia",
  repo: "vacation-power",
  branch: "main",
  path: "data/group-leanime-state.json",
  autoSync: true
};

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

  /** Configurazione di sync predefinita per il gruppo, senza token (personale per dispositivo). */
  defaultGroupSyncConfig() {
    return { ...GROUP_SYNC_DEFAULTS, token: "" };
  },

  loadGitHubSyncConfig() {
    const raw = localStorage.getItem(GITHUB_SYNC_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return this._normalizeGitHubSyncConfig(parsed);
    } catch (e) {
      return null;
    }
  },

  saveGitHubSyncConfig(config) {
    localStorage.setItem(GITHUB_SYNC_KEY, JSON.stringify(this._normalizeGitHubSyncConfig(config)));
  },

  clearGitHubSyncConfig() {
    localStorage.removeItem(GITHUB_SYNC_KEY);
  },

  _normalizeGitHubSyncConfig(config) {
    if (!config) return null;
    const owner = (config.owner || "").trim();
    const repo = (config.repo || "").trim();
    const branch = (config.branch || "main").trim() || "main";
    const path = this._normalizeGitHubPath(config.path || "");
    const token = (config.token || "").trim();
    const autoSync = config.autoSync !== false;
    if (!owner || !repo || !path) return null;
    return { owner, repo, branch, path, token, autoSync };
  },

  _normalizeGitHubPath(path) {
    return String(path || "")
      .trim()
      .replace(/^\/+/, "")
      .replace(/\s+/g, "-");
  },

  _githubContentsUrl(config) {
    return `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${config.path}?ref=${encodeURIComponent(config.branch || "main")}`;
  },

  _githubHeaders(token) {
    const headers = {
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  },

  _toBase64Utf8(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  },

  _fromBase64Utf8(base64) {
    const binary = atob(base64.replace(/\n/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  },

  async loadGitHubState(config) {
    const normalized = this._normalizeGitHubSyncConfig(config);
    if (!normalized) throw new Error("Configurazione GitHub non valida.");

    const response = await fetch(this._githubContentsUrl(normalized), {
      headers: this._githubHeaders(normalized.token)
    });

    if (response.status === 404) {
      return { state: null, sha: null };
    }

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Errore GitHub ${response.status}: ${message}`);
    }

    const payload = await response.json();
    if (!payload.content) {
      return { state: null, sha: payload.sha || null };
    }

    const jsonText = this._fromBase64Utf8(payload.content);
    return {
      state: JSON.parse(jsonText),
      sha: payload.sha || null
    };
  },

  async saveGitHubState(config, state, sha = null) {
    const normalized = this._normalizeGitHubSyncConfig(config);
    if (!normalized) throw new Error("Configurazione GitHub non valida.");

    const payload = {
      message: `Update vacation-power state ${new Date().toISOString()}`,
      content: this._toBase64Utf8(JSON.stringify(state, null, 2))
    };

    if (sha) payload.sha = sha;

    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(normalized.owner)}/${encodeURIComponent(normalized.repo)}/contents/${normalized.path}`, {
      method: "PUT",
      headers: {
        ...this._githubHeaders(normalized.token),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Errore GitHub ${response.status}: ${message}`);
    }

    return response.json();
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
