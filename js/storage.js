/**
 * storage.js
 * Gestisce il salvataggio dei dati in localStorage (persistenza locale,
 * funziona anche offline e a doppio click sul file) e l'esportazione /
 * importazione in formato JSON (utile per fare backup, spostare i dati
 * su un altro dispositivo, o versionarli in un repository GitHub, dato
 * che un sito statico su GitHub Pages non ha un database server).
 */

const STORAGE_KEY = "vacationPowerData_v1";

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
    profiles: { [profile.id]: profile }
  };
}

const Storage = {
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.profiles || Object.keys(parsed.profiles).length === 0) {
        return defaultState();
      }
      return parsed;
    } catch (e) {
      console.error("Dati salvati corrotti, ripristino i valori di default.", e);
      return defaultState();
    }
  },

  save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
