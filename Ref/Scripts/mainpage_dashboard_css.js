/* mainpage_dashboard_css.js
 * 功能：为主页看板注入专用样式
 * 说明：热力图已由 heatmap_template.js 接管，这里仅保留主页真正使用的布局/列表/统计样式。
 */
const config = input.config;
if (!config) return;

if (!window.DashboardRuntime) {
    await dv.view("Scripts/dashboard_runtime", { autorender: false });
}

await window.DashboardRuntime.ensureFontManager();

const lightTheme = config.theme?.light || {};
const darkTheme = config.theme?.dark || {};

const cssId = "custom-dashboard-style";

// 1. 字体处理
const fontCtx = await window.DashboardFontManager.prepareFonts(config.fonts || {}, { cssVarPrefix: "dash" });

// 2. 颜色变量
const generateColorVars = (t) => {
    const v = (val, fallback) => val ? val : fallback;
    
    return `
    --dash-main:      ${v(t.main, 'var(--text-normal)')};
    --dash-card-bg:   ${v(t.cardBg, 'var(--background-secondary)')};
    --dash-shadow:    ${v(t.shadow, 'none')};
    --dash-text-norm: ${v(t.textNormal, 'var(--text-normal)')};
    --dash-text-mute: ${v(t.textMuted, 'var(--text-muted)')};
    --dash-accent:    ${v(t.textAccent, 'var(--text-accent)')};
    --dash-task-hover:${v(t.taskHoverBg, 'var(--background-primary)')};
    --dash-sect-head: ${v(t.sectionHeader, 'var(--interactive-accent)')};
    --dash-tag-bg:    ${v(t.timeTagBg, 'var(--background-primary-alt)')};
    --dash-tag-text:  ${v(t.timeTagText, 'var(--text-faint)')};
    --dash-stat-bg-1: ${v(t.statBgStart, 'var(--background-secondary)')};
    --dash-stat-bg-2: ${v(t.statBgEnd,   'var(--background-primary)')};
    --dash-stat-txt1: ${v(t.statTextMain,'var(--text-normal)')};
    --dash-stat-txt2: ${v(t.statTextSub, 'var(--text-muted)')};
    --dash-font-main: ${fontCtx.mainFontFamily};
    --dash-font-mono: ${fontCtx.monoFontFamily};
    `;
};

const keyframes = `
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bar-fill { from { width: 0; } to { width: 100%; } }
`;

window.DashboardRuntime.replaceStyle(cssId, `
${fontCtx.fontCSS}
${keyframes}

body.theme-light,
body:not(.theme-dark) { ${generateColorVars(lightTheme)} }

body.theme-dark { ${generateColorVars(darkTheme)} }

/* =======================================
   CSS 样式定义 (引用上面的 --dash- 变量)
   ======================================= */

.dashboard_container {
    display: flex; flex-direction: column; gap: 12px; margin: 10px 0;
    max-height: calc(100vh - 100px); overflow: visible;
    font-family: var(--dash-font-main); 
    color: var(--dash-text-norm); /* 使用配置后的颜色 */
    animation: fade-in-up 0.4s ease-out;
}

/* 布局 */
.row_top { flex: 0 1 auto; display: grid; grid-template-columns: 1.7fr 1fr; gap: 12px; min-height: 0; }
.row_bottom { flex: 1 1 auto; display: flex; gap: 12px; min-height: 0; overflow: visible; }

.dash_card { min-height: 0; }

/* 任务列表 */
.section_today { min-height: 0; }
.today_split { flex: 1; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
.time_block { display: flex; flex-direction: column; min-height: 0; }

.time_label { 
    flex-shrink: 0; font-size: 0.85em; 
    color: var(--dash-sect-head); /* 上午/下午 标题色 */
    font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; 
}
.time_label::after { content: ''; flex: 1; height: 2px; background: var(--background-modifier-border); opacity: 0.3; border-radius: 2px;}

ul.dash_tasklist { 
    list-style: none; padding: 0; margin: 4px 0 10px 0;
    column-fill: balance; column-gap: 20px;
}

.dash_task_item_today, .dash_task_item_review {
    display: flex !important; align-items: center; width: 100%;
    padding: 4px 6px; border-radius: 6px; margin-bottom: 3px; break-inside: avoid;
    transition: background 0.2s;
}
.dash_task_item_today:hover, .dash_task_item_review:hover {
    background-color: var(--dash-task-hover); /* 任务 Hover 背景 */
}

.dash_task_item_today { padding-left: 4px; border-left: 2px solid transparent; }
.dash_task_item_today:hover { border-left-color: var(--dash-accent); }
.dash_task_item_review { padding-left: 0 !important; margin-inline-start: 0 !important; }

/* 链接和内容 */
.dash_task_item_today a, .dash_task_item_review a { 
    color: var(--dash-accent); text-decoration: none; margin-right: 6px; opacity: 0.9;
}
.task_content {
    flex: 1; margin: 0 18px 0 4px; line-height: 1.4; font-weight: 500;
    color: var(--dash-text-norm);
}

.task_time {
    flex-shrink: 0; font-size: 0.72em; font-family: var(--dash-font-mono); font-weight: 500;
    background-color: var(--dash-tag-bg);
    color: var(--dash-tag-text);
    border: 1px solid var(--background-modifier-border);
    padding: 2px 6px; border-radius: 5px; white-space: nowrap;
}

.no_tasks { color: var(--dash-text-mute); font-style: italic; font-size: 0.85em; padding: 5px 0; }
.backlog_date { font-size: 0.75em; color: var(--dash-text-mute); font-weight: 700; margin-bottom: 6px; display: block; }

.section_heatmap { width: 100%; }
.heatmap_wrapper { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.heatmap_mount {
    width: 100%;
}

.stats_container { display: flex; flex-direction: column; gap: 10px; width: 130px; }
.stat_card_item { 
    flex: 1; min-height: 0;
    background: linear-gradient(135deg, var(--dash-stat-bg-1) 0%, var(--dash-stat-bg-2) 100%);
    border-radius: 12px; padding: 0 10px;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    border: 1px solid var(--background-modifier-border);
    text-align: center;
}
.stat_val { 
    font-size: 2em; font-weight: 800; line-height: 1; 
    color: var(--dash-stat-txt1); /* 大数字颜色 */
    font-family: var(--dash-font-mono); letter-spacing: -1px; 
}
.stat_lbl { 
    font-size: 0.7em; margin-top: 4px; text-transform: uppercase; font-weight: 700; opacity: 0.8; 
    color: var(--dash-stat-txt2); /* 标签颜色 */
}

.stat_header_mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.stat_progress_bg {
    display: none;
    width: 100%;
    height: 6px;
    margin-top: 8px;
    border-radius: 999px;
    background-color: color-mix(in srgb, var(--dash-stat-bg-1) 35%, var(--dash-card-bg) 65%);
    overflow: hidden;
}

.stat_progress_bar {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--dash-stat-bg-1), var(--dash-sect-head));
    animation: bar-fill 0.6s ease-out;
}

@media (max-width: 768px) {
    .dashboard_container { max-height: none; }
    .row_top, .row_bottom { display: flex; flex-direction: column; }
    .dash_tasklist { column-width: auto; }
    .stats_container { width: 100%; background-color: var(--dash-card-bg); padding: 16px; flex-direction: row; flex-wrap: wrap;}
    .stat_card_item { background: none; border: none; padding: 0; flex: 1; min-width: 120px; display: block; margin: 0;}
    .stat_header_mobile { flex-direction: column-reverse; }
    .stat_val { color: var(--dash-text-norm); font-size: 1.5em; }
    .stat_progress_bg { display: block; }
}
`);
