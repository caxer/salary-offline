/* ============================================================================
   Shared utilities & components for the salary / billing dashboards.

   Loaded as a classic <script> before salary-app.js; written with
   React.createElement, so it needs no JSX build step.

   Requires React (and, for ChartView, Chart.js) to be loaded beforehand.
   Exposes: formatMoney, ChartView, DeltaBadge, drawHaloText, useUnloadGuard,
   EmptyState as globals. Encryption lives in link-key.js / salary-store.js.
   ============================================================================ */
(function () {
  "use strict";
  const { useEffect, useRef } = React;
  const h = React.createElement;

  // ---- Formatting -----------------------------------------------------------
  function formatMoney(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return "-";
    return new Intl.NumberFormat("zh-TW").format(amount);
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

  // ---- Expose as globals for salary-app.js ---------------------------------
  window.formatMoney = formatMoney;
  window.ChartView = ChartView;
  window.DeltaBadge = DeltaBadge;
  window.drawHaloText = drawHaloText;
  window.useUnloadGuard = useUnloadGuard;
  window.EmptyState = EmptyState;
})();
