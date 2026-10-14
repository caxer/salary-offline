/* Only ciphertext is persisted. Vaults are scoped to this app directory.
   Payload: 'k1:' + iv + '.' + ct (base64url), sealed with the link key. */
(function () {
  'use strict';
  const scope = new URL('./', location.href).pathname;
  const database = `salary.offline:${scope}`;
  const CONTEXT = 'salary/data/v1';
  const CURRENT = /^k1:[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22,}$/;
  const LEGACY = /^(?:v2:\d+:)?[A-Za-z0-9+/]+=*$/;
  const OLD_FILE = '這是舊的密碼加密檔，請在電腦執行 npm run link 轉換後再匯入。';
  const isCurrent = payload => typeof payload === 'string' && CURRENT.test(payload);
  let opened;
  function db() {
    if (!opened) opened = new Promise((resolve, reject) => {
      const request = indexedDB.open(database, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('vault');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => { opened = null; reject(new Error('無法開啟手機儲存空間，請允許網站儲存。')); };
    });
    return opened;
  }
  async function read() {
    const connection = await db();
    return new Promise((resolve, reject) => {
      const transaction = connection.transaction('vault');
      const request = transaction.objectStore('vault').get('main');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('讀取手機資料失敗。'));
    });
  }
  async function write(payload, expectedRevision) {
    if (!isCurrent(payload)) throw new Error('拒絕儲存未加密的資料。');
    const connection = await db();
    return new Promise((resolve, reject) => {
      const transaction = connection.transaction('vault', 'readwrite');
      const store = transaction.objectStore('vault');
      let result, conflict = false;
      const request = store.get('main');
      request.onsuccess = () => {
        if ((request.result?.revision || 0) !== expectedRevision) { conflict = true; transaction.abort(); return; }
        result = { payload, revision: expectedRevision + 1, savedAt: new Date().toISOString() };
        store.put(result, 'main');
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = transaction.onerror = () => reject(new Error(conflict
        ? '另一個分頁已更新資料，請先匯出目前加密備份，再重新開啟；未覆蓋另一份資料。'
        : '手機儲存失敗，請保留此頁並匯出加密備份。'));
    });
  }
  function extract(text) {
    if (typeof text !== 'string' || text.length > 20 * 1024 * 1024) throw new Error('匯入檔案過大或格式不正確。');
    let payload;
    if (text.trim().startsWith('{')) {
      const file = JSON.parse(text);
      if (file.format !== 'salary-backup' || file.version !== 1) throw new Error('不是薪資看板的加密備份。');
      payload = file.payload;
    } else {
      // Parse inert HTML as text. Imported scripts are never inserted or executed.
      payload = /<script\b[^>]*\bid=["']embedded-data["'][^>]*>([^<]+)<\/script>/i.exec(text)?.[1]?.trim();
    }
    if (isCurrent(payload)) return payload;
    if (typeof payload === 'string' && payload.length >= 80 && LEGACY.test(payload)) throw new Error(OLD_FILE);
    throw new Error('找不到有效的加密薪資資料。請選薪資加密備份。');
  }
  function validate(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.salaryData) || !Array.isArray(data.nhiData)) throw new Error('薪資資料格式不正確。');
    for (const row of data.salaryData) {
      if (!row || !Number.isInteger(row.ceYear) || !Array.isArray(row.months) || row.months.length !== 12 || row.months.some(n => typeof n !== 'number' || !Number.isFinite(n))) throw new Error('年薪資料格式不正確。');
    }
    for (const field of ['welfareData', 'taxData', '其他(92)Data']) if (data[field] !== undefined && !Array.isArray(data[field])) throw new Error('薪資明細格式不正確。');
    return data;
  }
  async function seal(key, data) {
    const box = await LinkKey.seal(key, JSON.stringify(data), CONTEXT);
    return 'k1:' + box.iv + '.' + box.ct;
  }
  /** 金鑰不符時丟出 code 'wrong-key'；資料格式錯誤另外回報。 */
  async function open(key, payload) {
    if (!isCurrent(payload)) throw new Error(OLD_FILE);
    const [iv, ct] = payload.slice(3).split('.');
    let text;
    try { text = await LinkKey.open(key, { iv, ct }, CONTEXT); }
    catch { throw Object.assign(new Error('這個檔案不是用這條專屬連結加密的。'), { code: 'wrong-key' }); }
    return validate(JSON.parse(text));
  }
  async function backup(payload) {
    const file = new File([JSON.stringify({ format: 'salary-backup', version: 1, exportedAt: new Date().toISOString(), payload }, null, 2)],
      `salary-backup-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: '薪資加密備份' }); return true; }
      catch (error) { if (error.name === 'AbortError') return false; }
    }
    const url = URL.createObjectURL(file), anchor = document.createElement('a');
    anchor.href = url; anchor.download = file.name; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  }
  window.SalaryStore = { read, write, extract, validate, seal, open, isCurrent, backup };
})();
