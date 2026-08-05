/**
 * groupAuth.js
 * Gestisce la registrazione, il login e la modifica del profilo degli
 * account di gruppo, salvati su Firebase Realtime Database nel
 * percorso "accounts/{groupSlug}".
 *
 * Ogni gruppo vacanza è identificato da un "nome gruppo" (diventa lo
 * slug usato sia per l'account che per i dati condivisi in
 * "groups/{groupSlug}", gestiti da groupSync.js).
 *
 * Le password non vengono mai salvate in chiaro: solo hash + salt
 * casuale calcolati nel browser (SHA-256). Non è una sicurezza di
 * livello "bancario" (il record è leggibile da chi conosce il percorso,
 * secondo le regole del database), ma è coerente con l'uso previsto:
 * piccoli gruppi di famiglia/amici che condividono lo stato delle case
 * vacanza. Non esiste un recupero password: se la si perde va creato un
 * nuovo gruppo (o modificata a mano nel database dalla console Firebase).
 */

const ACCOUNTS_PATH = "accounts";

const GroupAuth = {
  /** Trasforma un nome gruppo in un identificativo valido per Firebase (a-z0-9). */
  slugify(name) {
    return String(name || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 40);
  },

  _randomSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  },

  async _hash(password, salt) {
    const bytes = new TextEncoder().encode(`${salt}|${password}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  },

  _accountRef(slug) {
    GroupSync.ensureApp();
    return firebase.database().ref(`${ACCOUNTS_PATH}/${slug}`);
  },

  async accountExists(slug) {
    const snap = await this._accountRef(slug).once("value");
    return snap.exists();
  },

  async register({ groupName, ownerName, password, confirmPassword, emoji }) {
    const slug = this.slugify(groupName);
    if (!slug) throw new Error("Scegli un nome gruppo valido (lettere e numeri).");
    if (!ownerName || !ownerName.trim()) throw new Error("Inserisci il tuo nome.");
    if (!password || password.length < 4) throw new Error("La password deve avere almeno 4 caratteri.");
    if (password !== confirmPassword) throw new Error("Le due password non coincidono.");

    const exists = await this.accountExists(slug);
    if (exists) throw new Error("Questo nome gruppo è già registrato. Prova ad accedere invece di registrarti.");

    const salt = this._randomSalt();
    const passwordHash = await this._hash(password, salt);
    const account = {
      slug,
      groupSlug: slug,
      groupName: groupName.trim(),
      ownerName: ownerName.trim(),
      emoji: emoji || "🏡",
      passwordSalt: salt,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this._accountRef(slug).set(account);
    return account;
  },

  async login(groupName, password) {
    const slug = this.slugify(groupName);
    if (!slug) throw new Error("Inserisci il nome del gruppo.");
    const snap = await this._accountRef(slug).once("value");
    if (!snap.exists()) throw new Error("Gruppo non trovato. Controlla il nome oppure registrane uno nuovo.");
    const account = snap.val();
    const candidateHash = await this._hash(password, account.passwordSalt);
    if (candidateHash !== account.passwordHash) throw new Error("Password errata.");
    return { ...account, slug };
  },

  async getAccount(slug) {
    const snap = await this._accountRef(slug).once("value");
    if (!snap.exists()) return null;
    return { ...snap.val(), slug };
  },

  /** Aggiorna nome gruppo / nome personale / emoji (non la password: usa changePassword). */
  async updateProfile(slug, { groupName, ownerName, emoji }) {
    if (!ownerName || !ownerName.trim()) throw new Error("Inserisci il tuo nome.");
    if (!groupName || !groupName.trim()) throw new Error("Inserisci il nome del gruppo.");
    const patch = {
      groupName: groupName.trim(),
      ownerName: ownerName.trim(),
      emoji: emoji || "🏡",
      updatedAt: new Date().toISOString()
    };
    await this._accountRef(slug).update(patch);
    return this.getAccount(slug);
  },

  async changePassword(slug, currentPassword, newPassword, confirmNewPassword) {
    const account = await this.getAccount(slug);
    if (!account) throw new Error("Account non trovato.");
    const currentHash = await this._hash(currentPassword, account.passwordSalt);
    if (currentHash !== account.passwordHash) throw new Error("La password attuale non è corretta.");
    if (!newPassword || newPassword.length < 4) throw new Error("La nuova password deve avere almeno 4 caratteri.");
    if (newPassword !== confirmNewPassword) throw new Error("Le due nuove password non coincidono.");

    const salt = this._randomSalt();
    const passwordHash = await this._hash(newPassword, salt);
    await this._accountRef(slug).update({
      passwordSalt: salt,
      passwordHash,
      updatedAt: new Date().toISOString()
    });
    return true;
  }
};
