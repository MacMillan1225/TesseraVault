(() => {
  window.MyUtils = window.MyUtils || {};

  const ensureRuntime = async () => {
    if (!window.DashboardRuntime) {
      await dv.view("Scripts/dashboard_runtime", { autorender: false });
    }
    return window.DashboardRuntime;
  };

  window.MyUtils.setElPreWidth = function(width = "auto", cssId = "change-wide-style") {
    const widthValue = typeof width === "number" ? `${width}px` : width;
    if (window.DashboardRuntime) {
      window.DashboardRuntime.replaceStyle(cssId, `.el-pre { width: ${widthValue} !important; }`);
      return;
    }

    let styleEl = document.getElementById(cssId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = cssId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `.el-pre { width: ${widthValue} !important; }`;
  };

  window.MyUtils.removeElPreWidth = function(cssId = "change-wide-style") {
    if (window.DashboardRuntime) {
      window.DashboardRuntime.removeStyle(cssId);
      return;
    }
    document.getElementById(cssId)?.remove();
  };

  ensureRuntime().catch(() => {});
})();
