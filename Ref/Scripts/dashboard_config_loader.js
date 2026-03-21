/* dashboard_config_loader.js
 * 用途：统一加载 dashboard_config.json，并与传入的默认配置合并。
 *
 * 使用方式：
 * 推荐优先通过 dashboard_runtime 调用：
 * await dv.view("Scripts/dashboard_runtime", { autorender: false });
 * const config = await window.DashboardRuntime.loadConfig({
 *   settings: {},
 *   fonts: { enableWebFonts: false, cacheFonts: true, families: {} },
 *   theme: { light: {}, dark: {} }
 * });
 *
 * 如需直接调用本模块，也可以：
 * await dv.view("Scripts/dashboard_config_loader", { autorender: false });
 * const config = await window.loadDashboardConfig({
 *   settings: {},
 *   fonts: { enableWebFonts: false, cacheFonts: true, families: {} },
 *   theme: { light: {}, dark: {} }
 * });
 */

const loadDashboardConfig = async (defaultConfig = {}) => {
  const fallback = {
    settings: {},
    fonts: {
      enableWebFonts: false,
      cacheFonts: true,
      cacheDir: ".obsidian/cache/dashboard-fonts",
      families: {}
    },
    theme: { light: {}, dark: {} },
    ...defaultConfig
  };

  try {
    const configPath = "dashboard_config.json";
    if (!(await app.vault.adapter.exists(configPath))) return fallback;

    const raw = await app.vault.adapter.read(configPath);
    const parsed = JSON.parse(raw);

    return {
      ...fallback,
      ...parsed,
      settings: { ...(fallback.settings || {}), ...(parsed.settings || {}) },
      fonts: {
        ...(fallback.fonts || {}),
        ...(parsed.fonts || {}),
        families: {
          ...((fallback.fonts || {}).families || {}),
          ...((parsed.fonts || {}).families || {})
        }
      },
      theme: {
        light: { ...(fallback.theme?.light || {}), ...(parsed.theme?.light || {}) },
        dark: { ...(fallback.theme?.dark || {}), ...(parsed.theme?.dark || {}) }
      }
    };
  } catch (error) {
    console.error("dashboard_config_loader error:", error);
    return fallback;
  }
};

window.loadDashboardConfig = loadDashboardConfig;

if (input?.autorender !== false) {
  dv.paragraph("dashboard_config_loader 已加载，可通过 window.loadDashboardConfig() 调用。");
}
