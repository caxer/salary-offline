/* Only ciphertext is persisted. Vaults are scoped to this app directory. */
(function () {
  'use strict';
  const scope = new URL('./', location.href).pathname;
  const database = `salary.offline:${scope}`;
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
    if (!/^v2:600000:[A-Za-z0-9+/]+=*$/.test(payload)) throw new Error('拒絕儲存未加密的資料。');
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
    if (typeof payload !== 'string' || !/^(?:v2:(?:600000|100000):)?[A-Za-z0-9+/]+=*$/.test(payload) || payload.length < 80) {
      throw new Error('找不到有效的加密薪資資料。請選原 salary.html 或薪資加密備份。');
    }
    return payload;
  }
  function validate(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.salaryData) || !Array.isArray(data.nhiData)) throw new Error('薪資資料格式不正確。');
    for (const row of data.salaryData) {
      if (!row || !Number.isInteger(row.ceYear) || !Array.isArray(row.months) || row.months.length !== 12 || row.months.some(n => typeof n !== 'number' || !Number.isFinite(n))) throw new Error('年薪資料格式不正確。');
    }
    for (const field of ['welfareData', 'taxData', '其他(92)Data']) if (data[field] !== undefined && !Array.isArray(data[field])) throw new Error('薪資明細格式不正確。');
    return data;
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
  window.SalaryStore = { read, write, extract, validate, backup };
})();
