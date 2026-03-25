Tessera.define("core/file", function (require, module, exports) {
  function createFileController(context = {}) {
    function getApp() {
      const appInstance = context.app || globalThis.app;
      if (!appInstance || !appInstance.vault) {
        throw new Error("[file] 未找到 Obsidian app 实例，无法读取 vault 文件。");
      }
      return appInstance;
    }

    function normalizePath(path) {
      const normalized = String(path || "").trim().replace(/\\/g, "/");
      return normalized.replace(/\/+/g, "/");
    }

    function getAbstractFileByPath(path) {
      const normalizedPath = normalizePath(path);
      if (!normalizedPath) {
        return null;
      }

      const appInstance = getApp();
      return appInstance.vault.getAbstractFileByPath(normalizedPath);
    }

    function exists(path) {
      return !!getAbstractFileByPath(path);
    }

    async function read(path, options = {}) {
      const normalizedPath = normalizePath(path);
      if (!normalizedPath) {
        throw new Error("[file] path 不能为空。");
      }

      const appInstance = getApp();
      const file = getAbstractFileByPath(normalizedPath);

      if (!file) {
        throw new Error(`[file] 未找到文件：${normalizedPath}`);
      }

      const useCached = options.cached !== false;

      if (useCached && typeof appInstance.vault.cachedRead === "function") {
        return appInstance.vault.cachedRead(file);
      }

      if (typeof appInstance.vault.read === "function") {
        return appInstance.vault.read(file);
      }

      throw new Error("[file] 当前 vault 不支持读取文件内容。");
    }

    async function readText(path, options = {}) {
      return read(path, options);
    }

    async function readCss(path, options = {}) {
      return read(path, options);
    }

    async function readJson(path, options = {}) {
      const text = await read(path, options);

      try {
        return JSON.parse(text);
      } catch (error) {
        throw new Error(`[file] JSON 解析失败：${normalizePath(path)}\n${error.message}`);
      }
    }

    return {
      getApp,
      normalizePath,
      getAbstractFileByPath,
      exists,
      read,
      readText,
      readCss,
      readJson,
    };
  }

  module.exports = createFileController;
  module.exports.createFileController = createFileController;
});
