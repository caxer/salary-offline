(function () {
  'use strict';
  const state = { ready: false, update: false, error: '', persistent: false };
  let registration;
  const notify = () => dispatchEvent(new CustomEvent('salary-offline-status', { detail: { ...state } }));
  async function start() {
    if (!('serviceWorker' in navigator) || !isSecureContext) {
      state.error = '請用 Safari 開啟 HTTPS 網址，才能準備離線使用。'; notify(); return;
    }
    try {
      registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
      const inspect = () => { state.update = !!registration.waiting && !!navigator.serviceWorker.controller; notify(); };
      inspect();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed') inspect(); });
      });
      await navigator.serviceWorker.ready;
      state.ready = true; notify();
      if (navigator.storage?.persisted) state.persistent = await navigator.storage.persisted();
      notify();
    } catch { state.error = '離線程式尚未下載完成，請連網後重新開啟。'; notify(); }
  }
  async function persist() {
    try { state.persistent = !!await navigator.storage?.persist?.(); notify(); } catch { /* Keep backup available. */ }
  }
  function update() {
    if (!registration?.waiting) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
    registration.waiting.postMessage({ type: 'ACTIVATE' });
  }
  window.SalaryOffline = { state, persist, update };
  void start();
})();
