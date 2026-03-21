/* font_manager.js
 * 功能：统一处理字体配置、远程字体下载、本地缓存与 font-family 变量生成。
 * 使用：
 * 推荐优先通过 dashboard_runtime 调用：
 * await dv.view("Scripts/dashboard_runtime", { autorender: false });
 * await window.DashboardRuntime.ensureFontManager();
 * const fontCtx = await window.DashboardFontManager.prepareFonts(config.fonts, { cssVarPrefix: "dash" });
 *
 * 如需直接调用本模块，也可以：
 * await dv.view("Scripts/font_manager", { autorender: false });
 * const fontCtx = await window.DashboardFontManager.prepareFonts(config.fonts, { cssVarPrefix: "dash" });
 */

const DASHBOARD_FONT_MANAGER_KEY = "DashboardFontManager";

if (!window[DASHBOARD_FONT_MANAGER_KEY]) {
  const defaultFonts = {
    enableWebFonts: false,
    cacheFonts: true,
    cacheDir: ".obsidian/cache/dashboard-fonts",
    mainFont: "var(--font-interface)",
    monoFont: "var(--font-monospace)"
  };

  const inMemoryCssCache = new Map();
  const inFlightSheetCache = new Map();

  const toPosixPath = (value = "") => String(value).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");

  const normalizeFonts = (fonts = {}) => {
    const families = fonts.families || {};
    return {
      ...defaultFonts,
      ...fonts,
      families,
      cacheDir: toPosixPath(fonts.cacheDir || defaultFonts.cacheDir),
      mainFont: families.main || fonts.mainFont || defaultFonts.mainFont,
      monoFont: families.mono || fonts.monoFont || defaultFonts.monoFont
    };
  };

  const hashString = (value = "") => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  };

  const getExtensionFromUrl = (url) => {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.([a-z0-9]+)$/i);
      return match ? match[1].toLowerCase() : "woff2";
    } catch (_) {
      return "woff2";
    }
  };

  const ensureFolder = async (folderPath) => {
    const normalized = toPosixPath(folderPath);
    if (!normalized) return;

    const segments = normalized.split("/");
    let current = "";

    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      if (!(await app.vault.adapter.exists(current))) {
        await app.vault.createFolder(current);
      }
    }
  };

  const escapeCssUrl = (value = "") => value.replace(/"/g, '\\"');

  const escapeFontFamily = (value = "") => String(value).replace(/'/g, "\\'");

  const getFontFormat = (pathOrFormat = "") => {
    const value = String(pathOrFormat).toLowerCase();
    if (value.endsWith(".woff2") || value === "woff2") return "woff2";
    if (value.endsWith(".woff") || value === "woff") return "woff";
    if (value.endsWith(".ttf") || value === "ttf" || value === "truetype") return "truetype";
    if (value.endsWith(".otf") || value === "otf" || value === "opentype") return "opentype";
    return "woff2";
  };

  const downloadBinary = async (url, targetPath) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`字体下载失败: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await app.vault.adapter.writeBinary(targetPath, buffer);
    return app.vault.adapter.getResourcePath(targetPath);
  };

  const buildLocalFontFaceCss = async (fonts) => {
    const normalized = normalizeFonts(fonts);
    const localFontFaces = Array.isArray(normalized.localFontFaces) ? normalized.localFontFaces : [];
    if (!localFontFaces.length) return "";

    const cssBlocks = [];

    for (const face of localFontFaces) {
      if (!face?.family || !face?.path) continue;

      const fontPath = toPosixPath(face.path);
      if (!(await app.vault.adapter.exists(fontPath))) {
        console.warn("font_manager: 本地字体文件不存在", fontPath);
        continue;
      }

      const resourceUrl = app.vault.adapter.getResourcePath(fontPath);
      const format = getFontFormat(face.format || fontPath);

      cssBlocks.push(`@font-face {
  font-family: '${escapeFontFamily(face.family)}';
  src: url("${escapeCssUrl(resourceUrl)}") format("${format}");
  font-weight: ${face.weight || "normal"};
  font-style: ${face.style || "normal"};
  font-display: ${face.display || "swap"};
}`);
    }

    return cssBlocks.join("\n\n");
  };

  const fetchAndCacheFontSheet = async (fonts) => {
    const normalized = normalizeFonts(fonts);
    if (!normalized.enableWebFonts || !normalized.fontLink) return "";

    const sheetCacheKey = `${normalized.fontLink}::${normalized.cacheDir}`;
    if (inMemoryCssCache.has(sheetCacheKey)) {
      return inMemoryCssCache.get(sheetCacheKey);
    }
    if (inFlightSheetCache.has(sheetCacheKey)) {
      return inFlightSheetCache.get(sheetCacheKey);
    }

    const task = (async () => {
      const cacheDir = normalized.cacheDir;
      const sheetHash = hashString(normalized.fontLink);
      const cssCachePath = `${cacheDir}/sheet-${sheetHash}.css`;
      const shouldCache = normalized.cacheFonts !== false;

      if (shouldCache) {
        await ensureFolder(cacheDir);
      }

      const readCachedCss = async () => {
        if (!shouldCache) return "";
        if (!(await app.vault.adapter.exists(cssCachePath))) return "";
        return app.vault.adapter.read(cssCachePath);
      };

      const rewriteCssUrls = async (cssText) => {
        const matches = [...cssText.matchAll(/url\((['"]?)(.*?)\1\)/g)];
        if (!matches.length) return cssText;

        let rewrittenCss = cssText;

        for (const match of matches) {
          const originalUrl = match[2];
          if (!originalUrl || originalUrl.startsWith("data:")) continue;

          let resolvedUrl = originalUrl;
          try {
            resolvedUrl = new URL(originalUrl, normalized.fontLink).toString();
          } catch (_) {
            resolvedUrl = originalUrl;
          }

          let finalUrl = resolvedUrl;
          if (shouldCache) {
            const ext = getExtensionFromUrl(resolvedUrl);
            const fontFilePath = `${cacheDir}/font-${hashString(resolvedUrl)}.${ext}`;

            try {
              if (await app.vault.adapter.exists(fontFilePath)) {
                finalUrl = app.vault.adapter.getResourcePath(fontFilePath);
              } else {
                finalUrl = await downloadBinary(resolvedUrl, fontFilePath);
              }
            } catch (error) {
              console.warn("font_manager: 使用远程字体地址回退", resolvedUrl, error);
              finalUrl = resolvedUrl;
            }
          }

          rewrittenCss = rewrittenCss.replace(match[0], `url("${escapeCssUrl(finalUrl)}")`);
        }

        return rewrittenCss;
      };

      try {
        const response = await fetch(normalized.fontLink);
        if (!response.ok) {
          throw new Error(`字体样式下载失败: ${response.status} ${response.statusText}`);
        }

        const remoteCss = await response.text();
        const finalCss = await rewriteCssUrls(remoteCss);

        if (shouldCache) {
          await app.vault.adapter.write(cssCachePath, finalCss);
        }

        inMemoryCssCache.set(sheetCacheKey, finalCss);
        return finalCss;
      } catch (error) {
        console.warn("font_manager: 远程字体样式获取失败，尝试使用缓存", error);
        const cachedCss = await readCachedCss();
        inMemoryCssCache.set(sheetCacheKey, cachedCss || "");
        return cachedCss || "";
      } finally {
        inFlightSheetCache.delete(sheetCacheKey);
      }
    })();

    inFlightSheetCache.set(sheetCacheKey, task);
    return task;
  };

  const prepareFonts = async (fonts = {}, options = {}) => {
    const normalized = normalizeFonts(fonts);
    const cssVarPrefix = options.cssVarPrefix || "font";
    const remoteFontCSS = await fetchAndCacheFontSheet(normalized);
    const localFontCSS = await buildLocalFontFaceCss(normalized);
    const fontCSS = [localFontCSS, remoteFontCSS].filter(Boolean).join("\n\n");

    return {
      ...normalized,
      fontCSS,
      mainFontFamily: normalized.mainFont,
      monoFontFamily: normalized.monoFont,
      cssVarsText: `--${cssVarPrefix}-font-main: ${normalized.mainFont};\n--${cssVarPrefix}-font-mono: ${normalized.monoFont};`
    };
  };

  window[DASHBOARD_FONT_MANAGER_KEY] = {
    normalizeFonts,
    prepareFonts,
    fetchAndCacheFontSheet
  };
}

if (input?.autorender !== false) {
  dv.paragraph("font_manager 已加载，可通过 window.DashboardFontManager 调用。");
}
