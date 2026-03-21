/* dashboard_runtime.js
 * 用途：集中提供看板脚本共享运行时能力，减少重复代码。
 * 能力：
 * - 统一确保依赖模块已加载
 * - 统一加载 dashboard_config.json 并处理分区配置
 * - 统一注入/替换 style 标签
 */

(() => {
  const RUNTIME_KEY = "DashboardRuntime";
  if (window[RUNTIME_KEY]) {
    if (input?.autorender !== false) {
      dv.paragraph("dashboard_runtime 已加载，可通过 window.DashboardRuntime 调用。");
    }
    return;
  }

  const loadedViews = new Map();

  const ensureView = async (viewPath, { cacheKey = viewPath, autorender = false } = {}) => {
    if (loadedViews.has(cacheKey)) return loadedViews.get(cacheKey);
    const promise = dv.view(viewPath, { autorender });
    loadedViews.set(cacheKey, promise);
    try {
      return await promise;
    } catch (error) {
      loadedViews.delete(cacheKey);
      throw error;
    }
  };

  const ensureConfigLoader = async () => {
    if (!window.loadDashboardConfig) {
      await ensureView("Scripts/dashboard_config_loader");
    }
    return window.loadDashboardConfig;
  };

  const ensureFontManager = async () => {
    if (!window.DashboardFontManager) {
      await ensureView("Scripts/font_manager");
    }
    return window.DashboardFontManager;
  };

  const mergeSectionSettings = (config, sectionKey) => {
    if (!sectionKey) return config;
    const sectionSettings = config?.[sectionKey] || {};
    return {
      ...config,
      settings: {
        ...(config?.settings || {}),
        ...sectionSettings
      }
    };
  };

  const loadConfig = async (defaultConfig = {}, { sectionKey } = {}) => {
    const loader = await ensureConfigLoader();
    const merged = await loader(defaultConfig);
    return mergeSectionSettings(merged, sectionKey);
  };

  const replaceStyle = (styleId, cssText) => {
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = cssText;
    return styleEl;
  };

  const removeStyle = (styleId) => {
    document.getElementById(styleId)?.remove();
  };

  window[RUNTIME_KEY] = {
    ensureView,
    ensureConfigLoader,
    ensureFontManager,
    loadConfig,
    replaceStyle,
    removeStyle
  };

  if (input?.autorender !== false) {
    dv.paragraph("dashboard_runtime 已加载，可通过 window.DashboardRuntime 调用。");
  }
})();
