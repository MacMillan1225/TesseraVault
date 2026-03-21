/* gym_dashboard_css.js
 * 功能：为 Gym 健身看板补充专用布局样式
 * 说明：基础卡片样式由 Scripts/dashboard_common_css.js 提供，这里只保留健身看板特有部分
 */

const config = input.config || {};

if (!window.DashboardRuntime) {
  await dv.view("Scripts/dashboard_runtime", { autorender: false });
}

await window.DashboardRuntime.ensureFontManager();

const cssId = "custom-gym-dashboard-style";

const fontCtx = await window.DashboardFontManager.prepareFonts(config.fonts || {}, { cssVarPrefix: "gym" });

const light = config.theme?.light || {};
const dark = config.theme?.dark || {};
const withFallback = (value, fallback) => value || fallback;

const makeVars = (theme) => `
  --gym-main: ${withFallback(theme.main, "var(--text-normal)")};
  --gym-text: ${withFallback(theme.textNormal, "var(--text-normal)")};
  --gym-muted: ${withFallback(theme.textMuted, "var(--text-muted)")};
  --gym-accent: ${withFallback(theme.textAccent, "var(--text-accent)")};
  --gym-card-bg: ${withFallback(theme.cardBg, "var(--background-secondary)")};
  --gym-shadow: ${withFallback(theme.shadow, "none")};
  --gym-soft-bg: ${withFallback(theme.taskHoverBg, "var(--background-primary)")};
  --gym-chip-bg: ${withFallback(theme.timeTagBg, "var(--background-primary-alt)")};
  --gym-chip-text: ${withFallback(theme.timeTagText, "var(--text-muted)")};
  --gym-stat-bg-1: ${withFallback(theme.statBgStart, "var(--background-secondary)")};
  --gym-stat-bg-2: ${withFallback(theme.statBgEnd, "var(--background-primary)")};
  --gym-stat-text-1: ${withFallback(theme.statTextMain, "var(--text-normal)")};
  --gym-stat-text-2: ${withFallback(theme.statTextSub, "var(--text-muted)")};
  --gym-border: var(--background-modifier-border);
  --gym-font-main: ${fontCtx.mainFontFamily};
  --gym-font-mono: ${fontCtx.monoFontFamily};
`;

window.DashboardRuntime.replaceStyle(cssId, `
${fontCtx.fontCSS}

:root { ${makeVars(light)} }
body.theme-dark { ${makeVars(dark)} }

/* ============================================================
 * 1. 看板整体布局
 * ============================================================ */

.gymdash-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 10px 0 18px;
  color: var(--gym-text);
  font-family: var(--gym-font-main);
}

.gymdash-root * {
  box-sizing: border-box;
}

.gymdash-root .dash_card {
  background: var(--gym-card-bg);
  box-shadow: var(--gym-shadow);
  border-radius: 18px;
}

.gymdash-root .card_title {
  color: var(--gym-main);
}

.gymdash-root .card_subtitle,
.gymdash-mono {
  font-family: var(--gym-font-mono);
  color: var(--gym-muted);
  font-size: 0.76em;
}

.gymdash-stack,
.gymdash-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gymdash-pane-main,
.gymdash-pane-side,
.gymdash-card,
.gymdash-exercise-list,
.gymdash-summary-grid {
  display: flex;
  flex-direction: column;
}

.gymdash-pane {
  min-width: 0;
  min-height: 0;
}

.gymdash-pane-main,
.gymdash-pane-side {
  align-self: stretch;
}

.gymdash-pane-side,
.gymdash-card,
.gymdash-exercise-list,
.gymdash-summary-grid {
  gap: 12px;
}

.gymdash-today-layout,
.gymdash-stat-layout,
.gymdash-filters {
  display: grid;
  gap: 14px;
}

.gymdash-today-layout {
  grid-template-columns: minmax(0, 1.6fr) minmax(260px, 0.9fr);
  align-items: stretch;
}

.gymdash-stat-layout {
  grid-template-columns: minmax(0, 1.4fr) minmax(250px, 0.8fr);
  align-items: stretch;
}

.gymdash-filters {
  grid-template-columns: 1fr auto;
  align-items: end;
}

/* ============================================================
 * 2. 通用组件
 * ============================================================ */

.gymdash-plan-date,
.gymdash-side-value,
.gymdash-stat-value {
  line-height: 1.08;
  font-weight: 800;
}

.gymdash-plan-date {
  font-size: 1.08em;
  color: var(--gym-main);
}

.gymdash-side-title,
.gymdash-label,
.gymdash-stat-label {
  font-size: 0.78em;
  font-weight: 800;
  color: var(--gym-muted);
}

.gymdash-card,
.gymdash-note,
.gymdash-meta-pill,
.gymdash-exercise-item,
.gymdash-more,
.gymdash-empty-state {
  border: 1px solid var(--gym-border);
  background: var(--gym-soft-bg);
}

.gymdash-card,
.gymdash-note {
  padding: 10px 12px;
  border-radius: 14px;
}

.gymdash-card-main,
.gymdash-main-card {
  flex: 1 1 auto;
  padding: 16px;
  border-radius: 16px;
  background: var(--gym-card-bg);
  box-shadow: var(--gym-shadow);
}

.gymdash-card-side,
.gymdash-side-card {
  background: var(--gym-card-bg);
}

.gymdash-card-note {
  background: var(--gym-soft-bg);
}

.gymdash-side-value {
  font-size: 1.55em;
  color: var(--gym-accent);
  font-family: var(--gym-font-mono);
}

.gymdash-focus-row,
.gymdash-meta-row,
.gymdash-filter-row,
.gymdash-pagination,
.gymdash-results-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.gymdash-results-head {
  justify-content: space-between;
  gap: 12px;
}

.gymdash-chip,
.gymdash-btn,
.gymdash-page-indicator,
.gymdash-plan-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid var(--gym-border);
  font-size: 0.78em;
}

.gymdash-chip {
  background: var(--gym-chip-bg);
  color: var(--gym-chip-text);
}

.gymdash-chip.is-accent {
  background: linear-gradient(135deg, var(--gym-stat-bg-1) 0%, var(--gym-stat-bg-2) 100%);
  color: var(--gym-stat-text-1);
}

.gymdash-btn {
  background: var(--gym-card-bg);
  color: var(--gym-text);
  cursor: pointer;
}

.gymdash-btn:hover:not(:disabled) {
  background: var(--gym-soft-bg);
}

.gymdash-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.gymdash-progress {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in srgb, var(--gym-chip-bg) 85%, transparent 15%);
}

.gymdash-progress > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--gym-accent), color-mix(in srgb, var(--gym-accent) 55%, white 45%));
}

.gymdash-list-compact {
  margin: 0;
  padding-left: 18px;
  line-height: 1.5;
}

.gymdash-list-compact li + li {
  margin-top: 4px;
}

/* ============================================================
 * 3. 今日训练 / 历史记录卡片
 * ============================================================ */

.gymdash-plan-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.gymdash-plan-status {
  white-space: nowrap;
  color: var(--gym-chip-text);
  background: var(--gym-chip-bg);
}

.gymdash-plan-status.is-done { color: #15803d; background: rgba(34,197,94,0.12); }
.gymdash-plan-status.is-doing { color: #b45309; background: rgba(245,158,11,0.16); }
.gymdash-plan-status.is-planned { color: #2563eb; background: rgba(59,130,246,0.12); }
.gymdash-plan-status.is-skipped { color: #b91c1c; background: rgba(239,68,68,0.12); }

.gymdash-plan-card {
  display: inline-block;
  width: 100%;
  margin: 0 0 12px;
  padding: 12px;
  break-inside: avoid;
  border: 1px solid var(--gym-border);
  border-radius: 16px;
  background: var(--gym-card-bg);
  box-shadow: var(--gym-shadow);
}

.gymdash-plan-card:hover {
  border-color: var(--gym-accent);
}

.gymdash-plan-meta,
.gymdash-stat-panel {
  display: grid;
  gap: 8px;
}

.gymdash-plan-meta {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 8px;
}

.gymdash-meta-pill,
.gymdash-exercise-item,
.gymdash-more {
  padding: 8px 9px;
  border-radius: 10px;
}

.gymdash-exercise-item {
  background: var(--background-primary);
}

.gymdash-exercise-name {
  font-size: 0.88em;
  font-weight: 700;
  line-height: 1.35;
}

.gymdash-inline-muted,
.gymdash-exercise-sub,
.gymdash-stat-note {
  color: var(--gym-muted);
}

.gymdash-inline-muted {
  font-size: 0.92em;
  font-weight: 600;
}

.gymdash-exercise-sub {
  margin-top: 4px;
  font-size: 0.76em;
  font-family: var(--gym-font-mono);
}

.gymdash-more {
  text-align: center;
  font-size: 0.78em;
}

.gymdash-empty-state,
.gymdash-empty {
  flex: 1 1 auto;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  text-align: center;
  border-radius: 16px;
  border-style: dashed;
  background: var(--gym-card-bg);
}

.gymdash-masonry {
  column-gap: 12px;
  column-width: 260px;
}

/* ============================================================
 * 4. 统计与热力图
 * ============================================================ */

.gymdash-heatmap-shell,
.gymdash-stat-panel {
  height: 100%;
}

.gymdash-heatmap-shell {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gymdash-heatmap-mount {
  min-height: 150px;
}

.gymdash-heatmap-mount .hmtpl-root {
  width: 100%;
}

.gymdash-heatmap-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  font-size: 0.74em;
  color: var(--gym-muted);
}

.gymdash-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.gymdash-legend-box {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  border: 1px solid rgba(127,127,127,0.12);
}

.gymdash-stat-panel {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gymdash-stat-box {
  padding: 12px;
  border: 1px solid var(--gym-border);
  border-radius: 16px;
  background: linear-gradient(135deg, var(--gym-stat-bg-1) 0%, var(--gym-stat-bg-2) 100%);
}

.gymdash-stat-label {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.gymdash-stat-value {
  margin-top: 6px;
  font-size: 1.45em;
  color: var(--gym-stat-text-1);
  font-family: var(--gym-font-mono);
}

.gymdash-stat-note {
  margin-top: 4px;
  font-size: 0.78em;
}

/* ============================================================
 * 5. 筛选器
 * ============================================================ */

.gymdash-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gymdash-input {
  min-width: 140px;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid var(--gym-border);
  background: var(--background-primary);
  color: var(--gym-text);
  font-family: var(--gym-font-main);
}

/* ============================================================
 * 6. 响应式
 * ============================================================ */

@media (min-width: 1500px) {
  .gymdash-masonry {
    column-count: 4;
    column-width: auto;
  }
}

@media (max-width: 1499px) {
  .gymdash-masonry {
    column-count: 3;
    column-width: auto;
  }
}

@media (max-width: 1080px) {
  .gymdash-today-layout,
  .gymdash-stat-layout,
  .gymdash-filters {
    grid-template-columns: 1fr;
  }

  .gymdash-masonry {
    column-count: 2;
    column-width: auto;
  }
}

@media (max-width: 720px) {
  .gymdash-results-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .gymdash-stat-panel,
  .gymdash-plan-meta {
    grid-template-columns: 1fr;
  }

  .gymdash-masonry {
    column-count: 1;
  }
}
`);
