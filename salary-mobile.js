/* Shared mobile shell; every screen width uses the same phone layout. */
(function () {
  "use strict";
  const h = React.createElement;
  const { useState, useEffect, useRef } = React;
  const paths = {
    lock: "M7 11V7a5 5 0 0 1 10 0v4 M5 11h14v10H5z M12 15v2",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    menu: "M5 6h14 M5 12h14 M5 18h14",
    close: "M6 6l12 12 M18 6L6 18",
    salary: "M4 5h16v14H4z M4 9h16 M8 13h3 M8 16h7",
    growth: "M4 19h16 M5 15l5-5 4 3 5-8 M15 5h4v4",
    health: "M12 20S3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12z M8 11h8 M12 7v8",
    gift: "M3 8h18v4H3z M5 12v8h14v-8 M12 8v12 M12 8S5 8 6 4s6 4 6 4 5-8 6-4-6 4-6 4",
    income: "M6 3h12v18H6z M9 7h6 M9 11h6 M9 15h4",
    arrow: "M5 12h14 M14 7l5 5-5 5",
  };
  function Icon({ name, size = 22 }) {
    return h("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true }, h("path", { d: paths[name] || paths.salary }));
  }
  // 沒有密碼欄：沒有金鑰時只能用專屬連結開啟；有金鑰但手機沒有資料時匯入加密備份。
  function Login({ hasKey, legacy, busy, loading, error, onPaste, onImport }) {
    const needsImport = hasKey && !loading;
    const title = loading ? "正在開啟…" : needsImport ? "匯入薪資資料" : "用專屬連結開啟";
    // 只在舊格式資料時多一行說明，其餘說明放在按鈕提示。
    const text = needsImport && legacy ? "手機裡是舊格式資料，匯入轉換後的檔案即可取代。" : "";
    return h("main", { className: "login-page" },
      h("div", { className: "login-brand" }, h("span", { className: "brand-mark" }, h(Icon, { name: "salary", size: 25 })), "薪資看板"),
      h("div", { className: "login-intro" }, h("h1", null, "每一份收入，", h("br"), "好好掌握。")),
      h("section", { className: "login-card", "aria-label": "開啟薪資看板" },
        h("span", { className: "login-lock" }, h(Icon, { name: "link", size: 28 })),
        h("h2", null, title), text ? h("p", { className: "muted" }, text) : null,
        loading ? null : needsImport ? h(ImportButton, { onImport, busy })
          : h("button", { type: "button", className: "btn primary full", onClick: onPaste, disabled: busy, title: "點過一次專屬連結，這部手機就會記住。主畫面 App 第一次請先複製連結再按這裡。連結就是鑰匙，請勿轉傳。" }, h(Icon, { name: "link" }), busy ? "正在開啟…" : "貼上專屬連結"),
        error ? h("p", { role: "status", className: "login-error" }, error) : null),
      h(Offline, { busy: busy || loading }));
  }
  function ImportButton({ onImport, busy, row }) {
    const ref = useRef(null);
    return h(React.Fragment, null,
      h("input", { ref, type: "file", accept: ".json,application/json", hidden: true, "aria-label": "選擇薪資加密檔案", onChange: e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void onImport(file); } }),
      row ? h("button", { type: "button", className: "settings-row", onClick: () => ref.current.click(), disabled: busy, title: "換手機或還原時，匯入加密備份；會取代手機資料" }, h("span", null, "匯入加密薪資資料"), h(Icon, { name: "arrow", size: 18 }))
        : h("button", { type: "button", className: "btn primary full", onClick: () => ref.current.click(), disabled: busy, title: "選轉換後的加密檔或加密備份；薪資只存這部手機，不會上傳" }, "匯入加密薪資資料"));
  }
  // quiet：主畫面只在有更新或出錯時出現，平常不佔版面。
  function Offline({ busy, quiet }) {
    const [state, setState] = useState({ ...SalaryOffline.state });
    useEffect(() => {
      const update = e => setState(e.detail);
      addEventListener('salary-offline-status', update);
      setState({ ...SalaryOffline.state });
      return () => removeEventListener('salary-offline-status', update);
    }, []);
    if (quiet && state.ready && !state.update && !state.error) return null;
    return h("div", { className: "offline-state", role: "status" },
      h("span", null, state.ready ? "離線已就緒" : state.error || "正在準備離線使用…"),
      state.update ? h("button", { type: "button", className: "text-button", disabled: busy, onClick: SalaryOffline.update }, "更新程式") : null);
  }
  function Header({ title, editing, editable, dirty, onEdit, onSettings }) {
    return h("header", { className: "mobile-header" },
      h("div", { className: "mobile-heading" }, h("span", { className: "eyebrow" }, "薪資看板"), h("h1", null, title)),
      h("div", { className: "mobile-header-actions" },
        editable ? h("button", { className: "btn edit-button", onClick: onEdit }, editing ? "完成編輯" : "編輯") : null,
        h("button", { className: "icon-button", onClick: onSettings, "aria-label": "設定與更多", "aria-haspopup": "dialog" }, h(Icon, { name: "menu" }), dirty ? h("span", { className: "unsaved-dot" }) : null)));
  }
  function Nav({ tabs, activeTab, onChange }) {
    const icons = ["salary", "growth", "health", "gift", "income"];
    const labels = ["年薪", "成長", "健保", "福利", "所得"];
    return h("nav", { className: "bottom-nav", role: "tablist", "aria-label": "薪資看板分頁" }, tabs.map((title, index) =>
      h("button", { key: title, role: "tab", "aria-label": title, "aria-selected": index === activeTab, className: index === activeTab ? "active" : "", onClick: () => onChange(index) }, h(Icon, { name: icons[index] }), h("span", null, labels[index]))));
  }
  function Settings({ onClose, busy, message, onExport, onImport, onForget }) {
    const ref = useRef(null);
    useEffect(() => {
      const dialog = ref.current;
      dialog.showModal();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = previousOverflow; };
    }, []);
    return h("dialog", { ref, className: "settings-sheet", "aria-labelledby": "settings-title", onCancel: e => { e.preventDefault(); if (!busy) onClose(); }, onClick: e => { if (e.target === e.currentTarget && !busy) onClose(); } },
      h("div", { className: "sheet-inner" },
        h("div", { className: "sheet-handle" }),
        h("div", { className: "sheet-title" }, h("h2", { id: "settings-title" }, "設定與更多"), h("button", { className: "icon-button", onClick: onClose, disabled: busy, "aria-label": "關閉設定" }, h(Icon, { name: "close" }))),
        message ? h("p", { className: "settings-message", role: "status" }, message) : null,
        h("section", { className: "settings-section" },
          h("button", { className: "settings-row", onClick: onExport, disabled: busy, title: "編輯會自動加密存在這部手機；備份請存到「我的 iPhone」或電腦" }, h("span", null, "儲存加密副本"), h(Icon, { name: "arrow", size: 18 })),
          h(ImportButton, { onImport, busy, row: true }),
          h("button", { className: "settings-row", onClick: onForget, disabled: busy, title: "之後需要再用專屬連結開啟；手機裡的加密資料保留" }, h("span", null, "登出此裝置"), h(Icon, { name: "arrow", size: 18 })))));
  }
  window.SalaryMobile = { Login, Header, Nav, Settings, Offline };
})();
