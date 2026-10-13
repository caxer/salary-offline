/* Shared mobile shell; every screen width uses the same phone layout. */
(function () {
  "use strict";
  const h = React.createElement;
  const { useState, useEffect, useRef } = React;
  const paths = {
    lock: "M7 11V7a5 5 0 0 1 10 0v4 M5 11h14v10H5z M12 15v2",
    menu: "M5 6h14 M5 12h14 M5 18h14",
    close: "M6 6l12 12 M18 6L6 18",
    salary: "M4 5h16v14H4z M4 9h16 M8 13h3 M8 16h7",
    growth: "M4 19h16 M5 15l5-5 4 3 5-8 M15 5h4v4",
    health: "M12 20S3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12z M8 11h8 M12 7v8",
    gift: "M3 8h18v4H3z M5 12v8h14v-8 M12 8v12 M12 8S5 8 6 4s6 4 6 4 5-8 6-4-6 4-6 4",
    income: "M6 3h12v18H6z M9 7h6 M9 11h6 M9 15h4",
    face: "M8 3H4v4 M16 3h4v4 M4 17v4h4 M20 17v4h-4 M8 9v2 M16 9v2 M12 9v4h-1 M8 16s4 3 8 0",
    arrow: "M5 12h14 M14 7l5 5-5 5",
  };
  function Icon({ name, size = 22 }) {
    return h("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true }, h("path", { d: paths[name] || paths.salary }));
  }
  function Login({ hasCredential, busy, error, onPassword, onPasskey, hasData, onImport, importName, onCancelImport, loading }) {
    const [password, setPassword] = useState("");
    const [usePassword, setUsePassword] = useState(!hasCredential);
    const [visible, setVisible] = useState(false);
    const submit = async e => {
      e.preventDefault();
      if (!password || busy) return;
      await onPassword(password);
      setPassword("");
    };
    return h("main", { className: "login-page" },
      h("div", { className: "login-brand" }, h("span", { className: "brand-mark" }, h(Icon, { name: "salary", size: 25 })), "薪資看板"),
      h("div", { className: "login-intro" }, h("span", { className: "eyebrow" }, "YOUR INCOME, AT A GLANCE"), h("h1", null, "每一份收入，", h("br"), "好好掌握。"), h("p", null, "年薪、成長與福利，一個地方就看得到。")),
      h("section", { className: "login-card", "aria-label": "輸入密碼解鎖薪資資料" },
        h("span", { className: "login-lock" }, h(Icon, { name: hasCredential ? "face" : "lock", size: 28 })),
        h("h2", null, "解鎖你的薪資"), h("p", { className: "muted" }, "每次開啟或回到網站會自動驗證；取消後可重試或使用密碼。"),
        !hasData ? h("div", { className: "import-start" }, h("p", null, "薪資只存這部手機。請匯入原 salary.html 或加密備份，不會上傳檔案。"), h(ImportButton, { onImport, busy: busy || loading }), loading ? h("p", { role: "status" }, "正在讀取手機資料…") : null) : null,
        importName ? h("p", { className: "import-name" }, "已選取：", importName, "。輸入原密碼後才會儲存。", h("button", { type: "button", className: "text-button", onClick: onCancelImport, disabled: busy }, "取消匯入")) : null,
        !hasData ? null : hasCredential && !usePassword ? h("div", { className: "login-options" },
          h("button", { className: "btn primary full", onClick: onPasskey, disabled: busy }, h(Icon, { name: "face" }), busy ? "驗證中…" : "Face ID／通行金鑰登入"),
          h("button", { className: "text-button", onClick: () => setUsePassword(true), disabled: busy }, "使用密碼登入")) :
          h("form", { onSubmit: submit, className: "login-form" },
            h("input", { name: "username", autoComplete: "username", defaultValue: "salary-owner", className: "autofill-username", tabIndex: -1, "aria-hidden": true }),
            h("label", { htmlFor: "salary-password" }, "登入密碼"),
            h("div", { className: "password-field" },
              h("input", { id: "salary-password", name: "password", type: visible ? "text" : "password", autoComplete: "current-password", placeholder: "輸入原本的密碼", value: password, onChange: e => setPassword(e.target.value), required: true, disabled: busy }),
              h("button", { type: "button", className: "password-toggle", "aria-label": visible ? "隱藏密碼" : "顯示密碼", onClick: () => setVisible(!visible) }, visible ? "隱藏" : "顯示")),
            h("button", { type: "submit", className: "btn primary full", disabled: busy || !hasData }, busy ? "正在解鎖…" : "解鎖薪資資料", h(Icon, { name: "arrow", size: 20 })),
            hasCredential ? h("button", { type: "button", className: "text-button", onClick: () => setUsePassword(false), disabled: busy }, "改用 Face ID 登入") : null),
        error ? h("p", { role: "status", className: "login-error" }, error) : null),
      h(Offline, { busy: busy || loading }),
      h("p", { className: "privacy-note" }, h(Icon, { name: "lock", size: 14 }), "薪資加密存手機，不會上傳；請保留加密備份。"));
  }
  function ImportButton({ onImport, busy }) {
    const ref = useRef(null);
    return h(React.Fragment, null,
      h("input", { ref, type: "file", accept: ".html,.json,text/html,application/json", hidden: true, "aria-label": "選擇薪資加密檔案", onChange: e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void onImport(file); } }),
      h("button", { type: "button", className: "btn primary full", onClick: () => ref.current.click(), disabled: busy }, "匯入加密薪資資料"));
  }
  function Offline({ busy }) {
    const [state, setState] = useState({ ...SalaryOffline.state });
    useEffect(() => {
      const update = e => setState(e.detail);
      addEventListener('salary-offline-status', update);
      setState({ ...SalaryOffline.state });
      return () => removeEventListener('salary-offline-status', update);
    }, []);
    return h("div", { className: "offline-state", role: "status" },
      h("span", null, state.ready ? "離線已就緒" : state.error || "正在準備離線使用…"),
      state.update ? h("button", { type: "button", className: "text-button", disabled: busy, onClick: SalaryOffline.update }, "更新程式") : null);
  }
  function Header({ title, editing, editable, dirty, onEdit, onSettings, onLock }) {
    return h("header", { className: "mobile-header" },
      h("div", { className: "mobile-heading" }, h("span", { className: "eyebrow" }, "薪資看板"), h("h1", null, title)),
      h("div", { className: "mobile-header-actions" },
        editable ? h("button", { className: "btn edit-button", onClick: onEdit }, editing ? "完成編輯" : "編輯") : null,
        h("button", { className: "icon-button", onClick: onLock, "aria-label": "鎖定", title: "鎖定" }, h(Icon, { name: "lock", size: 20 })),
        h("button", { className: "icon-button", onClick: onSettings, "aria-label": "設定與更多", "aria-haspopup": "dialog" }, h(Icon, { name: "menu" }), dirty ? h("span", { className: "unsaved-dot" }) : null)));
  }
  function Nav({ tabs, activeTab, onChange }) {
    const icons = ["salary", "growth", "health", "gift", "income"];
    const labels = ["年薪", "成長", "健保", "福利", "所得"];
    return h("nav", { className: "bottom-nav", role: "tablist", "aria-label": "薪資看板分頁" }, tabs.map((title, index) =>
      h("button", { key: title, role: "tab", "aria-label": title, "aria-selected": index === activeTab, className: index === activeTab ? "active" : "", onClick: () => onChange(index) }, h(Icon, { name: icons[index] }), h("span", null, labels[index]))));
  }
  function Settings({ onClose, ready, pending, busy, supported, message, securityNote, onSetup, onForget, onChangePassword, onExport, onImport }) {
    const ref = useRef(null);
    const [copied, setCopied] = useState(false);
    useEffect(() => {
      const dialog = ref.current;
      dialog.showModal();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = previousOverflow; };
    }, []);
    const copy = async () => {
      try { await navigator.clipboard.writeText(location.href); setCopied(true); }
      catch { setCopied(false); }
    };
    return h("dialog", { ref, className: "settings-sheet", "aria-labelledby": "settings-title", onCancel: e => { e.preventDefault(); if (!busy) onClose(); }, onClick: e => { if (e.target === e.currentTarget && !busy) onClose(); } },
      h("div", { className: "sheet-inner" },
        h("div", { className: "sheet-handle" }),
        h("div", { className: "sheet-title" }, h("h2", { id: "settings-title" }, "設定與更多"), h("button", { className: "icon-button", onClick: onClose, disabled: busy, "aria-label": "關閉設定" }, h(Icon, { name: "close" }))),
        h("section", { className: "settings-section" },
          h("div", { className: "section-heading" }, h(Icon, { name: "face" }), h("h3", null, "Face ID 與免密登入"), h("span", { className: "state-pill" }, ready ? "已啟用" : pending ? "待完成" : "未啟用")),
          h("p", null, pending ? "通行金鑰已建立。再點一次下方按鈕，完成 Face ID 驗證與加密設定。" : "使用這部手機的 Face ID、指紋或裝置密碼解鎖薪資。"),
          supported ? h("button", { className: "btn primary full", onClick: onSetup, disabled: busy }, h(Icon, { name: "face" }), busy ? "等待系統驗證…" : pending ? "完成 Face ID 設定" : ready ? "重新設定免密登入" : "啟用 Face ID／通行金鑰") : h("p", null, "目前開啟方式不支援通行金鑰，請在 Safari 開啟。"),
          message ? h("p", { className: "settings-message", role: "status" }, message) : null,
          ready ? h("button", { className: "text-button", onClick: onForget, disabled: busy }, "停用免密登入") : null,
          h("details", { className: "passkey-help", open: message && !ready ? true : undefined }, h("summary", null, "Face ID 沒有出現？"),
            h("p", null, "請在 Safari 開啟這個網址，使用 iOS 18 或更新版本，並開啟 iCloud「密碼與鑰匙圈」。App 內的瀏覽器可能限制驗證。"),
            h("p", { className: "site-address" }, location.href),
            h("button", { className: "btn full", onClick: copy }, copied ? "網址已複製，請貼到 Safari" : "複製網址"))),
        h("section", { className: "settings-section" }, h("h3", null, "密碼與資料"),
          securityNote ? h("p", { className: "security-note" }, securityNote) : null,
          h("button", { className: "settings-row", onClick: onChangePassword, disabled: busy }, h("span", null, "改密碼"), h(Icon, { name: "arrow", size: 18 })),
          h("button", { className: "settings-row", onClick: onExport, disabled: busy }, h("span", null, "儲存加密副本"), h(Icon, { name: "arrow", size: 18 })),
          h(ImportButton, { onImport, busy }),
          h("p", { className: "settings-caption" }, "編輯會自動加密存於這部手機。備份請存到「我的 iPhone」或電腦；換手機需匯入備份。清除網站資料會移除本機資料。"))));
  }
  window.SalaryMobile = { Login, Header, Nav, Settings, Offline };
})();
