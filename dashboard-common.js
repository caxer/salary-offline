/* ============================================================================
   Shared utilities & components for the salary / billing dashboards.

   Loaded as a CLASSIC <script> (NOT type="text/babel"), so the browser never
   has to fetch it through Babel. That keeps these files openable directly via
   file:// — the JSX components below are written with React.createElement
   instead of JSX precisely so no in-browser Babel transform is required here.

   Requires React (and, for ChartView, Chart.js) to be loaded beforehand.
   Exposes: formatMoney, CryptoUtils, securityNoteFor, PasswordModal,
   ChangePasswordModal, ChartView, DeltaBadge, drawHaloText, useUnloadGuard,
   EmptyState, EmbeddedStore as globals.
   ============================================================================ */
(function () {
  "use strict";
  const { useState, useEffect, useRef } = React;
  const h = React.createElement;

  // ---- Formatting -----------------------------------------------------------
  function formatMoney(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return "-";
    return new Intl.NumberFormat("zh-TW").format(amount);
  }

  // ---- Crypto (AES-256-GCM + PBKDF2-SHA256) --------------------------------
  // Payload: "v2:<iterations>:" + base64(salt[32] | iv[12] | ciphertext+tag).
  // Legacy payloads (plain base64, no prefix) used 100k iterations; they still
  // decrypt, and needsUpgrade() flags them so the next save re-encrypts.
  const KDF_ITERATIONS = 600000; // OWASP 2023 recommendation for PBKDF2-SHA256
  const LEGACY_ITERATIONS = 100000;

  function bytesToBase64(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(s);
  }

  function parsePayload(payload) {
    const m = /^v2:(\d+):(.*)$/s.exec(payload);
    return m
      ? { iterations: Number(m[1]), base64: m[2] }
      : { iterations: LEGACY_ITERATIONS, base64: payload };
  }

  const RECOMMENDED_PASSWORD_LENGTH = 12; // 只用於提示，不強制

  // Header badge text after unlock/save: legacy format first, then weak password
  function securityNoteFor(password, needsUpgrade) {
    if (needsUpgrade) return "舊加密格式，按「更新 HTML」升級";
    if (password && password.length < RECOMMENDED_PASSWORD_LENGTH)
      return `密碼少於 ${RECOMMENDED_PASSWORD_LENGTH} 字元，建議改密碼`;
    return "";
  }

  const CryptoUtils = {
    async deriveKey(password, salt, iterations) {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
      );
      return crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: iterations,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
    },

    async encrypt(data, password) {
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await this.deriveKey(password, salt, KDF_ITERATIONS);
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoder.encode(JSON.stringify(data))
      );
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);
      return `v2:${KDF_ITERATIONS}:` + bytesToBase64(combined);
    },

    // true when the payload was written with weaker settings than encrypt() uses now
    needsUpgrade(payload) {
      return parsePayload(payload).iterations < KDF_ITERATIONS;
    },

    async decrypt(payload, password) {
      try {
        const { iterations, base64 } = parsePayload(payload);
        const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const salt = combined.slice(0, 32);
        const iv = combined.slice(32, 44);
        const data = combined.slice(44);
        const key = await this.deriveKey(password, salt, iterations);
        const decrypted = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: iv },
          key,
          data
        );
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
      } catch (e) {
        throw new Error("解密失敗，密碼錯誤");
      }
    },
  };

  // ---- Modal styles (PasswordModal / ChangePasswordModal) -------------------
  const MODAL_OVERLAY = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };
  const MODAL_CARD = {
    background: "#272729",
    borderRadius: "12px",
    padding: "24px",
    width: "360px",
    maxWidth: "calc(100vw - 32px)",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.1)",
  };
  const MODAL_INPUT = {
    width: "100%",
    padding: "10px 12px",
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "16px",
    boxSizing: "border-box",
  };
  const MODAL_ERROR = {
    color: "var(--danger-color)",
    marginBottom: "12px",
    fontSize: "13px",
  };

  function modalButtons(onCancel, onSubmit) {
    return h(
      "div",
      { style: { display: "flex", gap: "8px", justifyContent: "flex-end" } },
      h(
        "button",
        {
          className: "tab-btn",
          onClick: onCancel,
          style: { borderColor: "rgba(255,255,255,0.2)" },
        },
        "取消"
      ),
      h(
        "button",
        {
          className: "tab-btn",
          onClick: onSubmit,
          style: { background: "var(--accent-color)", color: "#fff" },
        },
        "確認"
      )
    );
  }

  // ---- PasswordModal --------------------------------------------------------
  // title / error: optional overrides (unlock prompt, wrong-password retry)
  function PasswordModal({ isOpen, onConfirm, onCancel, mode, title, error: externalError }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
      if (!password) {
        setError("請輸入密碼");
        return;
      }
      setError("");
      onConfirm(password);
      setPassword("");
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter") handleSubmit();
      if (e.key === "Escape") onCancel();
    };

    return h(
      "div",
      {
        style: MODAL_OVERLAY,
        onClick: (e) => {
          if (e.target === e.currentTarget) onCancel();
        },
      },
      h(
        "div",
        { style: MODAL_CARD },
        h(
          "h3",
          { style: { marginTop: 0 } },
          title || (mode === "export" ? "設定匯出密碼" : "輸入密碼")
        ),
        h(
          "div",
          { style: { marginBottom: "16px" } },
          h("input", {
            type: "password",
            autoComplete: "current-password",
            "aria-label": "登入密碼",
            placeholder: mode === "export" ? "設定密碼" : "請輸入密碼",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            onKeyDown: handleKeyDown,
            autoFocus: true,
            style: MODAL_INPUT,
          })
        ),
        error || externalError
          ? h("div", { style: MODAL_ERROR }, error || externalError)
          : null,
        modalButtons(onCancel, handleSubmit)
      )
    );
  }

  // ---- ChangePasswordModal --------------------------------------------------
  // currentPassword: the password the data was unlocked with (verified here,
  // so an unattended unlocked page can't be re-keyed). onConfirm(newPassword)
  function ChangePasswordModal({ isOpen, currentPassword, onConfirm, onCancel }) {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [again, setAgain] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const reset = () => {
      setCurrent("");
      setNext("");
      setAgain("");
      setError("");
    };
    const cancel = () => {
      reset();
      onCancel();
    };
    const handleSubmit = () => {
      if (currentPassword && current !== currentPassword) {
        setError("目前密碼錯誤");
        return;
      }
      if (!next) {
        setError("請輸入新密碼");
        return;
      }
      if (next !== again) {
        setError("兩次輸入的新密碼不一致");
        return;
      }
      if (next === currentPassword) {
        setError("新密碼與目前密碼相同");
        return;
      }
      reset();
      onConfirm(next);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Enter") handleSubmit();
      if (e.key === "Escape") cancel();
    };
    const field = (placeholder, value, setValue, autoFocus) =>
      h(
        "div",
        { style: { marginBottom: "12px" } },
        h("input", {
          type: "password",
          placeholder,
          value,
          onChange: (e) => setValue(e.target.value),
          onKeyDown: handleKeyDown,
          autoFocus,
          style: MODAL_INPUT,
        })
      );

    return h(
      "div",
      {
        style: MODAL_OVERLAY,
        onClick: (e) => {
          if (e.target === e.currentTarget) cancel();
        },
      },
      h(
        "div",
        { style: MODAL_CARD },
        h("h3", { style: { marginTop: 0 } }, "變更密碼"),
        currentPassword ? field("目前密碼", current, setCurrent, true) : null,
        field("新密碼", next, setNext, !currentPassword),
        field("再輸入一次新密碼", again, setAgain, false),
        error ? h("div", { style: MODAL_ERROR }, error) : null,
        modalButtons(cancel, handleSubmit)
      )
    );
  }

  // ---- ChartView (Chart.js wrapper) ----------------------------------------
  function ChartView({ type, data, options }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
      if (!canvasRef.current) return;

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      try {
        chartRef.current = new Chart(ctx, {
          type,
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: { color: "#94a3b8", font: { size: 11 } },
              },
            },
            scales: {
              x: {
                grid: { color: "rgba(255,255,255,0.05)" },
                ticks: { color: "#94a3b8", font: { size: 10 } },
              },
              y: {
                grid: { color: "rgba(255,255,255,0.05)" },
                ticks: { color: "#94a3b8", font: { size: 10 } },
              },
            },
            ...options,
          },
          plugins: [
            {
              id: "crosshair",
              afterDraw: (chart) => {
                if (chart.tooltip?._active?.length) {
                  const activePoint = chart.tooltip._active[0].element;
                  const c = chart.ctx;
                  const x = activePoint.x;
                  const y = activePoint.y;
                  const top = chart.scales.y.top;
                  const bottom = chart.scales.y.bottom;
                  const left = chart.scales.x.left;
                  const right = chart.scales.x.right;

                  c.save();
                  c.beginPath();
                  c.lineWidth = 1;
                  c.strokeStyle = "rgba(148, 163, 184, 0.5)";
                  c.setLineDash([5, 5]);
                  c.moveTo(x, top);
                  c.lineTo(x, bottom);
                  c.moveTo(left, y);
                  c.lineTo(right, y);
                  c.stroke();
                  c.restore();
                }
              },
            },
            ...((options && options.plugins && options.plugins.extraPlugins) ||
              []),
          ],
        });
      } catch (e) {
        // chart creation failed silently
      }

      return () => {
        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }
      };
    }, [type, data, JSON.stringify(options)]);

    return h(
      "div",
      { className: "chart-container" },
      h("canvas", { ref: canvasRef })
    );
  }

  // ---- DeltaBadge (YOY 增減 pill) -------------------------------------------
  // goodWhenUp=false（支出）：增加＝紅、減少＝綠；goodWhenUp=true（收入）反向
  function DeltaBadge({ cur, prev, goodWhenUp = false, title }) {
    if (!prev) return null;
    const pct = ((cur - prev) / Math.abs(prev)) * 100;
    if (Math.abs(pct) < 0.05) {
      return h("span", { className: "delta flat", title: title }, "持平");
    }
    const up = pct > 0;
    return h(
      "span",
      { className: `delta ${up === goodWhenUp ? "good" : "bad"}`, title: title },
      `${up ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}%`
    );
  }

  // Canvas 文字加卡片底色描邊，壓在虛線/長條上仍可讀
  function drawHaloText(ctx, text, x, y) {
    ctx.save();
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#272729";
    ctx.strokeText(text, x, y);
    ctx.restore();
    ctx.fillText(text, x, y);
  }

  // ---- Hook: unsaved-changes guard -----------------------------------------
  // dirtyRef: a ref whose .current says whether there are unsaved edits
  function useUnloadGuard(dirtyRef) {
    useEffect(() => {
      const onBeforeUnload = (e) => {
        if (!dirtyRef.current) return;
        e.preventDefault();
        e.returnValue = "";
      };
      window.addEventListener("beforeunload", onBeforeUnload);
      return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, []);
  }

  // ---- Empty state (no data loaded yet) -------------------------------------
  function EmptyState({ title, text, buttonLabel, onPick }) {
    return h(
      "div",
      { className: "empty-state" },
      h(
        "svg",
        {
          width: 40,
          height: 40,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 1.5,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": "true",
        },
        h("rect", { x: 4, y: 11, width: 16, height: 10, rx: 2 }),
        h("path", { d: "M8 11V7a4 4 0 0 1 8 0v4" })
      ),
      h("h2", null, title),
      text ? h("p", null, text) : null,
      onPick ? h("button", { className: "btn", onClick: onPick }, buttonLabel) : null
    );
  }

  // ---- EmbeddedStore: encrypted payload carried inside the HTML itself ------
  // The page holds <script type="text/plain" id="embedded-data">BASE64</script>
  // (CryptoUtils.encrypt output). saveHtml() writes the page back with a new
  // payload, so the .html file is both the app and its data.
  const EMBED_RE = /(<script\b[^>]*\bid="embedded-data"[^>]*>)[\s\S]*?(<\/script>)/;
  let pageSnapshot = null;
  let fileHandle = null; // remembered for the session: later saves skip the picker

  const EmbeddedStore = {
    // Call from a classic inline <script> at the end of <body>: it runs before
    // Babel/React touch the DOM, so outerHTML is still the pristine page.
    snapshot() {
      pageSnapshot = "<!doctype html>\n" + document.documentElement.outerHTML + "\n";
    },

    read() {
      const el = document.getElementById("embedded-data");
      return el ? el.textContent.trim() : "";
    },

    // null when html has no payload block
    replacePayload(html, payload) {
      if (!html || !EMBED_RE.test(html)) return null;
      return html.replace(EMBED_RE, (_, open, close) => open + payload + close);
    },

    // makePayload: async () => base64. The picker opens first so it still has
    // the click's user activation. Returns false if the user cancelled.
    async saveHtml(suggestedName, makePayload) {
      if (window.showSaveFilePicker) {
        try {
          if (!fileHandle) {
            fileHandle = await window.showSaveFilePicker({
              suggestedName,
              types: [{ description: "HTML", accept: { "text/html": [".html"] } }],
            });
          }
        } catch (e) {
          if (e.name === "AbortError") return false;
          throw e;
        }
        // Chrome empties an existing file as soon as the save picker confirms,
        // so a freshly picked file may read "". What the file must hold if this
        // save fails: the disk copy, or else the page as loaded.
        let onDisk = "";
        try {
          onDisk = await (await fileHandle.getFile()).text();
        } catch (e) {}
        const original = onDisk || pageSnapshot;
        let source = null;
        try {
          const payload = await makePayload();
          // Prefer the file on disk (identical except the payload line, keeps
          // git diffs to one line); fall back to the in-memory snapshot.
          source = this.replacePayload(onDisk, payload) || this.replacePayload(pageSnapshot, payload);
          if (!source) throw new Error("找不到頁面內的資料區塊");
          await writeFile(fileHandle, source);
          return true;
        } catch (e) {
          // Never leave the file empty: put the previous version back.
          let restored = false;
          try {
            if ((await fileHandle.getFile()).size > 0) restored = true;
            else if (original) {
              await writeFile(fileHandle, original);
              restored = true;
            }
          } catch (e2) {}
          // The new data still has to land somewhere.
          if (source) downloadFile(suggestedName, source);
          throw new Error(
            e.message +
              (restored ? "（原檔未變更）" : "（原檔無法還原，請用 git 取回）") +
              (source ? "；新版本已改用下載存一份" : ""),
          );
        }
      }

      // No File System Access API (e.g. Firefox): download a copy instead
      const source = this.replacePayload(pageSnapshot, await makePayload());
      if (!source) throw new Error("找不到頁面內的資料區塊");
      downloadFile(suggestedName, source);
      return true;
    },
  };

  // createWritable() writes to a swap file that replaces the target only on
  // close(); abort() discards it so a failed write leaves the target as it was.
  async function writeFile(handle, text) {
    const writable = await handle.createWritable();
    try {
      await writable.write(text);
      await writable.close();
    } catch (e) {
      try {
        await writable.abort();
      } catch (e2) {}
      throw e;
    }
  }

  function downloadFile(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- Expose as globals for the inline Babel scripts ----------------------
  window.formatMoney = formatMoney;
  window.CryptoUtils = CryptoUtils;
  window.securityNoteFor = securityNoteFor;
  window.PasswordModal = PasswordModal;
  window.ChangePasswordModal = ChangePasswordModal;
  window.ChartView = ChartView;
  window.DeltaBadge = DeltaBadge;
  window.drawHaloText = drawHaloText;
  window.useUnloadGuard = useUnloadGuard;
  window.EmptyState = EmptyState;
  window.EmbeddedStore = EmbeddedStore;
})();
