// Generated from salary-app.jsx by scripts/build-app.mjs. Edit the .jsx file.
const { useState, useEffect, useMemo, useRef } = React;
const SALARY_EXCLUDE = ["ceYear", "rocYear", "months", "expectedTotal", "id"];
const getExtraFields = (data) => {
  const fields = /* @__PURE__ */ new Set();
  (data || []).forEach(
    (row) => Object.keys(row).forEach((k) => {
      if (!SALARY_EXCLUDE.includes(k) && typeof row[k] === "number")
        fields.add(k);
    })
  );
  return Array.from(fields);
};
const num = (v) => Number(v) || 0;
const baseSum = (row, n = 12) => row.months.slice(0, n).reduce((a, b) => a + num(b), 0);
const extrasSum = (row, fields) => fields.reduce((acc, k) => acc + num(row[k]), 0);
const yearTotal = (row, fields) => baseSum(row) + extrasSum(row, fields);
const monthsPaid = (row) => {
  for (let i = 11; i >= 0; i--) if (num(row.months[i]) !== 0) return i + 1;
  return 0;
};
const lastSalary = (row) => {
  const n = monthsPaid(row);
  return n ? num(row.months[n - 1]) : 0;
};
const monthSpan = (n) => n >= 12 ? "全年" : `1–${n}月`;
const pctText = (cur, prev) => {
  if (!prev) return null;
  const p = (cur - prev) / Math.abs(prev) * 100;
  return `${p > 0 ? "+" : ""}${p.toFixed(1)}%`;
};
const computeRaises = (data) => {
  const r = [];
  let currentSalary = 0;
  let lastDateIndex = -1;
  data.forEach((year) => {
    year.months.forEach((salary, monthIndex) => {
      const currentDateIndex = year.ceYear * 12 + monthIndex;
      if (currentSalary === 0) {
        currentSalary = salary;
        lastDateIndex = currentDateIndex;
        return;
      }
      if (salary > currentSalary) {
        const diff = salary - currentSalary;
        r.push({
          year: year.ceYear,
          month: monthIndex + 1,
          old: currentSalary,
          new: salary,
          diff,
          percent: diff / currentSalary * 100,
          dateIndex: currentDateIndex,
          interval: lastDateIndex === -1 ? 0 : currentDateIndex - lastDateIndex
        });
        currentSalary = salary;
        lastDateIndex = currentDateIndex;
      } else if (salary < currentSalary && salary !== 0) {
        currentSalary = salary;
        lastDateIndex = currentDateIndex;
      }
    });
  });
  return r;
};
const SalaryKpiStrip = ({ data }) => {
  if (!data || data.length === 0) return null;
  const fields = getExtraFields(data);
  const sorted = [...data].sort((a, b) => a.ceYear - b.ceYear);
  const latest = sorted[sorted.length - 1];
  const prev = sorted.find((r) => r.ceYear === latest.ceYear - 1);
  const n = monthsPaid(latest) || 12;
  const total = yearTotal(latest, fields);
  const extras = extrasSum(latest, fields);
  const cur = lastSalary(latest);
  const prevSameMonth = prev ? num(prev.months[n - 1]) : 0;
  const base = baseSum(latest, n);
  const prevBase = prev ? baseSum(prev, n) : 0;
  const fullRow = [...sorted].reverse().find((r) => monthsPaid(r) === 12) || latest;
  const fullTotal = yearTotal(fullRow, fields);
  const fullExtras = extrasSum(fullRow, fields);
  const raises = computeRaises(sorted);
  const lastRaise = raises[raises.length - 1];
  const nowIndex = latest.ceYear * 12 + (n - 1);
  const tone = (c, p) => !p || Math.abs(c - p) < 1e-9 ? void 0 : c > p ? "var(--success-color)" : "var(--danger-color)";
  return /* @__PURE__ */ React.createElement("div", { className: "kpi-grid" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-card" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, latest.ceYear, " 總收入 · ", monthSpan(n)), /* @__PURE__ */ React.createElement("div", { className: "kpi-value" }, formatMoney(total)), /* @__PURE__ */ React.createElement("div", { className: "kpi-sub" }, "本薪 ", formatMoney(total - extras), " · 其他 ", formatMoney(extras))), /* @__PURE__ */ React.createElement("div", { className: "kpi-card" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, "目前月薪 · ", n, "月"), /* @__PURE__ */ React.createElement("div", { className: "kpi-value" }, formatMoney(cur)), /* @__PURE__ */ React.createElement("div", { className: "kpi-sub" }, prevSameMonth ? `較去年同月 ${pctText(cur, prevSameMonth)}` : "無去年同月資料")), /* @__PURE__ */ React.createElement("div", { className: "kpi-card" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, "本薪較去年同期"), /* @__PURE__ */ React.createElement("div", { className: "kpi-value", style: { color: tone(base, prevBase) } }, prevBase ? pctText(base, prevBase) : "—"), /* @__PURE__ */ React.createElement("div", { className: "kpi-sub" }, prevBase ? `${base >= prevBase ? "多" : "少"} ${formatMoney(Math.abs(base - prevBase))} · ${monthSpan(n)}` : "—")), /* @__PURE__ */ React.createElement("div", { className: "kpi-card" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, fullRow.ceYear, " 變動薪資佔比"), /* @__PURE__ */ React.createElement("div", { className: "kpi-value" }, fullTotal ? (fullExtras / fullTotal * 100).toFixed(0) : 0, "%"), /* @__PURE__ */ React.createElement("div", { className: "kpi-sub" }, fields.length ? fields.join("、") : "無其他欄位")), /* @__PURE__ */ React.createElement("div", { className: "kpi-card" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, "上次調薪"), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "kpi-value",
      style: { color: lastRaise ? "var(--success-color)" : void 0 }
    },
    lastRaise ? `+${lastRaise.percent.toFixed(1)}%` : "—"
  ), /* @__PURE__ */ React.createElement("div", { className: "kpi-sub" }, lastRaise ? `${lastRaise.year}/${lastRaise.month} · 距今 ${Math.max(0, nowIndex - lastRaise.dateIndex)} 個月` : "尚無調薪紀錄")));
};
const YearAccordion = ({
  title,
  roc,
  stats = [],
  count,
  expanded,
  onToggle,
  actions,
  children
}) => /* @__PURE__ */ React.createElement("div", { className: `glass-card acc ${expanded ? "open" : ""}` }, /* @__PURE__ */ React.createElement(
  "div",
  {
    className: "acc-head",
    role: "button",
    tabIndex: 0,
    "aria-expanded": expanded,
    onClick: onToggle,
    onKeyDown: (e) => {
      if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onToggle();
      }
    }
  },
  /* @__PURE__ */ React.createElement("div", { className: "acc-title" }, /* @__PURE__ */ React.createElement("span", { className: "acc-chevron", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("h3", null, title, roc && /* @__PURE__ */ React.createElement("span", { className: "roc" }, "民國 ", roc)), actions),
  /* @__PURE__ */ React.createElement("div", { className: "acc-stats" }, stats.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.label, className: "acc-stat" }, /* @__PURE__ */ React.createElement("span", null, s.label), /* @__PURE__ */ React.createElement("strong", { style: { color: s.color } }, s.value))), /* @__PURE__ */ React.createElement("span", { className: "acc-count" }, "共 ", count, " 筆"))
), expanded && /* @__PURE__ */ React.createElement("div", { className: "acc-body table-container" }, children));
const AddButton = ({ onClick }) => /* @__PURE__ */ React.createElement(
  "button",
  {
    className: "btn btn-sm btn-ghost",
    style: { padding: "2px 10px", fontSize: "0.75rem" },
    onClick: (e) => {
      e.stopPropagation();
      onClick();
    }
  },
  "+ 新增"
);
const DeleteButton = ({ onClick, label = "刪除" }) => /* @__PURE__ */ React.createElement(
  "button",
  {
    className: "btn btn-sm btn-danger",
    style: { padding: "2px 8px", fontSize: "0.75rem" },
    onClick
  },
  label
);
const toggleInSet = (set, key) => {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
};
const NHIDashboard = ({ nhiData, isEditing, onUpdate }) => {
  const dataByYear = useMemo(() => {
    if (!nhiData || nhiData.length === 0) return {};
    const grouped = {};
    nhiData.forEach((item, index) => {
      const year = item.date.split("-")[0];
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push({ ...item, originalIndex: index });
    });
    const result = {};
    Object.keys(grouped).sort().forEach((year) => {
      let runningIncomeSum = 0;
      result[year] = grouped[year].map((item) => {
        const income = item.income;
        const is211 = item.is211;
        if (is211) {
          runningIncomeSum += income;
        }
        const cumIncome = runningIncomeSum;
        const bracket = item.bracket;
        const diff = cumIncome - bracket;
        const subjectAmount = is211 && diff > 0 ? Math.min(income, diff) : 0;
        const nhiFee = is211 ? Math.round(subjectAmount * 0.0211) : 0;
        let tax = 0;
        if (is211) {
          tax = Math.round(income * 0.05);
        } else if (item.note?.includes("抽獎")) {
          tax = Math.round(income * 0.1);
        }
        const net = income - nhiFee - tax;
        return {
          ...item,
          cumIncome,
          diff,
          subjectAmount,
          nhiFee,
          tax,
          net
        };
      });
    });
    return result;
  }, [nhiData]);
  const years = Object.keys(dataByYear).sort((a, b) => b - a);
  const [expandedYears, setExpandedYears] = useState(
    () => new Set(years.slice(0, 1))
  );
  const handleCheckboxChange = (originalIndex) => {
    const newData = [...nhiData];
    newData[originalIndex] = {
      ...newData[originalIndex],
      is211: !newData[originalIndex].is211
    };
    onUpdate(newData);
  };
  const handleItemEdit = (originalIndex, field, value) => {
    let newData = [...nhiData];
    newData[originalIndex] = {
      ...newData[originalIndex],
      [field]: value
    };
    if (field === "date") {
      newData.sort((a, b) => a.date.localeCompare(b.date));
    }
    onUpdate(newData);
  };
  const deleteRecord = (originalIndex) => {
    const rec = nhiData[originalIndex];
    if (!confirm(`刪除 ${rec.date}「${rec.note || ""}」這筆紀錄？`)) return;
    const newData = nhiData.filter((_, index) => index !== originalIndex);
    onUpdate(newData);
  };
  const addNewRecord = (year) => {
    const newData = [...nhiData];
    const lastInYear = [...nhiData].reverse().find((d) => d.date.startsWith(year));
    newData.push({
      date: `${year}-01-01`,
      bracket: lastInYear ? lastInYear.bracket : 368400,
      income: 0,
      is211: false,
      note: "新紀錄"
    });
    newData.sort((a, b) => a.date.localeCompare(b.date));
    onUpdate(newData);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "nhi-dashboard" }, years.map((year) => {
    const yearItems = dataByYear[year];
    const totals = yearItems.reduce(
      (acc, cur) => ({
        income: acc.income + cur.income,
        subjectAmount: acc.subjectAmount + cur.subjectAmount,
        nhiFee: acc.nhiFee + cur.nhiFee,
        tax: acc.tax + cur.tax,
        net: acc.net + cur.net
      }),
      { income: 0, subjectAmount: 0, nhiFee: 0, tax: 0, net: 0 }
    );
    return /* @__PURE__ */ React.createElement(
      YearAccordion,
      {
        key: year,
        title: year,
        roc: year - 1911,
        count: yearItems.length,
        expanded: expandedYears.has(year),
        onToggle: () => setExpandedYears((s) => toggleInSet(s, year)),
        actions: isEditing && /* @__PURE__ */ React.createElement(AddButton, { onClick: () => addNewRecord(year) }),
        stats: [
          { label: "所得", value: formatMoney(totals.income) },
          {
            label: "二代健保費",
            value: formatMoney(totals.nhiFee),
            color: totals.nhiFee ? "var(--danger-color)" : void 0
          },
          { label: "扣繳稅額", value: formatMoney(totals.tax) },
          { label: "實領", value: formatMoney(totals.net) }
        ]
      },
      /* @__PURE__ */ React.createElement("div", { className: "rec-list" }, yearItems.map((item, idx) => /* @__PURE__ */ React.createElement("div", { className: "rec-card", key: idx }, /* @__PURE__ */ React.createElement("div", { className: "rec-card-head" }, /* @__PURE__ */ React.createElement("span", null, item.date, item.note ? ` · ${item.note}` : ""), isEditing && /* @__PURE__ */ React.createElement(
        DeleteButton,
        {
          onClick: () => deleteRecord(item.originalIndex)
        }
      )), isEditing ? /* @__PURE__ */ React.createElement("div", { className: "rec-grid rec-edit" }, /* @__PURE__ */ React.createElement("label", null, "日期", /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "date",
          className: "edit-input",
          value: item.date,
          onChange: (e) => handleItemEdit(
            item.originalIndex,
            "date",
            e.target.value
          ),
          onClick: (e) => e.target.showPicker && e.target.showPicker()
        }
      )), /* @__PURE__ */ React.createElement("label", null, "所得級距(B)", /* @__PURE__ */ React.createElement(
        "input",
        {
          className: "edit-input",
          type: "number",
          inputMode: "numeric",
          value: item.bracket,
          onFocus: (e) => e.target.select(),
          onChange: (e) => handleItemEdit(
            item.originalIndex,
            "bracket",
            parseInt(e.target.value) || 0
          )
        }
      )), /* @__PURE__ */ React.createElement("label", null, "所得(C)", /* @__PURE__ */ React.createElement(
        "input",
        {
          className: "edit-input",
          type: "number",
          inputMode: "numeric",
          value: item.income,
          onFocus: (e) => e.target.select(),
          onChange: (e) => handleItemEdit(
            item.originalIndex,
            "income",
            parseInt(e.target.value) || 0
          )
        }
      )), /* @__PURE__ */ React.createElement("label", { className: "rec-check" }, "計入二代健保", /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          checked: item.is211,
          onChange: () => handleCheckboxChange(item.originalIndex)
        }
      )), /* @__PURE__ */ React.createElement("label", { className: "rec-wide" }, "備註", /* @__PURE__ */ React.createElement(
        "input",
        {
          className: "edit-input",
          value: item.note || "",
          onChange: (e) => handleItemEdit(
            item.originalIndex,
            "note",
            e.target.value
          )
        }
      ))) : /* @__PURE__ */ React.createElement("div", { className: "rec-grid" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "所得級距(B)"), /* @__PURE__ */ React.createElement("b", null, formatMoney(item.bracket))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "所得(C)"), /* @__PURE__ */ React.createElement("b", null, formatMoney(item.income))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "收入累加(E)"), /* @__PURE__ */ React.createElement("b", null, formatMoney(item.cumIncome))), /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            color: item.diff > 0 ? "var(--warning-color)" : ""
          }
        },
        /* @__PURE__ */ React.createElement("span", null, "E-B(F)"),
        /* @__PURE__ */ React.createElement("b", null, formatMoney(item.diff))
      ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "計費金額"), /* @__PURE__ */ React.createElement("b", null, formatMoney(item.subjectAmount))), /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            color: item.nhiFee ? "var(--danger-color)" : ""
          }
        },
        /* @__PURE__ */ React.createElement("span", null, "二代健保費"),
        /* @__PURE__ */ React.createElement("b", null, formatMoney(item.nhiFee))
      ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "扣繳稅額(5%)"), /* @__PURE__ */ React.createElement("b", null, formatMoney(item.tax))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "實領金額"), /* @__PURE__ */ React.createElement("b", null, formatMoney(item.net))), /* @__PURE__ */ React.createElement("div", { className: "rec-wide" }, /* @__PURE__ */ React.createElement("span", null, "計入二代健保"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          "aria-label": `${item.date} 計入二代健保`,
          checked: item.is211,
          onChange: () => handleCheckboxChange(item.originalIndex)
        }
      ))))))
    );
  }));
};
const DataTable = ({ data, title, isEditing, onUpdate }) => {
  if (!data || data.length === 0) return /* @__PURE__ */ React.createElement("div", null, "無資料");
  const headers = Object.keys(data[0]);
  const handleEdit = (index, field, value) => {
    if (isTotalField(field) || field === "year") return;
    const newData = [...data];
    if (typeof data[0][field] === "number") {
      newData[index][field] = Number(value) || 0;
    } else {
      newData[index][field] = value;
    }
    onUpdate(newData);
  };
  const handleDelete = (index) => {
    const row = data[index];
    if (!confirm(`刪除 ${row.year || row["年度"] || ""} 年度這筆紀錄？`)) return;
    const newData = data.filter((_, i) => i !== index);
    onUpdate(newData);
  };
  const handleAdd = () => {
    const newRow = {};
    const lastYearRow = data.length > 0 ? [...data].sort((a, b) => {
      const valA = a.year || a["年度"] || 0;
      const valB = b.year || b["年度"] || 0;
      return valB - valA;
    })[0] : null;
    const nextYear = lastYearRow ? Number(lastYearRow.year || lastYearRow["年度"] || 0) + 1 : (/* @__PURE__ */ new Date()).getFullYear();
    headers.forEach((h) => {
      if (h === "year" || h === "年度") {
        newRow[h] = nextYear;
      } else if (typeof data[0][h] === "number") {
        newRow[h] = 0;
      } else {
        newRow[h] = "";
      }
    });
    onUpdate([...data, newRow]);
  };
  const isTotalField = (h) => h === "expectedTotal" || h === "總額";
  const isExcludedFromSum = (k) => {
    const lower = k.toLowerCase();
    return isTotalField(k) || lower === "year" || lower === "id" || lower === "no" || lower === "年度" || k === "ceYear" || k === "rocYear";
  };
  const taxTableLabels = [
    { label: "年度", text: "年度", key: "year" },
    { label: "總額", text: "總額", key: "expectedTotal" },
    {
      label: /* @__PURE__ */ React.createElement("span", null, "所得(50)", /* @__PURE__ */ React.createElement("br", null), "(14薪)"),
      text: "所得(50)（14薪）",
      key: "salary50"
    },
    {
      label: /* @__PURE__ */ React.createElement("span", null, "所得(50)(2)", /* @__PURE__ */ React.createElement("br", null), "(超4倍薪,績效+紅利)"),
      text: "所得(50)(2)（績效+紅利）",
      key: "salary50_2"
    },
    { label: "利息", text: "利息", key: "interest" },
    { label: "股利(54C)", text: "股利(54C)", key: "dividend" },
    {
      label: /* @__PURE__ */ React.createElement("span", null, "獎金(91)", /* @__PURE__ */ React.createElement("br", null), "(尾牙抽獎)"),
      text: "獎金(91)（尾牙抽獎）",
      key: "bonus"
    },
    {
      label: /* @__PURE__ */ React.createElement("span", null, "其他(92)", /* @__PURE__ */ React.createElement("br", null), "(福委會)"),
      text: "其他(92)（福委會）",
      key: "other"
    }
  ];
  const labelText = (h) => {
    const found = taxTableLabels.find((t) => t.key === h);
    return found ? found.text : h;
  };
  const displayRows = title === "年度所得稅紀錄" ? taxTableLabels.map((item) => ({
    label: item.label,
    key: item.key
  })) : headers.map((h) => ({ label: h, key: h }));
  const calculateRowTotal = (row) => {
    return Object.entries(row).reduce((s, [k, v]) => {
      if (!isExcludedFromSum(k) && typeof v === "number") {
        return s + (v || 0);
      }
      return s;
    }, 0);
  };
  const yearOf = (row) => Number(row.year || row["年度"] || 0);
  const columnTotals = {};
  displayRows.forEach((rowConfig) => {
    const header = rowConfig.key;
    if ((typeof data[0][header] === "number" || isTotalField(header)) && header !== "year") {
      columnTotals[header] = data.reduce((sum, row) => {
        let val = row[header] || 0;
        if (isTotalField(header)) {
          val = calculateRowTotal(row);
        }
        return sum + val;
      }, 0);
    }
  });
  const phoneInput = (row, i, h) => {
    const v = row[h];
    const isDate = h.toLowerCase().includes("date") || h.includes("日期");
    return /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "edit-input",
        type: typeof v === "number" ? "number" : isDate ? "date" : "text",
        inputMode: typeof v === "number" ? "numeric" : void 0,
        value: v,
        onFocus: (e) => typeof v === "number" && e.target.select(),
        onChange: (e) => handleEdit(i, h, e.target.value),
        onClick: (e) => isDate && e.target.showPicker && e.target.showPicker(),
        style: {
          width: "55%",
          minHeight: 40,
          fontSize: "1rem",
          textAlign: typeof v === "number" ? "right" : "left"
        }
      }
    );
  };
  return /* @__PURE__ */ React.createElement("div", { className: `glass-card ${isEditing ? "editing" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", null, title), /* @__PURE__ */ React.createElement("span", { className: "card-sub" }, "總額旁為與前一年度的增減")), isEditing && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-ghost", onClick: handleAdd }, "+ 新增紀錄")), /* @__PURE__ */ React.createElement("div", { className: "rec-list" }, data.map((row, i) => ({ row, i })).sort((a, b) => yearOf(b.row) - yearOf(a.row)).map(({ row, i }) => {
    const prevRow = data.find(
      (r) => yearOf(r) === yearOf(row) - 1
    );
    return /* @__PURE__ */ React.createElement("div", { className: "rec-card", key: i }, /* @__PURE__ */ React.createElement("div", { className: "rec-card-head" }, /* @__PURE__ */ React.createElement("span", null, "年度 ", yearOf(row)), isEditing && /* @__PURE__ */ React.createElement(DeleteButton, { onClick: () => handleDelete(i) })), displayRows.map(({ key: h, label }, j) => {
      if (h === "year" || label === "年度") return null;
      if (isTotalField(h)) {
        return /* @__PURE__ */ React.createElement("div", { className: "rec-line", key: j }, /* @__PURE__ */ React.createElement("span", null, labelText(h)), /* @__PURE__ */ React.createElement("b", null, formatMoney(calculateRowTotal(row)), prevRow && /* @__PURE__ */ React.createElement(
          DeltaBadge,
          {
            cur: calculateRowTotal(row),
            prev: calculateRowTotal(prevRow),
            goodWhenUp: true,
            title: `${yearOf(prevRow)}：${formatMoney(calculateRowTotal(prevRow))}`
          }
        )));
      }
      return /* @__PURE__ */ React.createElement("div", { className: "rec-line", key: j }, /* @__PURE__ */ React.createElement("span", null, labelText(h)), isEditing ? phoneInput(row, i, h) : typeof row[h] === "number" ? /* @__PURE__ */ React.createElement("b", null, formatMoney(row[h])) : /* @__PURE__ */ React.createElement("b", null, row[h]));
    }));
  }), /* @__PURE__ */ React.createElement("div", { className: "rec-card rec-total-card" }, /* @__PURE__ */ React.createElement("div", { className: "rec-card-head" }, /* @__PURE__ */ React.createElement("span", null, "總計")), displayRows.map(
    ({ key: h, label }, i) => (typeof data[0][h] === "number" || isTotalField(h)) && h !== "year" && label !== "年度" ? /* @__PURE__ */ React.createElement("div", { className: "rec-line", key: i }, /* @__PURE__ */ React.createElement("span", null, labelText(h)), /* @__PURE__ */ React.createElement("b", null, formatMoney(columnTotals[h]))) : null
  ))));
};
const YearTable = ({ data, setData, isEditing }) => {
  const dynamicFields = useMemo(() => getExtraFields(data), [data]);
  const [expandedYears, setExpandedYears] = useState(() => /* @__PURE__ */ new Set([Math.max(...data.map((row) => row.ceYear))]));
  const HeadTag = isEditing ? "div" : "button";
  const now = /* @__PURE__ */ new Date();
  const updateField = (index, field, value) => {
    const newData = [...data];
    newData[index][field] = Number(value);
    setData(newData);
  };
  const updateMonth = (rowIndex, monthIndex, value) => {
    const newData = [...data];
    newData[rowIndex].months[monthIndex] = Number(value);
    setData(newData);
  };
  const deleteRow = (index) => {
    if (!confirm(`刪除 ${data[index].ceYear} 年度的薪資資料？`)) return;
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
  };
  const totalAnnualSalary = data.reduce(
    (sum, row) => sum + yearTotal(row, dynamicFields),
    0
  );
  const fieldTotals = dynamicFields.reduce((acc, field) => {
    acc[field] = data.reduce((s, row) => s + (row[field] || 0), 0);
    return acc;
  }, {});
  const bandIndexAt = (rowIndex, mIndex) => {
    let changeCount = 0;
    let prevVal = 0;
    for (let ri = 0; ri <= rowIndex; ri++) {
      const limitM = ri === rowIndex ? mIndex : 11;
      for (let mi = 0; mi <= limitM; mi++) {
        const v = data[ri].months[mi];
        if (v !== prevVal && v !== 0) {
          changeCount++;
          prevVal = v;
        }
      }
    }
    return changeCount;
  };
  return /* @__PURE__ */ React.createElement("div", { className: "year-cards" }, data.map((row, index) => ({ row, index })).sort((a, b) => b.row.ceYear - a.row.ceYear).map(({ row, index }) => {
    const annualTotal = yearTotal(row, dynamicFields);
    const prevRow = data.find((r) => r.ceYear === row.ceYear - 1);
    const paid = monthsPaid(row);
    const partial = paid > 0 && paid < 12;
    const expanded = isEditing || expandedYears.has(row.ceYear);
    return /* @__PURE__ */ React.createElement("div", { className: `glass-card year-card ${isEditing ? "editing" : ""}`, key: row.ceYear, "data-year": row.ceYear }, /* @__PURE__ */ React.createElement(
      HeadTag,
      {
        className: `year-card-head ${isEditing ? "" : "year-toggle"}`,
        type: isEditing ? void 0 : "button",
        "aria-expanded": isEditing ? void 0 : expanded,
        "aria-label": isEditing ? void 0 : `${row.ceYear} 年薪明細`,
        onClick: isEditing ? void 0 : () => setExpandedYears((prev) => toggleInSet(prev, row.ceYear))
      },
      /* @__PURE__ */ React.createElement("div", { className: "year-card-title" }, isEditing ? /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          value: row.ceYear,
          onChange: (e) => updateField(index, "ceYear", e.target.value),
          className: "edit-input",
          style: { textAlign: "center", width: "90px" }
        }
      ) : /* @__PURE__ */ React.createElement("strong", null, row.ceYear), partial && /* @__PURE__ */ React.createElement("span", { className: "th-sub" }, monthSpan(paid)), !isEditing && /* @__PURE__ */ React.createElement("span", { className: "year-chevron", "aria-hidden": "true" }, expanded ? "−" : "+")),
      /* @__PURE__ */ React.createElement("div", { className: "year-card-total" }, /* @__PURE__ */ React.createElement("strong", null, formatMoney(annualTotal)), prevRow && (partial ? /* @__PURE__ */ React.createElement(
        DeltaBadge,
        {
          cur: baseSum(row, paid),
          prev: baseSum(prevRow, paid),
          goodWhenUp: true,
          title: `未滿一年：只比較本薪 ${monthSpan(paid)} 同期`
        }
      ) : /* @__PURE__ */ React.createElement(
        DeltaBadge,
        {
          cur: annualTotal,
          prev: yearTotal(prevRow, dynamicFields),
          goodWhenUp: true,
          title: `${prevRow.ceYear}：${formatMoney(yearTotal(prevRow, dynamicFields))}`
        }
      ))),
      isEditing && /* @__PURE__ */ React.createElement(DeleteButton, { onClick: () => deleteRow(index) })
    ), /* @__PURE__ */ React.createElement("div", { className: "year-card-body", hidden: !expanded }, /* @__PURE__ */ React.createElement("div", { className: "month-grid" }, row.months.map((m, mIndex) => {
      const prevSalary = mIndex > 0 ? row.months[mIndex - 1] : index > 0 ? data[index - 1].months[11] : null;
      const hasChanged = prevSalary !== null && prevSalary !== m && m !== 0;
      const isRaise = hasChanged && prevSalary > 0 && m > prevSalary;
      const bgColor = !m ? "transparent" : bandIndexAt(index, mIndex) % 2 === 0 ? "rgba(255, 255, 255, 0.03)" : "rgba(41, 151, 255, 0.1)";
      const isCurrent = row.ceYear === now.getFullYear() && mIndex === now.getMonth();
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: mIndex,
          className: "month-cell",
          style: {
            backgroundColor: bgColor,
            borderLeft: hasChanged ? `2px solid ${isRaise ? "var(--success-color)" : "var(--accent-color)"}` : "none",
            boxShadow: isCurrent ? "inset 0 -2px 0 var(--accent-secondary)" : void 0
          }
        },
        /* @__PURE__ */ React.createElement("span", { className: "month-cell-label" }, mIndex + 1, "月"),
        isEditing ? /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "number",
            inputMode: "numeric",
            "aria-label": `${row.ceYear} ${mIndex + 1}月`,
            value: m,
            onFocus: (e) => e.target.select(),
            onChange: (e) => updateMonth(index, mIndex, e.target.value),
            className: "edit-input"
          }
        ) : m ? /* @__PURE__ */ React.createElement("span", { className: "month-cell-value" }, isRaise && /* @__PURE__ */ React.createElement("span", { className: "raise-mark", "aria-hidden": "true" }, "▲"), formatMoney(m)) : /* @__PURE__ */ React.createElement("span", { className: "month-cell-value month-empty" }, "—")
      );
    })), dynamicFields.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "extra-list" }, dynamicFields.map((field) => /* @__PURE__ */ React.createElement("div", { className: "extra-row", key: field }, /* @__PURE__ */ React.createElement("span", null, field), isEditing ? /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        inputMode: "numeric",
        "aria-label": `${row.ceYear} ${field}`,
        value: row[field],
        onFocus: (e) => e.target.select(),
        onChange: (e) => updateField(index, field, e.target.value),
        className: "editable-input"
      }
    ) : /* @__PURE__ */ React.createElement("b", null, row[field] ? formatMoney(row[field]) : "—"))))));
  }), /* @__PURE__ */ React.createElement("div", { className: "glass-card year-total-card" }, /* @__PURE__ */ React.createElement("div", { className: "year-card-head" }, /* @__PURE__ */ React.createElement("span", null, "歷年累計"), /* @__PURE__ */ React.createElement("strong", null, formatMoney(totalAnnualSalary)))));
};
const AnalysisDashboard = ({ data }) => {
  const [metricType, setMetricType] = useState("all_stacked");
  const [showTrend, setShowTrend] = useState(false);
  const [showAvg, setShowAvg] = useState(false);
  const [showMedian, setShowMedian] = useState(false);
  const dynamicFields = useMemo(() => getExtraFields(data), [data]);
  const paidCounts = useMemo(
    () => data.map((d) => monthsPaid(d) || 12),
    [data]
  );
  const calculateLinearRegression = (x, y) => {
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  };
  const calculateMedian = (arr) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  const raises = useMemo(() => computeRaises(data), [data]);
  const raiseStats = useMemo(() => {
    if (raises.length === 0) return null;
    const withInterval = raises.filter((r) => r.interval > 0);
    return {
      count: raises.length,
      avgPct: raises.reduce((s, r) => s + r.percent, 0) / raises.length,
      avgInterval: withInterval.length ? withInterval.reduce((s, r) => s + r.interval, 0) / withInterval.length : 0,
      growth: raises[raises.length - 1].new / raises[0].old - 1
    };
  }, [raises]);
  const BASE_COLOR = "#38bdf8";
  const EXTRA_COLORS = [
    "#4ade80",
    // green
    "#f472b6",
    // pink
    "#fb923c",
    // orange
    "#a3e635",
    // lime
    "#e879f9",
    // fuchsia
    "#f87171"
    // red
  ];
  const alpha = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${a})`;
  const isStacked = metricType === "all_stacked";
  const chartData = useMemo(() => {
    const xLabels = data.map((d) => d.ceYear);
    let datasets = [];
    const totalIncomeData = data.map((d) => yearTotal(d, dynamicFields));
    let primaryYData = [];
    let primaryLabel = "";
    if (isStacked) {
      datasets.push({
        type: "bar",
        label: "本薪",
        data: data.map((d) => baseSum(d)),
        backgroundColor: alpha(BASE_COLOR, 0.75),
        borderWidth: 0,
        borderRadius: 3,
        maxBarThickness: 56,
        stack: "income"
      });
      dynamicFields.forEach((field, index) => {
        const color = EXTRA_COLORS[index % EXTRA_COLORS.length];
        datasets.push({
          type: "bar",
          label: field,
          data: data.map((d) => d[field] || 0),
          backgroundColor: alpha(color, 0.75),
          borderWidth: 0,
          borderRadius: 3,
          maxBarThickness: 56,
          stack: "income"
        });
      });
      primaryYData = totalIncomeData;
    } else {
      if (metricType === "salary") {
        primaryYData = data.map((d) => lastSalary(d));
        primaryLabel = "月薪 (年底或最新)";
      } else if (metricType === "total") {
        primaryYData = totalIncomeData;
        primaryLabel = "年度總收入";
      } else {
        primaryYData = data.map((d) => d[metricType] || 0);
        primaryLabel = metricType;
      }
      datasets.push({
        label: primaryLabel,
        data: primaryYData,
        backgroundColor: alpha(BASE_COLOR, 0.15),
        borderColor: BASE_COLOR,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 3
      });
    }
    if (primaryYData.length > 0) {
      const all = xLabels.map((_, i) => i);
      const full = all.filter(
        (i) => metricType === "salary" || paidCounts[i] >= 12
      );
      const idx = full.length >= 2 ? full : all;
      const ys = idx.map((i) => primaryYData[i]);
      const line = (label, values, color, dash) => ({
        type: "line",
        label,
        data: values,
        borderColor: color,
        borderDash: dash,
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
        tension: 0,
        order: -1,
        stack: isStacked ? label : void 0
        // 不參與堆疊
      });
      if (showTrend) {
        const { slope, intercept } = calculateLinearRegression(idx, ys);
        datasets.push(
          line("趨勢線", all.map((x) => slope * x + intercept), "#facc15", [6, 4])
        );
      }
      if (showAvg) {
        const avgValue = ys.reduce((a, b) => a + b, 0) / ys.length;
        datasets.push(
          line("平均值", new Array(all.length).fill(avgValue), "rgba(255,255,255,0.6)", [5, 5])
        );
      }
      if (showMedian) {
        datasets.push(
          line("中位數", new Array(all.length).fill(calculateMedian(ys)), "#a78bfa", [2, 3])
        );
      }
    }
    return { labels: xLabels, datasets };
  }, [data, metricType, showTrend, showAvg, showMedian, dynamicFields, paidCounts]);
  const chartOptions = {
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        stacked: isStacked,
        offset: true,
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: {
          color: "#94a3b8",
          // 未滿一年的年度加註已發薪月份
          callback: function(value, index) {
            const label = this.getLabelForValue(value);
            const n = paidCounts[index];
            return n < 12 ? `${label} (1–${n}月)` : label;
          }
        }
      },
      y: {
        stacked: isStacked,
        beginAtZero: isStacked,
        grace: isStacked ? "10%" : 0,
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#94a3b8" }
      }
    },
    plugins: {
      legend: { labels: { color: "#94a3b8", font: { size: 11 } } },
      tooltip: {
        callbacks: {
          title: (items) => `年度: ${items[0].label}`,
          label: (item) => `${item.dataset.label || ""}: ${new Intl.NumberFormat("zh-TW").format(Math.round(item.parsed.y))}`,
          footer: (items) => {
            if (!isStacked) return "";
            const sum = items.filter((it) => it.dataset.stack === "income").reduce((s, it) => s + it.parsed.y, 0);
            return "總計: " + new Intl.NumberFormat("zh-TW").format(sum);
          }
        }
      },
      extraPlugins: [
        {
          id: "stack-total-labels",
          afterDatasetsDraw: (chart) => {
            if (!isStacked) return;
            const { ctx, scales: { x, y } } = chart;
            const stacks = chart.data.datasets.filter(
              (ds, i) => ds.stack === "income" && chart.isDatasetVisible(i)
            );
            const compact = x.width / chart.data.labels.length < 80;
            ctx.save();
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.font = compact ? "600 10px Inter" : "600 11px Inter";
            chart.data.labels.forEach((_, i) => {
              const sum = stacks.reduce((s, ds) => s + (ds.data[i] || 0), 0);
              if (sum <= 0) return;
              drawHaloText(
                ctx,
                compact ? `${(sum / 1e4).toFixed(0)}萬` : formatMoney(Math.round(sum)),
                x.getPixelForValue(i),
                y.getPixelForValue(sum) - 6
              );
            });
            ctx.restore();
          }
        }
      ]
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "analysis-container" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "glass-card",
      style: { display: "flex", flexDirection: "column", flex: "3 1 480px" }
    },
    /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", null, "薪資成長趨勢"), /* @__PURE__ */ React.createElement("span", { className: "card-sub" }, "統計線只取完整年度；未滿一年以 (1–n月) 標示")), /* @__PURE__ */ React.createElement("div", { className: "card-tools" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: metricType,
        onChange: (e) => setMetricType(e.target.value),
        className: "chart-select",
        "aria-label": "圖表指標"
      },
      /* @__PURE__ */ React.createElement("option", { value: "all_stacked" }, "總收入堆疊"),
      /* @__PURE__ */ React.createElement("option", { value: "total" }, "年度總收入"),
      /* @__PURE__ */ React.createElement("option", { value: "salary" }, "月薪"),
      dynamicFields.map((f) => /* @__PURE__ */ React.createElement("option", { key: f, value: f }, f))
    ), [
      ["趨勢線", showTrend, setShowTrend],
      ["平均", showAvg, setShowAvg],
      ["中位數", showMedian, setShowMedian]
    ].map(([label, on, set]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: label,
        className: "chip-toggle",
        "aria-pressed": on,
        onClick: () => set(!on)
      },
      label
    )))),
    /* @__PURE__ */ React.createElement(
      ChartView,
      {
        type: isStacked ? "bar" : "line",
        data: chartData,
        options: chartOptions
      }
    )
  ), /* @__PURE__ */ React.createElement("div", { className: "glass-card", style: { flex: "2 1 360px" } }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", null, "加薪歷程明細"), raiseStats && /* @__PURE__ */ React.createElement("span", { className: "card-sub" }, "共 ", raiseStats.count, " 次 · 平均調幅", " ", raiseStats.avgPct.toFixed(1), "% · 平均間隔", " ", raiseStats.avgInterval.toFixed(0), " 個月 · 累計成長", " ", (raiseStats.growth * 100).toFixed(0), "%"))), /* @__PURE__ */ React.createElement("div", { className: "raise-history" }, [...raises].reverse().map((r, i) => /* @__PURE__ */ React.createElement("div", { className: "rec-card", key: i }, /* @__PURE__ */ React.createElement("div", { className: "rec-card-head" }, /* @__PURE__ */ React.createElement("span", null, r.year, "年 ", r.month, "月"), /* @__PURE__ */ React.createElement("span", { className: "delta good" }, "＋", r.percent.toFixed(1), "%")), /* @__PURE__ */ React.createElement("div", { className: "rec-line" }, /* @__PURE__ */ React.createElement("span", null, "調整後月薪"), /* @__PURE__ */ React.createElement("b", { className: "raise-amount" }, formatMoney(r.new))), /* @__PURE__ */ React.createElement("div", { className: "rec-line" }, /* @__PURE__ */ React.createElement("span", null, "原薪資"), /* @__PURE__ */ React.createElement("b", null, formatMoney(r.old))), /* @__PURE__ */ React.createElement("div", { className: "rec-line" }, /* @__PURE__ */ React.createElement("span", null, "增加金額"), /* @__PURE__ */ React.createElement("b", null, "＋", formatMoney(r.diff))), /* @__PURE__ */ React.createElement("div", { className: "rec-line" }, /* @__PURE__ */ React.createElement("span", null, "距上次調整"), /* @__PURE__ */ React.createElement("b", null, r.interval > 0 ? `${r.interval} 個月` : "—")))), !raises.length && /* @__PURE__ */ React.createElement("p", { className: "empty-inline" }, "尚無加薪紀錄"))));
};
const WelfareDashboard = ({ welfareData = [], isEditing, onUpdate }) => {
  const dataByYear = useMemo(() => {
    if (!welfareData || welfareData.length === 0) return {};
    const grouped = {};
    welfareData.forEach((item, index) => {
      const year = item.year;
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push({ ...item, originalIndex: index });
    });
    return grouped;
  }, [welfareData]);
  const years = Object.keys(dataByYear).sort((a, b) => b - a);
  const [expandedYears, setExpandedYears] = useState(
    () => new Set(years.slice(0, 1))
  );
  const handleItemEdit = (originalIndex, field, value) => {
    let newData = [...welfareData];
    if (field === "amount" || field === "year") {
      value = parseInt(value) || 0;
    }
    newData[originalIndex] = {
      ...newData[originalIndex],
      [field]: value
    };
    onUpdate(newData);
  };
  const deleteRecord = (originalIndex) => {
    if (!confirm(`刪除「${welfareData[originalIndex].item}」這筆紀錄？`)) return;
    const newData = welfareData.filter(
      (_, index) => index !== originalIndex
    );
    onUpdate(newData);
  };
  const addNewRecord = (year) => {
    onUpdate([
      ...welfareData,
      { year: parseInt(year), item: "新福利項目", amount: 0 }
    ]);
  };
  const amountInput = (item) => /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "edit-input",
      type: "number",
      inputMode: "numeric",
      value: item.amount,
      onFocus: (e) => e.target.select(),
      onChange: (e) => handleItemEdit(item.originalIndex, "amount", e.target.value),
      style: { width: "110px" }
    }
  );
  return /* @__PURE__ */ React.createElement("div", { className: "welfare-dashboard" }, years.map((year) => {
    const yearItems = dataByYear[year];
    const yearTotals = yearItems.reduce(
      (acc, cur) => {
        const val = cur.amount || 0;
        if (cur.type === "lottery") acc.lottery += val;
        else if (val < 0) acc.deduction += Math.abs(val);
        else acc.welfare += val;
        return acc;
      },
      { welfare: 0, lottery: 0, deduction: 0 }
    );
    return /* @__PURE__ */ React.createElement(
      YearAccordion,
      {
        key: year,
        title: parseInt(year) + 1911,
        roc: year,
        count: yearItems.length,
        expanded: expandedYears.has(year),
        onToggle: () => setExpandedYears((s) => toggleInSet(s, year)),
        actions: isEditing && /* @__PURE__ */ React.createElement(AddButton, { onClick: () => addNewRecord(year) }),
        stats: [
          {
            label: "福利所得",
            value: formatMoney(yearTotals.welfare - yearTotals.deduction)
          },
          {
            label: "機會中獎",
            value: formatMoney(yearTotals.lottery),
            color: yearTotals.lottery ? "var(--warning-color)" : void 0
          }
        ]
      },
      /* @__PURE__ */ React.createElement("div", { className: "rec-list" }, yearItems.map((item, idx) => /* @__PURE__ */ React.createElement("div", { className: "rec-card", key: idx }, /* @__PURE__ */ React.createElement("div", { className: "rec-card-head" }, isEditing ? /* @__PURE__ */ React.createElement(
        "input",
        {
          className: "edit-input",
          value: item.item,
          onChange: (e) => handleItemEdit(
            item.originalIndex,
            "item",
            e.target.value
          ),
          style: { width: "55%" }
        }
      ) : /* @__PURE__ */ React.createElement("span", null, item.item), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "delta flat",
          style: item.type === "lottery" ? { color: "var(--warning-color)" } : void 0
        },
        item.type === "lottery" ? "中獎" : "一般"
      ), isEditing && /* @__PURE__ */ React.createElement(
        DeleteButton,
        {
          onClick: () => deleteRecord(item.originalIndex)
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "rec-line" }, /* @__PURE__ */ React.createElement("span", null, item.type === "lottery" ? "機會中獎" : "福利所得"), isEditing ? amountInput(item) : /* @__PURE__ */ React.createElement(
        "b",
        {
          style: {
            color: item.type !== "lottery" && item.amount < 0 ? "var(--danger-color)" : void 0
          }
        },
        formatMoney(item.amount)
      )))))
    );
  }));
};
const App = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [allData, setAllData] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const authRef = useRef(false);
  const busyRef = useRef(false);
  const dataRef = useRef(null);
  const [salaryRecs, setSalaryRecs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [loginError, setLoginError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const BACKUP_DAYS = 7;
  const SAVE_STATES = ["正在加密儲存…", "已儲存於這部手機"];
  useEffect(() => {
    if (saveMessage !== SAVE_STATES[1]) return;
    const timer = setTimeout(() => setSaveMessage((message) => message === SAVE_STATES[1] ? "" : message), 2500);
    return () => clearTimeout(timer);
  }, [saveMessage]);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const keyRef = useRef(null);
  const [hasKey, setHasKey] = useState(false);
  const [importReason, setImportReason] = useState("");
  const payloadRef = useRef("");
  const revisionRef = useRef(0);
  const writeRef = useRef(Promise.resolve());
  const writeBusyRef = useRef(false);
  const writeVersionRef = useRef(0);
  const [backupPayload, setBackupPayload] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [backupAt, setBackupAt] = useState(null);
  const backupDue = !!savedAt && (!backupAt || savedAt > backupAt) && Date.now() - (backupAt ? Date.parse(backupAt) : 0) > BACKUP_DAYS * 864e5;
  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);
  useUnloadGuard(dirtyRef);
  const migrateData = (data) => {
    if (data.taxData) {
      const mapping = {
        年度: "year",
        總額: "expectedTotal",
        "所得(50)": "salary50",
        "所得(50)(2)": "salary50_2",
        利息: "interest",
        "股利(54C)": "dividend",
        "獎金(91)": "bonus",
        "其他(92)": "other"
      };
      data.taxData = data.taxData.map((row) => {
        const newRow = {};
        Object.keys(row).forEach((k) => {
          const newKey = mapping[k] || k;
          newRow[newKey] = row[k];
        });
        return newRow;
      });
    }
    return data;
  };
  const enter = (loaded) => {
    if (loaded["其他(92)Data"] && !loaded.welfareData) loaded.welfareData = loaded["其他(92)Data"];
    const migrated = migrateData(loaded);
    dataRef.current = migrated;
    setAllData(migrated);
    setSalaryRecs(migrated.salaryData);
    setIsEditing(false);
    dirtyRef.current = false;
    setIsDirty(false);
    authRef.current = true;
    setAuthenticated(true);
    setLoginError("");
  };
  const remember = async (key, fresh) => {
    keyRef.current = key;
    setHasKey(true);
    if (fresh && !await LinkKey.save(key)) setSaveMessage("這個瀏覽器無法記住登入，下次仍需用專屬連結開啟。");
  };
  const useKey = async (key, fresh) => {
    const payload = payloadRef.current;
    if (!SalaryStore.isCurrent(payload)) {
      setImportReason(payload ? "legacy" : "");
      await remember(key, fresh);
      return true;
    }
    let loaded;
    try {
      loaded = await SalaryStore.open(key, payload);
    } catch (error) {
      if (error.code !== "wrong-key") {
        setLoginError("讀取失敗：" + error.message);
        return false;
      }
      return null;
    }
    await remember(key, fresh);
    enter(loaded);
    return true;
  };
  const awaitImport = async (key, fresh) => {
    setImportReason("other-key");
    await remember(key, fresh);
    return true;
  };
  useEffect(() => {
    let active = true;
    (async () => {
      await OpenGuide.gate();
      let found = null;
      try {
        found = await LinkKey.current();
      } catch (error) {
        setLoginError(error.message);
      }
      try {
        const record = await SalaryStore.read();
        if (record) {
          payloadRef.current = record.payload;
          revisionRef.current = record.revision;
          setSavedAt(record.savedAt || null);
        }
        setBackupAt(await SalaryStore.backedUpAt());
      } catch (error) {
        if (active) {
          setLoginError(error.message);
          setLoading(false);
        }
        return;
      }
      if (!active) return;
      let opened = found ? await useKey(found.key, found.fresh) : false;
      if (opened === null && found.fresh) {
        const saved = await LinkKey.load();
        if (saved && active && await useKey(saved, false)) opened = true;
      }
      if (opened === null && active) opened = await awaitImport(found.key, found.fresh);
      if (opened && active) OpenGuide.afterLogin({ fresh: found.fresh });
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);
  const handlePaste = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setLoginError("");
    try {
      const key = await LinkKey.fromClipboard();
      if (await useKey(key, true) === null) await awaitImport(key, true);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const saveLocal = (data) => {
    const version = ++writeVersionRef.current;
    const snapshot = JSON.parse(JSON.stringify(data));
    writeBusyRef.current = true;
    dirtyRef.current = true;
    setIsDirty(true);
    setSaveMessage("正在加密儲存…");
    setBackupPayload("");
    const task = writeRef.current.then(async () => {
      if (version !== writeVersionRef.current) return;
      const payload = await SalaryStore.seal(keyRef.current, snapshot);
      const record = await SalaryStore.write(payload, revisionRef.current);
      revisionRef.current = record.revision;
      payloadRef.current = payload;
      setSavedAt(record.savedAt);
      if (version === writeVersionRef.current) {
        dirtyRef.current = false;
        setIsDirty(false);
        setSaveMessage("已儲存於這部手機");
      }
    });
    writeRef.current = task.catch((error) => {
      if (version === writeVersionRef.current) setSaveMessage(error.message);
    }).finally(() => {
      if (version === writeVersionRef.current) writeBusyRef.current = false;
    });
    return task;
  };
  const updateSalary = (newData) => {
    const data = { ...dataRef.current, salaryData: newData };
    dataRef.current = data;
    setAllData(data);
    setSalaryRecs(newData);
    void saveLocal(data).catch(() => {
    });
  };
  const updateAllData = (key) => (newData) => {
    const data = { ...dataRef.current, [key]: newData };
    dataRef.current = data;
    setAllData(data);
    void saveLocal(data).catch(() => {
    });
  };
  const getExportData = () => dataRef.current;
  const handleImport = async (file) => {
    if (!file || !keyRef.current || busyRef.current || writeBusyRef.current) return;
    const report = (message) => {
      setLoginError(message);
      setSettingsMessage(message);
    };
    busyRef.current = true;
    setBusy(true);
    report("");
    try {
      if (dirtyRef.current) throw new Error("目前資料尚未儲存，請先匯出加密備份，再重新開啟後匯入。");
      if (file.size > 20 * 1024 * 1024) throw new Error("檔案過大。");
      const payload = SalaryStore.extract(await file.text());
      const loaded = await SalaryStore.open(keyRef.current, payload);
      if (SalaryStore.isCurrent(payloadRef.current) && !confirm("匯入後會取代手機資料。請先保留最新加密備份；是否繼續？")) return;
      const record = await SalaryStore.write(payload, revisionRef.current);
      revisionRef.current = record.revision;
      payloadRef.current = payload;
      setSavedAt(record.savedAt);
      setBackupAt(await SalaryStore.markBackup());
      setImportReason("");
      setShowSettings(false);
      setBackupPayload("");
      void SalaryOffline.persist();
      enter(loaded);
      setSaveMessage("");
    } catch (error) {
      report(error.message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const handleForget = async () => {
    await writeRef.current;
    if (dirtyRef.current) {
      setSettingsMessage("尚未儲存成功，請先匯出加密備份再移除。");
      return;
    }
    if (!confirm("移除後需要再用專屬連結開啟。手機裡的加密資料會保留；是否繼續？")) return;
    if (!await LinkKey.forget()) {
      setSettingsMessage("無法移除登入，請允許網站儲存後再試。");
      return;
    }
    location.reload();
  };
  const handleExport = async () => {
    try {
      if (writeBusyRef.current) {
        setSettingsMessage("請等本機儲存完成再匯出。");
        return false;
      }
      if (dirtyRef.current && !backupPayload) {
        setBackupPayload(await SalaryStore.seal(keyRef.current, getExportData()));
        setSettingsMessage("加密備份已準備，請再按「儲存加密副本」。");
        return false;
      }
      const saved = await SalaryStore.backup(backupPayload || payloadRef.current);
      if (saved) {
        setBackupAt(await SalaryStore.markBackup());
        setSettingsMessage("已開啟加密備份儲存，請確認檔案已存到「我的 iPhone」或電腦。");
        setBackupPayload("");
      }
      return saved;
    } catch (e) {
      setSettingsMessage("匯出失敗：" + e.message);
      return false;
    }
  };
  const addNewYear = () => {
    let updatedSalaryRecs = [...salaryRecs];
    let updatedNhiData = [...allData?.nhiData || []];
    if (salaryRecs.length > 0) {
      const lastrec = salaryRecs[salaryRecs.length - 1];
      const newRec = JSON.parse(JSON.stringify(lastrec));
      newRec.ceYear = lastrec.ceYear + 1;
      newRec.expectedTotal = 0;
      Object.keys(newRec).forEach((k) => {
        if (!SALARY_EXCLUDE.includes(k) && typeof newRec[k] === "number") {
          newRec[k] = 0;
        }
      });
      updatedSalaryRecs.push(newRec);
      updatedSalaryRecs.sort((a, b) => a.ceYear - b.ceYear);
      setSalaryRecs(updatedSalaryRecs);
    }
    if (updatedNhiData.length > 0) {
      const years = [
        ...new Set(updatedNhiData.map((d) => d.date.split("-")[0]))
      ].sort();
      const lastYearStr = years[years.length - 1];
      const nextYear = parseInt(lastYearStr) + 1;
      const lastYearRecs = updatedNhiData.filter(
        (d) => d.date.startsWith(lastYearStr)
      );
      if (lastYearRecs.length > 0) {
        updatedNhiData.push(
          ...lastYearRecs.map((rec) => ({
            ...rec,
            date: rec.date.replace(lastYearStr, nextYear.toString())
          }))
        );
      } else {
        updatedNhiData.push({
          date: `${nextYear}-01-01`,
          bracket: 462e3,
          income: 0,
          is211: false,
          note: "新年度初始紀錄"
        });
      }
      updatedNhiData.sort((a, b) => a.date.localeCompare(b.date));
    }
    const data = {
      ...dataRef.current,
      salaryData: updatedSalaryRecs,
      nhiData: updatedNhiData
    };
    dataRef.current = data;
    setAllData(data);
    setSalaryRecs(updatedSalaryRecs);
    void saveLocal(data).catch(() => {
    });
    if (!isEditing) setIsEditing(true);
    setTimeout(() => {
      const container = document.querySelector(".table-container") || document.querySelector(".nhi-dashboard");
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  };
  const tabs = ["年薪紀錄", "薪資成長", "二代健保", "福利明細", "所得紀錄"];
  const editableTab = activeTab !== 1;
  if (!authenticated || !allData) return /* @__PURE__ */ React.createElement(
    SalaryMobile.Login,
    {
      hasKey,
      importReason,
      busy,
      loading,
      error: loginError,
      onPaste: handlePaste,
      onImport: handleImport
    }
  );
  return /* @__PURE__ */ React.createElement("div", { className: "app-container" }, /* @__PURE__ */ React.createElement(
    SalaryMobile.Header,
    {
      title: tabs[activeTab],
      editable: editableTab,
      editing: isEditing,
      dirty: isDirty,
      backupDue,
      onEdit: () => setIsEditing(!isEditing),
      onSettings: () => {
        setSettingsMessage("");
        setShowSettings(true);
      }
    }
  ), /* @__PURE__ */ React.createElement(SalaryMobile.Offline, { quiet: true, busy: isDirty || busy || writeBusyRef.current }), showSettings && /* @__PURE__ */ React.createElement(
    SalaryMobile.Settings,
    {
      onClose: () => setShowSettings(false),
      busy: busy || writeBusyRef.current,
      message: settingsMessage,
      backupAt,
      backupDue,
      onExport: handleExport,
      onImport: handleImport,
      onForget: handleForget
    }
  ), /* @__PURE__ */ React.createElement("main", { className: "content-area", role: "tabpanel", "aria-label": tabs[activeTab] }, saveMessage && /* @__PURE__ */ React.createElement("p", { className: SAVE_STATES.includes(saveMessage) ? "save-state" : "inline-notice", role: "status" }, saveMessage), isEditing && (activeTab === 0 || activeTab === 2) && /* @__PURE__ */ React.createElement("div", { className: "edit-toolbar" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: addNewYear }, "＋ 新增年度")), (activeTab === 0 || activeTab === 1) && /* @__PURE__ */ React.createElement(SalaryKpiStrip, { data: salaryRecs }), activeTab === 0 && /* @__PURE__ */ React.createElement(YearTable, { data: salaryRecs, setData: updateSalary, isEditing }), activeTab === 1 && /* @__PURE__ */ React.createElement(AnalysisDashboard, { data: salaryRecs }), activeTab === 2 && /* @__PURE__ */ React.createElement(NHIDashboard, { nhiData: allData.nhiData, isEditing, onUpdate: updateAllData("nhiData") }), activeTab === 3 && /* @__PURE__ */ React.createElement(WelfareDashboard, { welfareData: allData.welfareData, isEditing, onUpdate: updateAllData("welfareData") }), activeTab === 4 && /* @__PURE__ */ React.createElement(DataTable, { data: allData.taxData, title: "年度所得稅紀錄", isEditing, onUpdate: updateAllData("taxData") })), /* @__PURE__ */ React.createElement(SalaryMobile.Nav, { tabs, activeTab, onChange: (index) => {
    setActiveTab(index);
    setIsEditing(false);
    window.scrollTo({ top: 0 });
  } }));
};
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React.createElement(App, null));
