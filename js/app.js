/**
 * app.js
 * Logica principale: gestisce lo stato, il rendering dell'interfaccia
 * e tutti gli eventi utente.
 */

let state = Storage.load();

// ---------- Riferimenti DOM ----------
const el = (id) => document.getElementById(id);

const profileSelect   = el("profileSelect");
const newProfileBtn   = el("newProfileBtn");
const renameProfileBtn= el("renameProfileBtn");
const deleteProfileBtn= el("deleteProfileBtn");

const unitToggleKw = el("unitToggleKw");
const unitToggleA  = el("unitToggleA");
const limitSelect  = el("limitSelect");
const customLimitWrap = el("customLimitWrap");
const customLimitInput = el("customLimit");

const gaugeRing  = el("gaugeRing");
const gaugeValue = el("gaugeValue");
const gaugeUnit  = el("gaugeUnit");
const gaugeCaption = el("gaugeCaption");
const statAvailable = el("statAvailable");
const statLimit = el("statLimit");
const statCount = el("statCount");

const applianceListEl = el("applianceList");
const newNameInput = el("newName");
const newWattInput = el("newWatt");
const addBtn = el("addBtn");

const exportProfileBtn = el("exportProfileBtn");
const exportAllBtn = el("exportAllBtn");
const importBtn = el("importBtn");
const importFileInput = el("importFileInput");
const resetBtn = el("resetBtn");

const themeToggle = el("themeToggle");

const modalBackdrop = el("modalBackdrop");
const modalTitle = el("modalTitle");
const modalInput = el("modalInput");
const modalConfirm = el("modalConfirm");
const modalCancel = el("modalCancel");

const toastEl = el("toast");

Gauge.init(gaugeRing, gaugeValue, gaugeUnit);

// ---------- Helpers stato ----------
function activeProfile() {
  return state.profiles[state.activeProfileId];
}

function persist() {
  const p = activeProfile();
  if (p) p.updatedAt = new Date().toISOString();
  Storage.save(state);
}

function wattsToAmps(watts) {
  return watts / VOLTAGE;
}
function ampsToWatts(amps) {
  return amps * VOLTAGE;
}

// ---------- Toast ----------
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

// ---------- Tema ----------
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  themeToggle.textContent = state.theme === "dark" ? "☀️" : "🌙";
}

themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme();
  Storage.save(state);
});

// ---------- Modal generico (usato per nuova casa / rinomina) ----------
function openModal({ title, placeholder = "", value = "", onConfirm }) {
  modalTitle.textContent = title;
  modalInput.placeholder = placeholder;
  modalInput.value = value;
  modalBackdrop.classList.add("open");
  setTimeout(() => modalInput.focus(), 50);

  const confirmHandler = () => {
    const val = modalInput.value.trim();
    if (!val) { modalInput.focus(); return; }
    closeModal();
    onConfirm(val);
  };
  modalConfirm.onclick = confirmHandler;
  modalInput.onkeydown = (e) => { if (e.key === "Enter") confirmHandler(); };
}
function closeModal() {
  modalBackdrop.classList.remove("open");
}
modalCancel.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => { if (e.target === modalBackdrop) closeModal(); });

// ---------- Gestione profili (case) ----------
function renderProfileSelect() {
  profileSelect.innerHTML = "";
  Object.values(state.profiles)
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      if (p.id === state.activeProfileId) opt.selected = true;
      profileSelect.appendChild(opt);
    });
}

profileSelect.addEventListener("change", () => {
  state.activeProfileId = profileSelect.value;
  Storage.save(state);
  renderAll();
});

newProfileBtn.addEventListener("click", () => {
  openModal({
    title: "Nome della nuova casa",
    placeholder: "Es. Baita in montagna",
    onConfirm: (name) => {
      const profile = createEmptyProfile(name);
      state.profiles[profile.id] = profile;
      state.activeProfileId = profile.id;
      Storage.save(state);
      renderAll();
      showToast("Casa aggiunta: " + name);
    }
  });
});

renameProfileBtn.addEventListener("click", () => {
  const p = activeProfile();
  openModal({
    title: "Rinomina casa",
    value: p.name,
    onConfirm: (name) => {
      p.name = name;
      persist();
      renderAll();
    }
  });
});

deleteProfileBtn.addEventListener("click", () => {
  const ids = Object.keys(state.profiles);
  if (ids.length <= 1) {
    showToast("Deve rimanere almeno una casa.");
    return;
  }
  const p = activeProfile();
  if (!confirm(`Eliminare la casa "${p.name}"? L'operazione non è reversibile.`)) return;
  delete state.profiles[p.id];
  state.activeProfileId = Object.keys(state.profiles)[0];
  Storage.save(state);
  renderAll();
  showToast("Casa eliminata.");
});

// ---------- Limite di potenza ----------
function currentLimitKw() {
  const p = activeProfile();
  return p.unit === "A" ? (ampsToWatts(p.limitKw) / 1000) : p.limitKw;
  // nota: internamente salviamo sempre il valore nell'unita' scelta in p.limitKw,
  // qui lo normalizziamo in kW per i calcoli.
}

function renderUnitToggle() {
  const p = activeProfile();
  unitToggleKw.classList.toggle("active", p.unit === "kW");
  unitToggleA.classList.toggle("active", p.unit === "A");
}

function switchUnit(newUnit) {
  const p = activeProfile();
  if (p.unit === newUnit) return;
  // converto il valore numerico mantenendo la potenza reale invariata
  if (newUnit === "A") {
    p.limitKw = Math.round(wattsToAmps(p.limitKw * 1000) * 10) / 10;
  } else {
    p.limitKw = Math.round((ampsToWatts(p.limitKw) / 1000) * 100) / 100;
  }
  p.unit = newUnit;
  persist();
  renderLimitControls();
  renderAll();
}

unitToggleKw.addEventListener("click", () => switchUnit("kW"));
unitToggleA.addEventListener("click", () => switchUnit("A"));

function limitOptionsFor(unit) {
  if (unit === "A") return [10, 16, 20, 25, 32];
  return STANDARD_LIMITS_KW;
}

function renderLimitControls() {
  const p = activeProfile();
  const options = limitOptionsFor(p.unit);
  limitSelect.innerHTML = "";
  options.forEach((val) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = p.unit === "A" ? `${val} A` : `${val} kW`;
    limitSelect.appendChild(opt);
  });
  const customOpt = document.createElement("option");
  customOpt.value = "custom";
  customOpt.textContent = "Personalizzato...";
  limitSelect.appendChild(customOpt);

  if (options.includes(p.limitKw)) {
    limitSelect.value = p.limitKw;
    customLimitWrap.style.display = "none";
  } else {
    limitSelect.value = "custom";
    customLimitWrap.style.display = "block";
    customLimitInput.value = p.limitKw;
  }
  customLimitInput.placeholder = p.unit === "A" ? "Ampere personalizzati" : "kW personalizzati";
}

limitSelect.addEventListener("change", () => {
  const p = activeProfile();
  if (limitSelect.value === "custom") {
    customLimitWrap.style.display = "block";
    customLimitInput.focus();
    return;
  }
  customLimitWrap.style.display = "none";
  p.limitKw = parseFloat(limitSelect.value);
  persist();
  renderAll();
});

customLimitInput.addEventListener("input", () => {
  const val = parseFloat(customLimitInput.value);
  if (!isNaN(val) && val > 0) {
    activeProfile().limitKw = val;
    persist();
    renderAll();
  }
});

// ---------- Elenco elettrodomestici ----------
function renderApplianceList() {
  const p = activeProfile();
  applianceListEl.innerHTML = "";

  if (p.appliances.length === 0) {
    const empty = document.createElement("p");
    empty.className = "small-note";
    empty.textContent = "Nessun elettrodomestico. Aggiungine uno qui sotto.";
    applianceListEl.appendChild(empty);
    return;
  }

  p.appliances.forEach((app, index) => {
    const row = document.createElement("div");
    row.className = "appliance-row";

    const icon = document.createElement("div");
    icon.className = "appliance-icon";
    icon.textContent = app.icon || "🔌";

    const info = document.createElement("div");
    info.className = "appliance-info";
    const name = document.createElement("div");
    name.className = "appliance-name";
    name.textContent = app.name;
    const watt = document.createElement("div");
    watt.className = "appliance-watt";
    watt.textContent = `${app.watt} W ciascuno`;
    info.appendChild(name);
    info.appendChild(watt);

    const qty = document.createElement("input");
    qty.type = "number";
    qty.min = "1";
    qty.className = "qty-input";
    qty.value = app.qty || 1;
    qty.title = "Quantità";
    qty.addEventListener("change", () => {
      const v = Math.max(1, parseInt(qty.value) || 1);
      app.qty = v;
      qty.value = v;
      persist();
      renderStatus();
    });

    const breaker = document.createElement("input");
    breaker.type = "checkbox";
    breaker.className = "breaker";
    breaker.checked = app.on;
    breaker.title = app.on ? "Acceso" : "Spento";
    breaker.addEventListener("change", () => {
      app.on = breaker.checked;
      persist();
      renderStatus();
    });

    const del = document.createElement("button");
    del.className = "row-delete";
    del.textContent = "✕";
    del.title = "Elimina";
    del.addEventListener("click", () => {
      p.appliances.splice(index, 1);
      persist();
      renderApplianceList();
      renderStatus();
    });

    row.appendChild(icon);
    row.appendChild(info);
    row.appendChild(qty);
    row.appendChild(breaker);
    row.appendChild(del);
    applianceListEl.appendChild(row);
  });
}

addBtn.addEventListener("click", () => {
  const name = newNameInput.value.trim();
  const watt = parseFloat(newWattInput.value);
  if (!name || isNaN(watt) || watt <= 0) {
    showToast("Inserisci nome e potenza (W) validi.");
    return;
  }
  const p = activeProfile();
  p.appliances.push({ name, watt, icon: "🔌", qty: 1, on: false });
  newNameInput.value = "";
  newWattInput.value = "";
  persist();
  renderApplianceList();
  renderStatus();
  showToast("Elettrodomestico aggiunto.");
});

resetBtn.addEventListener("click", () => {
  if (!confirm("Ripristinare l'elenco predefinito per questa casa? Le modifiche personalizzate andranno perse.")) return;
  const p = activeProfile();
  p.appliances = JSON.parse(JSON.stringify(DEFAULT_APPLIANCES));
  persist();
  renderApplianceList();
  renderStatus();
});

// ---------- Calcolo stato / gauge ----------
let lastStatus = "ok";

function renderStatus() {
  const p = activeProfile();
  const limitWatt = currentLimitKw() * 1000;

  const currentWatt = p.appliances
    .filter((a) => a.on)
    .reduce((sum, a) => sum + a.watt * (a.qty || 1), 0);

  const availableWatt = limitWatt - currentWatt;
  const percent = limitWatt > 0 ? (currentWatt / limitWatt) * 100 : 0;

  let status = "ok";
  let caption = "Situazione OK: puoi accendere altro.";
  if (currentWatt > limitWatt) {
    status = "danger";
    caption = "Limite superato! Rischio di far scattare il salvavita.";
  } else if (percent >= 80) {
    status = "warning";
    caption = "Attenzione: ti stai avvicinando al limite.";
  }

  // Vibrazione se si entra nello stato di pericolo (solo su dispositivi che la supportano)
  if (status === "danger" && lastStatus !== "danger" && navigator.vibrate) {
    navigator.vibrate([120, 60, 120]);
  }
  lastStatus = status;

  const centerText = p.unit === "A"
    ? wattsToAmps(currentWatt).toFixed(1)
    : (currentWatt / 1000).toFixed(2);
  const centerUnit = p.unit === "A" ? "Ampere in uso" : "kW in uso";

  Gauge.render(percent, status, centerText, centerUnit);

  gaugeCaption.textContent = caption;
  gaugeCaption.dataset.status = status;

  const availableDisplay = p.unit === "A"
    ? Math.max(0, wattsToAmps(availableWatt)).toFixed(1) + " A"
    : Math.max(0, availableWatt / 1000).toFixed(2) + " kW";
  const limitDisplay = p.unit === "A"
    ? currentLimitKwAsUnitValue() + " A"
    : currentLimitKwAsUnitValue() + " kW";

  statAvailable.textContent = availableDisplay;
  statLimit.textContent = limitDisplay;
  statCount.textContent = p.appliances.filter((a) => a.on).length;
}

function currentLimitKwAsUnitValue() {
  const p = activeProfile();
  return p.unit === "A" ? p.limitKw : p.limitKw;
}

// ---------- Import / Export ----------
exportProfileBtn.addEventListener("click", () => {
  Storage.exportProfile(activeProfile());
  showToast("File JSON della casa scaricato.");
});

exportAllBtn.addEventListener("click", () => {
  Storage.exportAll(state);
  showToast("Backup completo scaricato.");
});

importBtn.addEventListener("click", () => importFileInput.click());

importFileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const result = Storage.parseImportedFile(text);
    if (result.type === "state") {
      if (!confirm("Il file contiene un backup completo. Sostituire tutti i dati attuali?")) return;
      state = result.data;
    } else {
      // singolo profilo: lo aggiungo (nuovo id per evitare conflitti)
      const profile = result.data;
      profile.id = generateId();
      state.profiles[profile.id] = profile;
      state.activeProfileId = profile.id;
    }
    Storage.save(state);
    renderAll();
    showToast("Importazione completata.");
  } catch (err) {
    console.error(err);
    showToast("File non valido.");
  } finally {
    importFileInput.value = "";
  }
});

// ---------- Render generale ----------
function renderAll() {
  renderProfileSelect();
  renderUnitToggle();
  renderLimitControls();
  renderApplianceList();
  renderStatus();
}

applyTheme();
renderAll();
