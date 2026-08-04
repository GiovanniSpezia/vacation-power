/**
 * defaultData.js
 * Elenco predefinito di elettrodomestici con potenza tipica (in Watt).
 * Questi valori sono medi indicativi: la potenza reale è sempre scritta
 * sull'etichetta/targhetta dell'apparecchio.
 */

const DEFAULT_APPLIANCES = [
  { name: "Frigorifero",            watt: 150,  icon: "🧊", qty: 1, on: true  },
  { name: "Bollitore elettrico",    watt: 2000, icon: "☕", qty: 1, on: false },
  { name: "Asciugacapelli",         watt: 1800, icon: "💨", qty: 1, on: false },
  { name: "Lavatrice",              watt: 2200, icon: "🧺", qty: 1, on: false },
  { name: "Lavastoviglie",          watt: 2000, icon: "🍽️", qty: 1, on: false },
  { name: "Forno elettrico",        watt: 2500, icon: "🔥", qty: 1, on: false },
  { name: "Microonde",              watt: 1000, icon: "📡", qty: 1, on: false },
  { name: "Condizionatore",         watt: 1500, icon: "❄️", qty: 1, on: false },
  { name: "Stufetta elettrica",     watt: 2000, icon: "🌡️", qty: 1, on: false },
  { name: "Ferro da stiro",         watt: 1800, icon: "👕", qty: 1, on: false },
  { name: "Televisore",             watt: 100,  icon: "📺", qty: 1, on: false },
  { name: "Aspirapolvere",          watt: 1200, icon: "🧹", qty: 1, on: false },
  { name: "Scaldabagno elettrico",  watt: 1500, icon: "🚿", qty: 1, on: false },
  { name: "Piastra a induzione",    watt: 2000, icon: "🍳", qty: 1, on: false },
  { name: "Illuminazione (stanza)", watt: 60,   icon: "💡", qty: 1, on: true  },
  { name: "Caricabatterie / PC",    watt: 65,   icon: "🔌", qty: 1, on: false }
];

// Limiti di potenza standard più diffusi in Italia (kW) con relativa
// corrente equivalente indicativa (a 230V monofase), tipica del salvavita.
const STANDARD_LIMITS_KW = [1.5, 3, 3.3, 4.5, 6];

const VOLTAGE = 230; // Volt, standard rete domestica italiana
