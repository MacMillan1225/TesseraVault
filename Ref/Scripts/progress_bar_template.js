/* progress_bar_template.js
 * 通用可复用进度条模板
 */

const ProgressBarTemplate = (() => {
  const STYLE_ID = "custom-progress-bar-template-style";
  const DEFAULT_TOOLTIP_ID = "global-progress-bar-template-tooltip";

  const defaultSettings = {
    height: 12,
    radius: 999,
    animated: true,
    showGlow: false,
    showPercentage: true,
    percentagePosition: "top-right",
    tooltipId: DEFAULT_TOOLTIP_ID,
    locale: "zh-CN",
    wrapperClass: "",
    cardClass: "",
    infoClass: "",
    markerSize: 12,
    milestoneOffset: 10,
    milestoneSize: 12,
    showMilestones: true,
    clampValue: true,
    trackOpacity: 1
  };

  const defaultTheme = {
    light: {
      text: "var(--text-normal)",
      muted: "var(--text-muted)",
      track: "#e2e8f0",
      trackBorder: "rgba(148, 163, 184, 0.24)",
      tooltip: "#ffffff",
      tooltipBg: "#0f172a",
      milestone: "#ffffff",
      milestoneBorder: "#cbd5e1",
      shadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
      fill: "#22c55e",
      fillGradient: "linear-gradient(90deg, #22c55e 0%, #34d399 100%)"
    },
    dark: {
      text: "var(--text-normal)",
      muted: "var(--text-muted)",
      track: "rgba(148, 163, 184, 0.18)",
      trackBorder: "rgba(148, 163, 184, 0.20)",
      tooltip: "#0f172a",
      tooltipBg: "#f8fafc",
      milestone: "#0f172a",
      milestoneBorder: "#64748b",
      shadow: "0 10px 24px rgba(0, 0, 0, 0.28)",
      fill: "#2dd4bf",
      fillGradient: "linear-gradient(90deg, #14b8a6 0%, #38bdf8 100%)"
    }
  };

  const ensureFontManager = async () => {
    if (!window.DashboardRuntime) {
      await dv.view("Scripts/dashboard_runtime", { autorender: false });
    }
    return window.DashboardRuntime.ensureFontManager();
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const htmlEscape = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const mergeTheme = (base, override = {}) => ({
    light: { ...base.light, ...(override.light || {}) },
    dark: { ...base.dark, ...(override.dark || {}) }
  });

  const getThemeMode = () => (document.body.classList.contains("theme-dark") ? "dark" : "light");
  const getThemeModeClass = () => (document.body.classList.contains("theme-dark") ? "theme-dark" : "theme-light");

  const buildUtils = (settings) => ({
    clamp,
    htmlEscape,
    locale: settings.locale || "zh-CN"
  });

  const ensureStyle = async (fonts = {}) => {
    const fontManager = await ensureFontManager();
    const fontCtx = await fontManager.prepareFonts(fonts || {}, { cssVarPrefix: "pbtpl" });

    window.DashboardRuntime.replaceStyle(STYLE_ID, `
${fontCtx.fontCSS}

.pbtpl-root {
  --pbtpl-font-main: ${fontCtx.mainFontFamily};
  --pbtpl-font-mono: ${fontCtx.monoFontFamily};
  --pbtpl-text: var(--text-normal);
  --pbtpl-muted: var(--text-muted);
  --pbtpl-track: #e2e8f0;
  --pbtpl-track-border: rgba(148, 163, 184, 0.24);
  --pbtpl-tooltip: #fff;
  --pbtpl-tooltip-bg: #000;
  --pbtpl-fill: #22c55e;
  --pbtpl-fill-gradient: linear-gradient(90deg, #22c55e 0%, #34d399 100%);
  --pbtpl-milestone: #fff;
  --pbtpl-milestone-border: #cbd5e1;
  --pbtpl-shadow: none;
  --pbtpl-height: 12px;
  --pbtpl-radius: 999px;
  --pbtpl-marker-size: 12px;
  --pbtpl-milestone-offset: 10px;
  font-family: var(--pbtpl-font-main);
  color: var(--pbtpl-text);
  width: 100%;
}

.pbtpl-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pbtpl-header,
.pbtpl-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 16px;
}

.pbtpl-header.is-hidden,
.pbtpl-footer.is-hidden,
.pbtpl-info.is-hidden,
.pbtpl-percentage.is-hidden,
.pbtpl-milestones.is-hidden {
  display: none;
}

.pbtpl-spacer {
  flex: 1 1 auto;
}

.pbtpl-percentage,
.pbtpl-info {
  font-size: 0.76em;
  line-height: 1.35;
}

.pbtpl-percentage {
  font-family: var(--pbtpl-font-mono);
  color: var(--pbtpl-muted);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.pbtpl-info {
  color: var(--pbtpl-muted);
}

.pbtpl-bar-area {
  position: relative;
  width: 100%;
  min-width: 0;
}

.pbtpl-track {
  position: relative;
  width: 100%;
  height: var(--pbtpl-height);
  border-radius: var(--pbtpl-radius);
  background: var(--pbtpl-track);
  border: 1px solid var(--pbtpl-track-border);
  overflow: visible;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.05);
}

.pbtpl-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0%;
  border-radius: inherit;
  background: var(--pbtpl-fill-gradient, var(--pbtpl-fill));
  transition: width 240ms ease, filter 180ms ease, opacity 180ms ease;
}

.pbtpl-root.is-static .pbtpl-fill {
  transition: none;
}

.pbtpl-root.has-glow .pbtpl-fill {
  filter: saturate(1.05) drop-shadow(0 0 8px color-mix(in srgb, var(--pbtpl-fill) 40%, transparent 60%));
}

.pbtpl-inside {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding: 0 10px;
}

.pbtpl-inside.is-hidden {
  display: none;
}

.pbtpl-inside .pbtpl-percentage {
  color: rgba(255,255,255,0.96);
  text-shadow: 0 1px 2px rgba(0,0,0,0.28);
  font-size: 0.72em;
}

.pbtpl-inside.pos-right {
  justify-content: flex-end;
}

.pbtpl-inside.pos-left {
  justify-content: flex-start;
}

.pbtpl-milestones {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.pbtpl-milestone {
  position: absolute;
  top: 50%;
  width: var(--pbtpl-marker-size);
  height: var(--pbtpl-marker-size);
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: var(--pbtpl-milestone);
  border: 2px solid var(--pbtpl-milestone-border);
  box-shadow: 0 3px 10px rgba(15,23,42,0.14);
  pointer-events: auto;
  cursor: pointer;
  padding-left: var(--pbtpl-milestone-size);
}

.pbtpl-milestone::after {
  content: "";
  position: absolute;
  left: 50%;
  top: calc(100% + 2px);
  width: 2px;
  height: var(--pbtpl-milestone-offset);
  transform: translateX(-50%);
  background: color-mix(in srgb, var(--pbtpl-milestone-border) 58%, transparent 42%);
  border-radius: 99px;
}

.pbtpl-milestone.is-done {
  border-color: var(--pbtpl-fill);
  background: color-mix(in srgb, var(--pbtpl-fill) 16%, var(--pbtpl-milestone) 84%);
}

.pbtpl-tooltip {
  position: fixed !important;
  z-index: 9999;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--pbtpl-tooltip-bg);
  color: var(--pbtpl-tooltip);
  box-shadow: var(--pbtpl-shadow);
  pointer-events: none;
  opacity: 0;
  border: 1px solid rgba(255,255,255,0.08);
  font-size: 12px;
  line-height: 1.45;
  max-width: 280px;
  font-family: var(--pbtpl-font-main);
}

.pbtpl-tooltip.is-active {
  opacity: 1;
}

.pbtpl-tooltip-main {
  display: block;
  font-weight: 700;
  font-family: var(--pbtpl-font-mono);
}

.pbtpl-tooltip-sub {
  display: block;
  margin-top: 4px;
  opacity: 0.9;
}

.pbtpl-tooltip-date {
  display: block;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255,255,255,0.16);
  opacity: 0.8;
  font-family: var(--pbtpl-font-mono);
}
`);
  };

  const ensureTooltip = (id) => {
    let tip = document.getElementById(id);
    if (!tip) {
      tip = document.createElement("div");
      tip.id = id;
      tip.className = "pbtpl-tooltip";
      document.body.appendChild(tip);
    }
    return tip;
  };

  const applyThemeVars = (root, theme) => {
    const apply = (mode, data) => {
      root.style.setProperty(`--pbtpl-${mode}-text`, data.text || "var(--text-normal)");
      root.style.setProperty(`--pbtpl-${mode}-muted`, data.muted || "var(--text-muted)");
      root.style.setProperty(`--pbtpl-${mode}-track`, data.track || "#e2e8f0");
      root.style.setProperty(`--pbtpl-${mode}-track-border`, data.trackBorder || "rgba(148, 163, 184, 0.24)");
      root.style.setProperty(`--pbtpl-${mode}-tooltip`, data.tooltip || "#ffffff");
      root.style.setProperty(`--pbtpl-${mode}-tooltip-bg`, data.tooltipBg || "#0f172a");
      root.style.setProperty(`--pbtpl-${mode}-milestone`, data.milestone || "#ffffff");
      root.style.setProperty(`--pbtpl-${mode}-milestone-border`, data.milestoneBorder || "#cbd5e1");
      root.style.setProperty(`--pbtpl-${mode}-shadow`, data.shadow || "none");
      root.style.setProperty(`--pbtpl-${mode}-fill`, data.fill || "#22c55e");
      root.style.setProperty(`--pbtpl-${mode}-fill-gradient`, data.fillGradient || data.fill || "#22c55e");
    };

    apply("light", theme.light || {});
    apply("dark", theme.dark || {});
  };

  const syncThemeModeVars = (root) => {
    const mode = getThemeMode();
    const keys = ["text", "muted", "track", "track-border", "tooltip", "tooltip-bg", "milestone", "milestone-border", "shadow", "fill", "fill-gradient"];
    keys.forEach((key) => {
      root.style.setProperty(`--pbtpl-${key}`, root.style.getPropertyValue(`--pbtpl-${mode}-${key}`));
    });
  };

  const positionTooltip = (tip, target) => {
    const rect = target.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    let top = rect.top - tipRect.height - 10;
    let left = rect.left + rect.width / 2 - tipRect.width / 2;

    if (left < 10) left = 10;
    if (left + tipRect.width > window.innerWidth - 10) left = window.innerWidth - tipRect.width - 10;
    if (top < 10) top = rect.bottom + 10;

    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };

  const resolveMetric = async (directValue, getter, context, fallback = 0) => {
    if (typeof getter === "function") {
      const result = await getter(context);
      return Number(result ?? fallback);
    }
    if (directValue != null) return Number(directValue);
    return Number(fallback);
  };

  const normalizePercent = ({ value, max, percent, clampValue }) => {
    if (percent != null && !Number.isNaN(Number(percent))) {
      return clampValue ? clamp(Number(percent), 0, 100) : Number(percent);
    }

    const safeMax = Number(max || 0);
    const raw = safeMax > 0 ? (Number(value || 0) / safeMax) * 100 : 0;
    return clampValue ? clamp(raw, 0, 100) : raw;
  };

  const normalizeMilestones = (items, context) => {
    if (!Array.isArray(items) || !items.length) return [];

    return items.map((item, index) => {
      const raw = item || {};
      const percent = raw.percent != null
        ? Number(raw.percent)
        : (context.max > 0 ? (Number(raw.value || 0) / context.max) * 100 : 0);
      const safePercent = clamp(percent || 0, 0, 100);
      return {
        ...raw,
        id: raw.id || `milestone-${index + 1}`,
        percent: safePercent,
        reached: context.percent >= safePercent,
        label: raw.label || raw.title || `${Math.round(safePercent)}%`
      };
    });
  };

  const defaultTooltipRenderer = ({ value, max, percent, remaining }) => `
    <span class="pbtpl-tooltip-main">${Math.round(percent)}% 已完成</span>
    <span class="pbtpl-tooltip-sub">当前进度：${htmlEscape(value)} / ${htmlEscape(max)}</span>
    <span class="pbtpl-tooltip-date">剩余：${htmlEscape(Math.max(0, remaining))}</span>
  `;

  const defaultMilestoneTooltipRenderer = ({ item, context }) => `
    <span class="pbtpl-tooltip-main">${htmlEscape(item.label || `${Math.round(item.percent)}%`)}</span>
    ${item.description ? `<span class="pbtpl-tooltip-sub">${htmlEscape(item.description)}</span>` : ""}
    <span class="pbtpl-tooltip-date">位置：${Math.round(item.percent)}% · ${item.reached ? "已到达" : "未到达"}</span>
  `;

  const resolveFillBackground = async (context, options, themeMode) => {
    if (typeof options.getFill === "function") {
      const resolved = await options.getFill(context);
      if (Array.isArray(resolved)) return `linear-gradient(90deg, ${resolved.join(", ")})`;
      if (resolved) return String(resolved);
    }

    const theme = options.theme || {};
    const modeTheme = theme?.[themeMode] || {};
    const gradient = options.fillGradient || modeTheme.fillGradient;
    if (Array.isArray(gradient) && gradient.length) return `linear-gradient(90deg, ${gradient.join(", ")})`;
    if (typeof gradient === "string" && gradient.trim()) return gradient;

    return options.fill || modeTheme.fill || defaultTheme[themeMode].fillGradient;
  };

  const render = async (options = {}) => {
    const config = options.config || {};
    const settings = { ...defaultSettings, ...(options.settings || {}) };
    const theme = mergeTheme(defaultTheme, options.theme || config.theme || {});
    const utils = buildUtils(settings);

    await ensureStyle(config.fonts || options.fonts || {});

    const host = options.container || dv.container;
    if (!host) throw new Error("ProgressBarTemplate.render: 未找到容器");

    const contextSeed = { dv, input: options, options, settings, theme, utils };
    const value = await resolveMetric(options.value, options.getValue, contextSeed, 0);
    const max = await resolveMetric(options.max, options.getMax, { ...contextSeed, value }, 100);
    const percent = normalizePercent({
      value,
      max,
      percent: options.percent,
      clampValue: settings.clampValue !== false
    });
    const remaining = Math.max(0, Number(max || 0) - Number(value || 0));

    const context = {
      ...contextSeed,
      value,
      max,
      percent,
      remaining,
      ratio: percent / 100
    };

    const root = document.createElement("div");
    root.className = `pbtpl-root ${getThemeModeClass()} ${settings.wrapperClass || ""}`.trim();
    if (settings.animated === false) root.classList.add("is-static");
    if (settings.showGlow) root.classList.add("has-glow");
    root.style.setProperty("--pbtpl-height", `${Number(settings.height || 12)}px`);
    root.style.setProperty("--pbtpl-radius", `${Number(settings.radius || 999)}px`);
    root.style.setProperty("--pbtpl-marker-size", `${Number(settings.markerSize || 12)}px`);
    root.style.setProperty("--pbtpl-milestone-size", `${Number(settings.milestoneSize || 12)}px`);
    root.style.setProperty("--pbtpl-milestone-offset", `${Number(settings.milestoneOffset || 10)}px`);
    applyThemeVars(root, theme);
    syncThemeModeVars(root);

    const wrapper = document.createElement("div");
    wrapper.className = `pbtpl-wrapper ${settings.cardClass || ""}`.trim();

    const header = document.createElement("div");
    header.className = "pbtpl-header";
    const headerLead = document.createElement("div");
    headerLead.className = "pbtpl-spacer";
    const headerPercent = document.createElement("div");
    headerPercent.className = "pbtpl-percentage";
    header.appendChild(headerLead);
    header.appendChild(headerPercent);

    const barArea = document.createElement("div");
    barArea.className = "pbtpl-bar-area";
    const track = document.createElement("div");
    track.className = "pbtpl-track";
    track.style.opacity = String(settings.trackOpacity ?? 1);
    const fill = document.createElement("div");
    fill.className = "pbtpl-fill";
    fill.style.width = `${percent}%`;
    track.appendChild(fill);

    const inside = document.createElement("div");
    inside.className = "pbtpl-inside is-hidden";
    const insidePercent = document.createElement("div");
    insidePercent.className = "pbtpl-percentage";
    inside.appendChild(insidePercent);
    track.appendChild(inside);

    const milestoneLayer = document.createElement("div");
    milestoneLayer.className = "pbtpl-milestones";
    track.appendChild(milestoneLayer);

    barArea.appendChild(track);

    const footer = document.createElement("div");
    footer.className = "pbtpl-footer";
    const footerInfo = document.createElement("div");
    footerInfo.className = `pbtpl-info ${settings.infoClass || ""}`.trim();
    const footerSpacer = document.createElement("div");
    footerSpacer.className = "pbtpl-spacer";
    const footerPercent = document.createElement("div");
    footerPercent.className = "pbtpl-percentage";
    footer.appendChild(footerInfo);
    footer.appendChild(footerSpacer);
    footer.appendChild(footerPercent);

    wrapper.appendChild(header);
    wrapper.appendChild(barArea);
    wrapper.appendChild(footer);
    root.appendChild(wrapper);

    if (options.replaceContents !== false) host.innerHTML = "";
    host.appendChild(root);

    const fillBackground = await resolveFillBackground(context, { ...options, theme }, getThemeMode());
    if (fillBackground) {
      fill.style.background = fillBackground;
      root.style.setProperty("--pbtpl-fill-gradient", fillBackground);
      root.style.setProperty("--pbtpl-fill", options.fill || theme[getThemeMode()]?.fill || defaultTheme[getThemeMode()].fill);
    }

    const percentText = typeof options.formatPercentage === "function"
      ? options.formatPercentage(context)
      : `${Math.round(percent)}%`;
    const showPercentage = settings.showPercentage !== false && options.showPercentage !== false;
    const position = options.percentagePosition || settings.percentagePosition || "top-right";
    const insidePositions = new Set(["inside-center", "inside-right", "inside-left"]);

    header.classList.remove("is-hidden");
    footer.classList.remove("is-hidden");
    inside.classList.add("is-hidden");
    headerPercent.classList.add("is-hidden");
    footerPercent.classList.add("is-hidden");
    insidePercent.classList.add("is-hidden");
    inside.classList.remove("pos-right", "pos-left");

    [headerPercent, footerPercent, insidePercent].forEach((node) => {
      node.textContent = percentText;
    });

    if (showPercentage) {
      if (insidePositions.has(position)) {
        inside.classList.remove("is-hidden");
        insidePercent.classList.remove("is-hidden");
        if (position === "inside-right") inside.classList.add("pos-right");
        if (position === "inside-left") inside.classList.add("pos-left");
      } else if (position === "bottom-left" || position === "bottom-right") {
        footerPercent.classList.remove("is-hidden");
        if (position === "bottom-left") {
          footer.insertBefore(footerPercent, footerSpacer);
          footer.insertBefore(footerInfo, footerSpacer);
        }
      } else {
        headerPercent.classList.remove("is-hidden");
        if (position === "top-left") header.insertBefore(headerPercent, headerLead);
      }
    }

    const infoHtml = typeof options.renderInfo === "function"
      ? options.renderInfo(context)
      : options.info;

    if (infoHtml == null || infoHtml === false || infoHtml === "") {
      footerInfo.classList.add("is-hidden");
    } else {
      footerInfo.classList.remove("is-hidden");
      footerInfo.innerHTML = String(infoHtml);
    }

    if (Array.from(header.children).every(node => node.classList?.contains("is-hidden") || node.classList?.contains("pbtpl-spacer"))) {
      header.classList.add("is-hidden");
    }
    if (footerInfo.classList.contains("is-hidden") && footerPercent.classList.contains("is-hidden")) {
      footer.classList.add("is-hidden");
    }

    const milestones = normalizeMilestones(settings.showMilestones === false ? [] : (options.milestones || []), context);
    if (!milestones.length) {
      milestoneLayer.classList.add("is-hidden");
    } else {
      milestoneLayer.classList.remove("is-hidden");
      milestones.forEach((item) => {
        const point = document.createElement("button");
        point.type = "button";
        point.className = `pbtpl-milestone${item.reached ? " is-done" : ""}`;
        point.style.left = `${item.percent}%`;
        if (item.color) {
          point.style.borderColor = item.color;
        }

        const showTip = () => {
          const tip = ensureTooltip(settings.tooltipId || DEFAULT_TOOLTIP_ID);
          tip.innerHTML = typeof options.renderMilestoneTooltip === "function"
            ? options.renderMilestoneTooltip({ item, context, settings, theme, utils })
            : defaultMilestoneTooltipRenderer({ item, context, settings, theme, utils });
          const computed = getComputedStyle(root);
          tip.style.setProperty("--pbtpl-tooltip", computed.getPropertyValue("--pbtpl-tooltip").trim());
          tip.style.setProperty("--pbtpl-tooltip-bg", computed.getPropertyValue("--pbtpl-tooltip-bg").trim());
          tip.style.setProperty("--pbtpl-shadow", computed.getPropertyValue("--pbtpl-shadow").trim());
          positionTooltip(tip, point);
          requestAnimationFrame(() => tip.classList.add("is-active"));
        };

        point.addEventListener("mouseenter", showTip);
        point.addEventListener("focus", showTip);
        point.addEventListener("mouseleave", () => {
          const tip = document.getElementById(settings.tooltipId || DEFAULT_TOOLTIP_ID);
          if (tip) tip.classList.remove("is-active");
        });
        point.addEventListener("blur", () => {
          const tip = document.getElementById(settings.tooltipId || DEFAULT_TOOLTIP_ID);
          if (tip) tip.classList.remove("is-active");
        });

        milestoneLayer.appendChild(point);
      });
    }

    const showMainTooltip = options.showTooltip !== false;
    if (showMainTooltip) {
      const openMainTooltip = () => {
        const tip = ensureTooltip(settings.tooltipId || DEFAULT_TOOLTIP_ID);
        tip.innerHTML = typeof options.renderTooltip === "function"
          ? options.renderTooltip(context)
          : defaultTooltipRenderer(context);
        const computed = getComputedStyle(root);
        tip.style.setProperty("--pbtpl-tooltip", computed.getPropertyValue("--pbtpl-tooltip").trim());
        tip.style.setProperty("--pbtpl-tooltip-bg", computed.getPropertyValue("--pbtpl-tooltip-bg").trim());
        tip.style.setProperty("--pbtpl-shadow", computed.getPropertyValue("--pbtpl-shadow").trim());
        positionTooltip(tip, track);
        requestAnimationFrame(() => tip.classList.add("is-active"));
      };

      track.addEventListener("mouseenter", openMainTooltip);
      track.addEventListener("focusin", openMainTooltip);
      track.addEventListener("mouseleave", () => {
        const tip = document.getElementById(settings.tooltipId || DEFAULT_TOOLTIP_ID);
        if (tip) tip.classList.remove("is-active");
      });
      track.addEventListener("focusout", () => {
        const tip = document.getElementById(settings.tooltipId || DEFAULT_TOOLTIP_ID);
        if (tip) tip.classList.remove("is-active");
      });
    }

    const themeObserver = new MutationObserver(async () => {
      root.classList.remove("theme-light", "theme-dark");
      root.classList.add(getThemeModeClass());
      syncThemeModeVars(root);
      const nextBackground = await resolveFillBackground(context, { ...options, theme }, getThemeMode());
      if (nextBackground) fill.style.background = nextBackground;
    });
    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });

    root._pbtplThemeObserver = themeObserver;

    return {
      root,
      context,
      destroy: () => {
        themeObserver.disconnect();
        root.remove();
      }
    };
  };

  return {
    render,
    utils: {
      clamp,
      htmlEscape
    }
  };
})();

window.ProgressBarTemplate = ProgressBarTemplate;

if (input?.autorender !== false) {
  await ProgressBarTemplate.render(input || {});
}
