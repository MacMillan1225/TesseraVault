/* dashboard_common_css.js
 * 功能：注入可复用的通用卡片样式，供主页/Gym/其他面板复用
 */
const commonConfig = input.config || {};

if (!window.DashboardRuntime) {
  await dv.view("Scripts/dashboard_runtime", { autorender: false });
}

await window.DashboardRuntime.ensureFontManager();

const cssId = "custom-dashboard-common-style";

const fontCtx = await window.DashboardFontManager.prepareFonts(commonConfig.fonts || {}, { cssVarPrefix: "card" });

window.DashboardRuntime.replaceStyle(cssId, `
${fontCtx.fontCSS}

:root {
  --card-font-main: ${fontCtx.mainFontFamily};
  --card-font-mono: ${fontCtx.monoFontFamily};
}

.card,
.dash_card {
  background-color: var(--dash-card-bg, var(--background-secondary));
  border-radius: 16px;
  padding: 18px;
  box-shadow: var(--dash-shadow, none);
  border: 1px solid var(--background-modifier-border);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: visible;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  font-family: var(--card-font-main);
}

.card:hover,
.dash_card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.15);
  border-color: var(--dash-accent, var(--text-accent));
}

.card-header,
.card_header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--background-modifier-border);
}

.card-title,
.card_title {
  font-size: 1.2em;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--dash-main, var(--text-normal));
}

.card-subtitle,
.card_subtitle {
  font-size: 0.75em;
  color: var(--dash-text-mute, var(--text-muted));
  font-weight: 700;
  font-family: var(--card-font-mono);
  text-transform: uppercase;
  opacity: 0.8;
}

.card-body {
  flex: 1 1 auto;
  min-height: 0;
}

.card-compact {
  padding: 14px;
  border-radius: 12px;
}

@media (max-width: 768px) {
  .card,
  .dash_card {
    padding: 16px;
  }
}
`);
