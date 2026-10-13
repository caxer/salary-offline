/* Salary vault adapter for the shared FaceIDCore (no third-party dependencies).
   Preserve current and legacy encrypted passwords; store no PRF output. */
(function () {
  "use strict";
  const STORE = 'salary.passkey';
  const LEGACY_STORE = 'salary-passkey-v1';
  const encode = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const decode = value => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
  const random = size => crypto.getRandomValues(new Uint8Array(size));
  const scope = () => location.origin + location.pathname.replace(/(?:salary\.html|index\.html)?$/, '');
  const aad = () => new TextEncoder().encode('salary/passkey/v1/' + scope());
  const legacyAAD = () => new TextEncoder().encode('salary-passkey-v1:' + location.origin);
  let pending = null;

  function hasPasskey() {
    try { return localStorage.getItem(STORE) !== null || localStorage.getItem(LEGACY_STORE) !== null; }
    catch { return false; }
  }
  const supportsPasskey = () => FaceIDCore.available();
  const keyFrom = result => FaceIDCore.keyFrom(result);
  const assertion = (id, salt) => FaceIDCore.assertion(decode(id), decode(salt));
  async function savePassword(record, result, password) {
    if (!password) throw new Error('請先使用密碼登入，再啟用 Face ID。');
    const iv = random(12), key = await keyFrom(result);
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad() }, key, new TextEncoder().encode(password));
    const saved = JSON.stringify({ ...record, iv: encode(iv), data: encode(data) });
    const previous = localStorage.getItem(STORE);
    try {
      localStorage.setItem(STORE, saved);
      if (localStorage.getItem(STORE) !== saved) throw new Error('storage');
      localStorage.removeItem(LEGACY_STORE);
      if (localStorage.getItem(LEGACY_STORE) !== null) throw new Error('storage');
    } catch {
      try { if (previous === null) localStorage.removeItem(STORE); else localStorage.setItem(STORE, previous); } catch { /* Keep existing ciphertext locked. */ }
      throw new Error('無法保存 Face ID 設定，請允許此網站儲存資料後再試。');
    }
    pending = null;
    return { ready: true };
  }
  async function enrollPasskey(password) {
    pending = null;
    const salt = random(32);
    const { id, result } = await FaceIDCore.register('薪資看板', salt);
    const record = { v: 1, scope: scope(), id: encode(id), salt: encode(salt) };
    if (result) return savePassword(record, result, password);
    pending = record;
    return { pending: true };
  }
  async function completeRegistration(password) {
    if (!pending) throw new Error('請重新建立通行金鑰。');
    const record = pending;
    const result = await assertion(record.id, record.salt);
    return savePassword(record, result, password);
  }
  async function unlockPasskey() {
    let record, legacy;
    try {
      legacy = localStorage.getItem(STORE) === null;
      record = JSON.parse(localStorage.getItem(legacy ? LEGACY_STORE : STORE));
      if (record?.v !== 1 || (!legacy && record.scope !== scope())) throw new Error('format');
      for (const name of ['id', 'salt', 'iv', legacy ? 'ciphertext' : 'data'])
        if (typeof record[name] !== 'string' || !decode(record[name]).length) throw new Error('format');
    } catch { throw new Error('Face ID 設定已遺失或損壞，請使用密碼登入並重新設定。'); }
    const result = await assertion(record.id, record.salt), key = await keyFrom(result);
    try {
      const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(record.iv), additionalData: legacy ? legacyAAD() : aad() }, key, decode(legacy ? record.ciphertext : record.data));
      return new TextDecoder().decode(data);
    } catch { throw new Error('通行金鑰無法解鎖，請使用密碼登入並重新設定。'); }
  }
  function forgetPasskey() {
    try {
      localStorage.removeItem(STORE); localStorage.removeItem(LEGACY_STORE);
      if (hasPasskey()) throw new Error('storage');
      pending = null;
    } catch { throw new Error('無法移除 Face ID 設定，請允許此網站儲存資料後再試。'); }
  }
  const passkeyError = error => FaceIDCore.errorMessage(error);
  window.SalaryPasskey = { supportsPasskey, hasPasskey, enrollPasskey, unlockPasskey, forgetPasskey, passkeyError, completeRegistration, hasPending: () => !!pending };
})();
