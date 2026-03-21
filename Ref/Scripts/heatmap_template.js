/* heatmap_template.js
 * 通用热力图模板
 */

const HeatmapTemplate = (() => {
  const STYLE_ID = "custom-heatmap-template-style";
  const DEFAULT_TOOLTIP_ID = "global-heatmap-template-tooltip";
  const MAX_LEVELS = 12;
  const LEGEND_COLOR_TOKEN = /\$#([0-9a-fA-F]{3,8})\$/g;

  const ensureFontManager = async () => {
    if (!window.DashboardRuntime) {
      await dv.view("Scripts/dashboard_runtime", { autorender: false });
    }
    return window.DashboardRuntime.ensureFontManager();
  };

  const defaultTheme = {
    light: {
      dayBg: "#f1f5f9",
      tooltip: "#ffffff",
      tooltipBg: "#0f172a",
      levels: [
        "#f1f5f9", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80",
        "#22c55e", "#16a34a", "#15803d", "#14532d"
      ]
    },
    dark: {
      dayBg: "#334155",
      tooltip: "#0f172a",
      tooltipBg: "#f1f5f9",
      levels: [
        "#334155", "#064e3b", "#065f46", "#047857", "#059669",
        "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"
      ]
    }
  };

  const defaultSettings = {
    showWeekLabels: true,
    showMonthLabels: true,
    showLegend: true,
    minWeeks: 5,
    cellSize: 11,
    cellGap: 2,
    mondayFirst: true,
    rangeMode: "adaptive", // adaptive | fixed-days | fixed-range
    fixedDays: 84,
    tooltipId: DEFAULT_TOOLTIP_ID,
    locale: "en-US",
    monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    weekLabels: ["Mon", "", "Wed", "", "Fri", "", "Sun"],
    wrapperClass: "",
    cardClass: "",
    legend: "Less $#f1f5f9$$#bbf7d0$$#4ade80$$#15803d$ More"
  };

  const pad = (n) => String(n).padStart(2, "0");

  const normalizeDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return new Date(value.getTime());
    if (typeof value === "string") {
      const d = new Date(`${value}T00:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (value?.toJSDate) return value.toJSDate();
    if (value?.ts) return new Date(value.ts);
    return null;
  };

  const toDateKey = (value) => {
    const d = normalizeDate(value);
    if (!d) return "";
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const cloneDate = (d) => new Date(d.getTime());

  const addDays = (date, days) => {
    const d = cloneDate(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const diffDays = (start, end) => Math.floor((normalizeDate(end) - normalizeDate(start)) / 86400000);

  const alignToMonday = (date) => {
    const d = cloneDate(normalizeDate(date));
    const day = d.getDay();
    const offset = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - offset);
    return d;
  };

  const alignToSunday = (date) => addDays(alignToMonday(date), 6);

  const htmlEscape = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const mergeTheme = (base, override = {}) => ({
    light: { ...base.light, ...(override.light || {}) },
    dark: { ...base.dark, ...(override.dark || {}) }
  });

  const normalizeMap = (source) => {
    if (!source) return new Map();
    if (source instanceof Map) return source;
    if (Array.isArray(source)) return new Map(source);
    return new Map(Object.entries(source));
  };

  const pickScaleColor = (value, palette = [], { min = 0, max = 1, fallback = null } = {}) => {
    if (!palette.length || value == null || Number.isNaN(Number(value))) return fallback;
    const numeric = Number(value);
    const span = max - min || 1;
    const ratio = Math.max(0, Math.min(1, (numeric - min) / span));
    const index = Math.round(ratio * (palette.length - 1));
    return palette[index] ?? fallback;
  };

  const pickEnumColor = (value, mapping = {}, fallback = null) => {
    const key = value == null ? "" : String(value);
    return mapping[key] ?? fallback;
  };

  const ratioToLevel = (completed, total, maxLevel = 8) => {
    const safeTotal = Number(total || 0);
    const safeCompleted = Number(completed || 0);
    if (safeTotal <= 0) return 0;
    const ratio = safeCompleted / safeTotal;
    if (ratio <= 0) return 1;
    return Math.min(maxLevel, Math.max(1, Math.ceil(ratio * maxLevel)));
  };

  const getThemeModeClass = () =>
    document.body.classList.contains("theme-dark") ? "theme-dark" : "theme-light";

  const getThemeMode = () =>
    document.body.classList.contains("theme-dark") ? "dark" : "light";

  const buildUtils = (settings) => ({
    toDateKey,
    normalizeDate,
    addDays,
    alignToMonday,
    alignToSunday,
    htmlEscape,
    pickScaleColor,
    pickEnumColor,
    ratioToLevel,
    locale: settings.locale || "en-US"
  });

  const ensureStyle = async (fonts = {}) => {
    const fontManager = await ensureFontManager();
    const fontCtx = await fontManager.prepareFonts(fonts || {}, { cssVarPrefix: "hmtpl" });

    const lightLevelVars = Array.from({ length: MAX_LEVELS }, (_, i) =>
      `  --hmtpl-lv-${i}: var(--hmtpl-light-lv-${i}, var(--hmtpl-hm-empty));`
    ).join("\n");

    const darkLevelVars = Array.from({ length: MAX_LEVELS }, (_, i) =>
      `  --hmtpl-lv-${i}: var(--hmtpl-dark-lv-${i}, var(--hmtpl-hm-empty));`
    ).join("\n");

    const levelClasses = Array.from({ length: MAX_LEVELS }, (_, i) =>
      `.hmtpl-lv-${i} { background-color: var(--hmtpl-lv-${i}, var(--hmtpl-hm-empty)); }`
    ).join("\n");

    window.DashboardRuntime.replaceStyle(STYLE_ID, `
${fontCtx.fontCSS}
.hmtpl-root {
  --hmtpl-font-main: ${fontCtx.mainFontFamily};
  --hmtpl-font-mono: ${fontCtx.monoFontFamily};
  --hmtpl-text-main: var(--text-normal);
  --hmtpl-text-muted: var(--text-muted);
  --hmtpl-card-bg: var(--background-secondary);
  --hmtpl-card-border: var(--background-modifier-border);
  --hmtpl-accent: var(--text-accent);
  --hmtpl-shadow: none;
  --hmtpl-hm-empty: #f1f5f9;
  --hmtpl-tooltip: #fff;
  --hmtpl-tooltip-bg: #000;
  font-family: var(--hmtpl-font-main);
  color: var(--hmtpl-text-main);
  margin: 0;
  padding: 0;
}

.hmtpl-root.theme-light {
  --hmtpl-hm-empty: var(--hmtpl-light-empty);
  --hmtpl-tooltip: var(--hmtpl-light-tooltip);
  --hmtpl-tooltip-bg: var(--hmtpl-light-tooltip-bg);
${lightLevelVars}
}

.hmtpl-root.theme-dark {
  --hmtpl-hm-empty: var(--hmtpl-dark-empty);
  --hmtpl-tooltip: var(--hmtpl-dark-tooltip);
  --hmtpl-tooltip-bg: var(--hmtpl-dark-tooltip-bg);
${darkLevelVars}
}

.hmtpl-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;
  padding: 0;
}

.hmtpl-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.hmtpl-body {
  display: flex;
  align-items: flex-start;
}

.hmtpl-months {
  display: flex;
  height: 18px;
  margin-left: 28px;
  pointer-events: none;
}

.hmtpl-month-slot {
  flex: 0 0 calc(var(--hmtpl-cell-size, 11px) + var(--hmtpl-cell-gap, 2px));
  height: 100%;
  position: relative;
}

.hmtpl-month-label {
  position: absolute;
  bottom: 2px;
  left: 0;
  font-size: 9px;
  color: var(--hmtpl-text-muted);
  font-family: var(--hmtpl-font-mono);
}

.hmtpl-weeks {
  display: flex;
  flex-direction: column;
  margin-right: 9px;
  margin-top: 5px;
  width: 20px;
  flex-shrink: 0;
}

.hmtpl-week-label {
  height: var(--hmtpl-cell-size, 11px);
  margin-bottom: var(--hmtpl-cell-gap, 2px);
  font-size: 9px;
  color: var(--hmtpl-text-muted);
  text-align: right;
  line-height: 1;
  font-family: var(--hmtpl-font-mono);
}

.hmtpl-grid {
  display: flex;
  flex: 1;
  align-items: flex-start;
  margin-top: 4px;
  min-width: 0;
}

.hmtpl-week-col {
  display: flex;
  flex-direction: column;
  margin-right: var(--hmtpl-cell-gap, 2px);
}

.hmtpl-cell {
  width: var(--hmtpl-cell-size, 11px);
  height: var(--hmtpl-cell-size, 11px);
  border-radius: 3px;
  margin-bottom: var(--hmtpl-cell-gap, 2px);
  background-color: var(--hmtpl-hm-empty);
  transition: all 0.1s;
}

.hmtpl-cell:hover {
  transform: scale(1.4);
  z-index: 10;
  border: 1px solid var(--hmtpl-card-border);
}

${levelClasses}

.hmtpl-legend {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 6px;
  font-size: 0.7em;
  color: var(--hmtpl-text-muted);
  gap: 3px;
  font-family: var(--hmtpl-font-mono);
  flex-wrap: wrap;
}

.hmtpl-legend-item {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  flex: 0 0 auto;
}

.hmtpl-legend-text {
  display: inline-flex;
  align-items: center;
  white-space: pre-wrap;
}

.hmtpl-tooltip {
  position: fixed !important;
  z-index: 9999;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: var(--hmtpl-tooltip-bg);
  color: var(--hmtpl-tooltip);
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
  pointer-events: none;
  opacity: 0;
  border: 1px solid rgba(255,255,255,0.1);
  font-family: var(--hmtpl-font-main);
  font-size: 12px;
}

.hmtpl-tooltip.is-active {
  opacity: 1;
}

.hmtpl-tooltip-main {
  font-family: var(--hmtpl-font-mono);
  font-weight: 700;
  display: block;
}

.hmtpl-tooltip-date {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(255,255,255,0.2);
  opacity: 0.8;
  display: block;
  font-family: var(--hmtpl-font-mono);
}
`);
  };

  const ensureTooltip = (id) => {
    let tip = document.getElementById(id);
    if (!tip) {
      tip = document.createElement("div");
      tip.id = id;
      tip.className = "hmtpl-tooltip";
      document.body.appendChild(tip);
    }
    return tip;
  };

  const setThemeVars = (root, theme) => {
    const apply = (mode, data) => {
      root.style.setProperty(`--hmtpl-${mode}-empty`, data.dayBg || "#f1f5f9");
      root.style.setProperty(`--hmtpl-${mode}-tooltip`, data.tooltip || "#fff");
      root.style.setProperty(`--hmtpl-${mode}-tooltip-bg`, data.tooltipBg || "#000");

      for (let i = 0; i < MAX_LEVELS; i += 1) {
        const color = data.levels?.[i] ?? data.dayBg ?? "#f1f5f9";
        root.style.setProperty(`--hmtpl-${mode}-lv-${i}`, color);
      }
    };

    apply("light", theme.light || {});
    apply("dark", theme.dark || {});
  };

  const defaultTooltipRenderer = ({ entry, date, utils }) => {
    const dateTxt = normalizeDate(date)?.toLocaleDateString(utils.locale, {
      month: "short",
      day: "numeric"
    }) || "";

    if (!entry || (entry.total == null && entry.completed == null && entry.value == null && entry.label == null)) {
      return `<span class="hmtpl-tooltip-main">无数据</span><span class="hmtpl-tooltip-date">${htmlEscape(dateTxt)}</span>`;
    }

    if (entry.total != null || entry.completed != null) {
      const level = ratioToLevel(entry.completed, entry.total, 8);
      const percent = entry.total
        ? Math.round((Number(entry.completed || 0) / Number(entry.total || 1)) * 100)
        : 0;

      return `
        <span class="hmtpl-tooltip-main"><b>${percent}%</b> 已完成</span>
        <span class="hmtpl-tooltip-main">${htmlEscape(entry.completed || 0)}/${htmlEscape(entry.total || 0)} 项</span>
        <span class="hmtpl-tooltip-date">${htmlEscape(dateTxt)} · Lv${level}</span>
      `;
    }

    return `
      <span class="hmtpl-tooltip-main">${htmlEscape(entry.label ?? entry.value ?? "有记录")}</span>
      <span class="hmtpl-tooltip-date">${htmlEscape(dateTxt)}</span>
    `;
  };

  const resolveCellStyle = ({ entry, date, dateKey, getCellStyle, theme, utils }) => {
    const custom = typeof getCellStyle === "function"
      ? getCellStyle({ entry, date, dateKey, theme, utils })
      : null;

    if (typeof custom === "number") return { level: custom };
    if (typeof custom === "string") return { color: custom };
    if (custom && typeof custom === "object") return custom;

    if (entry && (entry.total != null || entry.completed != null)) {
      return { level: ratioToLevel(entry.completed, entry.total, 8) };
    }

    if (entry && entry.level != null) return { level: entry.level };
    return { level: 0 };
  };

  const buildRange = ({ wrapperWidth, settings, inputStart, inputEnd }) => {
    const end = normalizeDate(inputEnd) || new Date();

    if (settings.rangeMode === "fixed-range") {
      const start = alignToMonday(normalizeDate(inputStart) || addDays(end, -83));
      return { start, end, totalDays: diffDays(start, end) + 1 };
    }

    if (settings.rangeMode === "fixed-days") {
      const start = alignToMonday(addDays(end, -(Number(settings.fixedDays || 84) - 1)));
      return { start, end, totalDays: diffDays(start, end) + 1 };
    }

    const cellPitch = Number(settings.cellSize || 11) + Number(settings.cellGap || 2);
    const maxWeeks = Math.max(
      Number(settings.minWeeks || 5),
      Math.round(((wrapperWidth || 600) - 40) / cellPitch) - 1
    );
    const rawStart = addDays(end, -(maxWeeks * 7));
    const start = settings.mondayFirst === false ? rawStart : alignToMonday(rawStart);

    return { start, end, totalDays: diffDays(start, end) + 1 };
  };

  const parseLegend = (legendValue) => {
    if (legendValue == null || legendValue === false) return null;
    if (Array.isArray(legendValue)) return legendValue;

    const raw = String(legendValue);
    if (!raw.trim()) return null;

    const items = [];
    let lastIndex = 0;

    raw.replace(LEGEND_COLOR_TOKEN, (match, hex, offset) => {
      const before = raw.slice(lastIndex, offset);
      if (before) items.push({ type: "text", text: before });
      items.push({ type: "color", color: `#${hex}` });
      lastIndex = offset + match.length;
      return match;
    });

    const tail = raw.slice(lastIndex);
    if (tail) items.push({ type: "text", text: tail });

    return items.length ? items : null;
  };

  const resolveLegend = (legendOption, context) => {
    const value = typeof legendOption === "function"
      ? legendOption(context)
      : legendOption;
    return parseLegend(value);
  };

  const applyTooltipTheme = (tip, root) => {
    const computed = getComputedStyle(root);
    tip.style.setProperty("--hmtpl-tooltip", computed.getPropertyValue("--hmtpl-tooltip").trim());
    tip.style.setProperty("--hmtpl-tooltip-bg", computed.getPropertyValue("--hmtpl-tooltip-bg").trim());
  };

  const positionTooltip = (tip, cell) => {
    const rect = cell.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();

    let top = rect.top - tipRect.height - 8;
    let left = rect.left + rect.width / 2 - tipRect.width / 2;

    if (left < 10) left = 10;
    if (left + tipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tipRect.width - 10;
    }
    if (top < 10) top = rect.bottom + 10;

    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };

  const render = async (options = {}) => {
    const config = options.config || {};
    const settings = { ...defaultSettings, ...(options.settings || {}) };
    const theme = mergeTheme(defaultTheme, options.theme || config.theme || {});
    const utils = buildUtils(settings);

    await ensureStyle(config.fonts || options.fonts || {});

    const host = options.container || dv.container;
    if (!host) throw new Error("HeatmapTemplate.render: 未找到容器");

    const root = document.createElement("div");
    root.className = `hmtpl-root ${getThemeModeClass()} ${settings.wrapperClass || ""}`.trim();
    root.style.setProperty("--hmtpl-cell-size", `${Number(settings.cellSize || 11)}px`);
    root.style.setProperty("--hmtpl-cell-gap", `${Number(settings.cellGap || 2)}px`);
    root.style.setProperty("--hmtpl-card-bg", options.cardBg || "var(--background-secondary)");
    root.style.setProperty("--hmtpl-card-border", options.cardBorder || "var(--background-modifier-border)");
    root.style.setProperty("--hmtpl-text-main", options.textMain || "var(--text-normal)");
    root.style.setProperty("--hmtpl-text-muted", options.textMuted || "var(--text-muted)");
    root.style.setProperty("--hmtpl-accent", options.accent || "var(--text-accent)");
    root.style.setProperty("--hmtpl-shadow", options.shadow || "none");
    setThemeVars(root, theme);

    const wrapper = document.createElement("div");
    wrapper.className = `hmtpl-wrapper ${settings.cardClass || ""}`.trim();

    const container = document.createElement("div");
    container.className = "hmtpl-container";

    const months = document.createElement("div");
    months.className = "hmtpl-months";

    const body = document.createElement("div");
    body.className = "hmtpl-body";

    const weeks = document.createElement("div");
    weeks.className = "hmtpl-weeks";

    const grid = document.createElement("div");
    grid.className = "hmtpl-grid";

    if (settings.showWeekLabels) {
      (settings.weekLabels || defaultSettings.weekLabels).forEach((label) => {
        const item = document.createElement("div");
        item.className = "hmtpl-week-label";
        item.textContent = label;
        weeks.appendChild(item);
      });
      body.appendChild(weeks);
    }

    body.appendChild(grid);

    if (settings.showMonthLabels) {
      container.appendChild(months);
    }

    container.appendChild(body);
    wrapper.appendChild(container);
    root.appendChild(wrapper);

    if (options.replaceContents !== false) host.innerHTML = "";
    host.appendChild(root);

    let legend = null;

    const renderGrid = async () => {
      root.classList.remove("theme-light", "theme-dark");
      root.classList.add(getThemeModeClass());

      grid.innerHTML = "";
      months.innerHTML = "";
      if (legend) legend.remove();

      const wrapperWidth = wrapper.clientWidth || 600;
      const range = buildRange({
        wrapperWidth,
        settings,
        inputStart: options.startDate,
        inputEnd: options.endDate
      });

      const source = typeof options.getData === "function"
        ? await options.getData({
            dv,
            start: range.start,
            end: range.end,
            settings,
            theme,
            utils,
            input: options
          })
        : options.data;

      const dataMap = normalizeMap(source);
      const cur = cloneDate(range.start);

      let monthIdx = -1;
      let slotsSinceLastLabel = 10;
      const monthNames = settings.monthNames || defaultSettings.monthNames;

      while (cur <= range.end) {
        if (settings.showMonthLabels) {
          const slot = document.createElement("div");
          slot.className = "hmtpl-month-slot";

          if (cur.getMonth() !== monthIdx) {
            monthIdx = cur.getMonth();
            if (slotsSinceLastLabel > 2) {
              const label = document.createElement("span");
              label.className = "hmtpl-month-label";
              label.textContent = monthNames[monthIdx] || "";
              slot.appendChild(label);
              slotsSinceLastLabel = 0;
            }
          }

          slotsSinceLastLabel += 1;
          months.appendChild(slot);
        }

        const weekCol = document.createElement("div");
        weekCol.className = "hmtpl-week-col";

        for (let i = 0; i < 7; i += 1) {
          if (cur > range.end) break;

          const date = cloneDate(cur);
          const dateKey = toDateKey(date);
          const entry = dataMap.get(dateKey);
          const visual = resolveCellStyle({
            entry,
            date,
            dateKey,
            getCellStyle: options.getCellStyle,
            theme,
            utils
          });

          const cell = document.createElement("div");
          cell.className = `hmtpl-cell ${visual.className || ""}`.trim();

          if (visual.level != null) cell.classList.add(`hmtpl-lv-${visual.level}`);
          if (visual.color) cell.style.backgroundColor = visual.color;
          if (visual.borderColor) cell.style.borderColor = visual.borderColor;

          cell.onmouseenter = () => {
            const tip = ensureTooltip(settings.tooltipId || DEFAULT_TOOLTIP_ID);
            tip.innerHTML = typeof options.renderTooltip === "function"
              ? options.renderTooltip({ entry, date, dateKey, visual, settings, theme, utils })
              : defaultTooltipRenderer({ entry, date, dateKey, visual, settings, theme, utils });

            applyTooltipTheme(tip, root);
            positionTooltip(tip, cell);
            requestAnimationFrame(() => tip.classList.add("is-active"));
          };

          cell.onmouseleave = () => {
            const tip = document.getElementById(settings.tooltipId || DEFAULT_TOOLTIP_ID);
            if (tip) tip.classList.remove("is-active");
          };

          weekCol.appendChild(cell);
          cur.setDate(cur.getDate() + 1);
        }

        grid.appendChild(weekCol);
      }

      const themeMode = getThemeMode();
      const legendConfig = options.legend ?? settings.legend;
      const parsedLegend = resolveLegend(legendConfig, {
        theme,
        themeMode,
        settings,
        utils,
        options,
        root
      });

      if ((options.showLegend ?? settings.showLegend) !== false && parsedLegend) {
        legend = document.createElement("div");
        legend.className = "hmtpl-legend";

        parsedLegend.forEach((part) => {
          if (part.type === "color") {
            const item = document.createElement("div");
            item.className = "hmtpl-legend-item";
            item.style.backgroundColor = part.color;
            legend.appendChild(item);
            return;
          }

          const text = document.createElement("span");
          text.className = "hmtpl-legend-text";
          text.textContent = part.text;
          legend.appendChild(text);
        });

        root.appendChild(legend);
      }
    };

    await renderGrid();

    const resizeObserver = new ResizeObserver(() => {
      if (root._hmtplResizeTimeout) clearTimeout(root._hmtplResizeTimeout);
      root._hmtplResizeTimeout = setTimeout(() => renderGrid(), 200);
    });
    resizeObserver.observe(wrapper);

    const themeObserver = new MutationObserver(() => {
      if (root._hmtplThemeTimeout) clearTimeout(root._hmtplThemeTimeout);
      root._hmtplThemeTimeout = setTimeout(() => renderGrid(), 80);
    });
    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });

    root._hmtplResizeObserver = resizeObserver;
    root._hmtplThemeObserver = themeObserver;

    return {
      root,
      rerender: renderGrid,
      destroy: () => {
        resizeObserver.disconnect();
        themeObserver.disconnect();
        root.remove();
      }
    };
  };

  return {
    render,
    utils: {
      toDateKey,
      normalizeDate,
      addDays,
      alignToMonday,
      alignToSunday,
      htmlEscape,
      pickScaleColor,
      pickEnumColor,
      ratioToLevel
    }
  };
})();

window.HeatmapTemplate = HeatmapTemplate;

if (input?.autorender !== false) {
  await HeatmapTemplate.render(input || {});
}
