Tessera.define("core/font", function (require, module, exports) {
  const createCSSController = require("./css");
  const createFileController = require("./file");

  const GLOBAL_STORE_KEY = "__TESSERA_SCRIPT_FONT_STORE__";
  const SHARED_CONTROLLER_KEY = "__TESSERA_SCRIPT_SHARED_FONT_CONTROLLER__";
  const FACES_STYLE_ID = "ts-font-faces";
  const ALIASES_STYLE_ID = "ts-font-aliases";
  const DEFAULT_VAR_PREFIX = "--ts-font-";
  const DEFAULT_SELECTOR = ":root";
  const DEFAULT_FONT_DEFINITIONS = [
    {
      id: "default-youshe-haoshenti",
      family: "YOUSHE HaoShenTi",
      style: "normal",
      weight: "400",
      display: "swap",
      source: {
        type: "vault-file",
        path: "TesseraScript/assets/fonts/YOUSHEhaoshenti.woff2",
        format: "woff2",
      },
    },
    {
      id: "default-jetbrains-mono",
      family: "JetBrains Mono",
      style: "normal",
      weight: "400",
      display: "swap",
      source: {
        type: "remote-css",
        url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&display=swap",
      },
    },
  ];
  const DEFAULT_ALIASES = {
    ui: ['"Inter"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
    body: ['"Inter"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
    display: ['"YOUSHE HaoShenTi"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
    title: ['var(--ts-font-display)', '"Inter"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
    mono: ['"JetBrains Mono"', '"Cascadia Code"', '"Consolas"', 'monospace'],
  };

  function createFontController(context = {}) {
    const store = getGlobalStore();
    const css = createCSSController(context);
    const file = createFileController(context);

    ensureDefaultAliases(store);
    ensureDefaultFonts(store, file);

    function normalizeAliasName(name) {
      return String(name == null ? "" : name)
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-_]+|[-_]+$/g, "")
        .toLowerCase();
    }

    function quote(value) {
      return `"${String(value).replace(/"/g, '\\"')}"`;
    }

    function normalizeFamilyToken(token) {
      const value = String(token == null ? "" : token).trim();
      if (!value) {
        return "";
      }

      if (value.startsWith("var(")) {
        return value;
      }

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        return value;
      }

      if (/^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|emoji|math|fangsong)$/i.test(value)) {
        return value;
      }

      if (/\s/.test(value)) {
        return quote(value);
      }

      return value;
    }

    function normalizeFamilyList(families) {
      const list = Array.isArray(families) ? families : [families];
      const normalized = list.map(normalizeFamilyToken).filter(Boolean);

      if (!normalized.length) {
        throw new Error("[font] 至少需要提供一个字体族。");
      }

      return normalized;
    }

    function normalizeSource(source = {}) {
      const type = String(source.type || "").trim();
      if (!type) {
        throw new Error("[font] source.type 不能为空。");
      }

      if (type === "local") {
        return {
          type,
          names: normalizeFamilyList(source.names || source.name).map(unquote),
        };
      }

      if (type === "remote-file") {
        const url = String(source.url || "").trim();
        if (!url) {
          throw new Error("[font] remote-file 需要提供 url。");
        }

        return {
          type,
          url,
          format: source.format ? String(source.format).trim() : null,
        };
      }

      if (type === "vault-file") {
        const path = file.normalizePath(source.path);
        if (!path) {
          throw new Error("[font] vault-file 需要提供 path。");
        }

        return {
          type,
          path,
          url: file.getResourceUrl(path),
          format: source.format ? String(source.format).trim() : null,
        };
      }

      if (type === "remote-css") {
        const url = String(source.url || "").trim();
        if (!url) {
          throw new Error("[font] remote-css 需要提供 url。");
        }

        return {
          type,
          url,
        };
      }

      throw new Error(`[font] 不支持的 source.type：${type}`);
    }

    function normalizeDefinition(definition = {}) {
      const family = String(definition.family || "").trim();
      if (!family) {
        throw new Error("[font] family 不能为空。");
      }

      return {
        id: definition.id ? String(definition.id).trim() : null,
        family,
        style: String(definition.style == null ? "normal" : definition.style).trim() || "normal",
        weight: String(definition.weight == null ? "400" : definition.weight).trim() || "400",
        stretch: definition.stretch == null ? null : String(definition.stretch).trim() || null,
        display: String(definition.display == null ? "swap" : definition.display).trim() || "swap",
        unicodeRange: definition.unicodeRange == null ? null : String(definition.unicodeRange).trim() || null,
        source: normalizeSource(definition.source),
      };
    }

    function createFontKey(record) {
      const source = record.source;
      const sourceId = source.type === "local"
        ? source.names.join("|")
        : source.type === "vault-file"
          ? source.path
          : source.url;

      return [record.family, record.weight, record.style, record.stretch || "", source.type, sourceId].join("::");
    }

    function buildAliasValue(families) {
      return normalizeFamilyList(families).join(", ");
    }

    function buildAliasVarName(name, options = {}) {
      const aliasName = normalizeAliasName(name);
      if (!aliasName) {
        throw new Error("[font] alias 名称不能为空。");
      }

      const varPrefix = String(options.varPrefix || store.aliasStyle.varPrefix || DEFAULT_VAR_PREFIX).trim() || DEFAULT_VAR_PREFIX;
      return `${varPrefix}${aliasName}`;
    }

    function buildSrc(record) {
      if (record.source.type === "local") {
        return record.source.names.map((name) => `local(${quote(name)})`).join(", ");
      }

      if (record.source.type === "remote-file" || record.source.type === "vault-file") {
        const format = record.source.format ? ` format(${quote(record.source.format)})` : "";
        return `url(${quote(record.source.url)})${format}`;
      }

      return "";
    }

    function buildFontFace(record) {
      if (record.source.type === "remote-css") {
        return `@import url(${quote(record.source.url)});`;
      }

      const lines = [
        "@font-face {",
        `  font-family: ${quote(record.family)};`,
        `  src: ${buildSrc(record)};`,
        `  font-style: ${record.style};`,
        `  font-weight: ${record.weight};`,
        `  font-display: ${record.display};`,
      ];

      if (record.stretch) {
        lines.push(`  font-stretch: ${record.stretch};`);
      }

      if (record.unicodeRange) {
        lines.push(`  unicode-range: ${record.unicodeRange};`);
      }

      lines.push("}");
      return lines.join("\n");
    }

    function cloneValue(value) {
      if (Array.isArray(value)) {
        return value.map(cloneValue);
      }

      if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]));
      }

      return value;
    }

    function listFonts() {
      return Array.from(store.fonts.values()).map(cloneValue);
    }

    function listAliases() {
      return Object.fromEntries(Array.from(store.aliases.entries()).map(([key, value]) => [key, cloneValue(value)]));
    }

    function getAlias(name) {
      const aliasName = normalizeAliasName(name);
      const value = store.aliases.get(aliasName);
      return value ? cloneValue(value) : null;
    }

    async function upsertStyle(id, text) {
      if (css.has(id)) {
        return css.update(id, { text });
      }

      return css.add({ id, text });
    }

    async function syncFontStyles() {
      const text = listFonts().map(buildFontFace).join("\n\n");

      if (!text.trim()) {
        css.remove(FACES_STYLE_ID);
        return null;
      }

      return upsertStyle(FACES_STYLE_ID, text);
    }

    async function syncAliasStyles() {
      const entries = Array.from(store.aliases.entries());
      if (!entries.length) {
        css.remove(ALIASES_STYLE_ID);
        return null;
      }

      const selector = store.aliasStyle.selector || DEFAULT_SELECTOR;
      const lines = [`${selector} {`];

      entries.forEach(([name, families]) => {
        lines.push(`  ${buildAliasVarName(name)}: ${buildAliasValue(families)};`);
      });

      lines.push("}");
      return upsertStyle(ALIASES_STYLE_ID, lines.join("\n"));
    }

    async function ensureDefaults() {
      ensureDefaultAliases(store);
      ensureDefaultFonts(store, file);
      await syncFontStyles();
      return syncAliasStyles();
    }

    async function register(definition = {}) {
      const record = normalizeDefinition(definition);
      store.fonts.set(record.id || createFontKey(record), {
        key: record.id || createFontKey(record),
        ...record,
      });
      return syncFontStyles();
    }

    async function registerMany(definitions = []) {
      if (!Array.isArray(definitions)) {
        throw new Error("[font] registerMany 需要传入数组。");
      }

      definitions.forEach((definition) => {
        const record = normalizeDefinition(definition);
        store.fonts.set(record.id || createFontKey(record), {
          key: record.id || createFontKey(record),
          ...record,
        });
      });

      return syncFontStyles();
    }

    async function defineAlias(name, families, options = {}) {
      const aliasName = normalizeAliasName(name);
      if (!aliasName) {
        throw new Error("[font] alias 名称不能为空。");
      }

      store.aliases.set(aliasName, normalizeFamilyList(families));

      if (options.selector) {
        store.aliasStyle.selector = String(options.selector).trim() || DEFAULT_SELECTOR;
      }

      if (options.varPrefix) {
        store.aliasStyle.varPrefix = String(options.varPrefix).trim() || DEFAULT_VAR_PREFIX;
      }

      return syncAliasStyles();
    }

    async function applyVars(options = {}) {
      if (options.selector) {
        store.aliasStyle.selector = String(options.selector).trim() || DEFAULT_SELECTOR;
      }

      if (options.varPrefix) {
        store.aliasStyle.varPrefix = String(options.varPrefix).trim() || DEFAULT_VAR_PREFIX;
      }

      return syncAliasStyles();
    }

    async function removeFont(nameOrKey) {
      const value = String(nameOrKey == null ? "" : nameOrKey).trim();
      if (!value) {
        return false;
      }

      let removed = store.fonts.delete(value);
      if (!removed) {
        for (const [key, record] of store.fonts.entries()) {
          if (record.family === value) {
            store.fonts.delete(key);
            removed = true;
          }
        }
      }

      if (removed) {
        await syncFontStyles();
      }

      return removed;
    }

    async function removeAlias(name) {
      const aliasName = normalizeAliasName(name);
      if (!aliasName) {
        return false;
      }

      const removed = store.aliases.delete(aliasName);
      if (removed) {
        await syncAliasStyles();
      }

      return removed;
    }

    return {
      defaults: cloneValue(DEFAULT_ALIASES),
      ensureDefaults,
      register,
      registerMany,
      defineAlias,
      getAlias,
      listAliases,
      listFonts,
      buildAliasValue,
      buildAliasVarName,
      buildFontFace,
      applyVars,
      removeFont,
      removeAlias,
    };
  }

  function getGlobalStore() {
    if (!globalThis[GLOBAL_STORE_KEY]) {
      globalThis[GLOBAL_STORE_KEY] = {
        fonts: new Map(),
        aliases: new Map(),
        defaultsSeeded: false,
        defaultFontsSeeded: false,
        aliasStyle: {
          selector: DEFAULT_SELECTOR,
          varPrefix: DEFAULT_VAR_PREFIX,
        },
      };
    }

    return globalThis[GLOBAL_STORE_KEY];
  }

  function ensureDefaultAliases(store) {
    if (store.defaultsSeeded) {
      return;
    }

    Object.entries(DEFAULT_ALIASES).forEach(([name, families]) => {
      store.aliases.set(name, families.slice());
    });

    store.defaultsSeeded = true;
  }

  function getSharedFontController(context = {}) {
    if (!globalThis[SHARED_CONTROLLER_KEY]) {
      globalThis[SHARED_CONTROLLER_KEY] = createFontController(context);
    }

    return globalThis[SHARED_CONTROLLER_KEY];
  }

  function ensureDefaultFonts(store, file) {
    if (store.defaultFontsSeeded) {
      return;
    }

    DEFAULT_FONT_DEFINITIONS.forEach((definition) => {
      const source = normalizeDefaultSource(definition.source, file);
      store.fonts.set(definition.id, {
        key: definition.id,
        id: definition.id,
        family: definition.family,
        style: definition.style,
        weight: definition.weight,
        stretch: definition.stretch || null,
        display: definition.display || "swap",
        unicodeRange: definition.unicodeRange || null,
        source,
      });
    });

    store.defaultFontsSeeded = true;
  }

  function normalizeDefaultSource(source = {}, file) {
    const type = String(source.type || "").trim();

    if (type === "vault-file") {
      const path = file.normalizePath(source.path);
      return {
        type,
        path,
        url: file.getResourceUrl(path),
        format: source.format ? String(source.format).trim() : null,
      };
    }

    if (type === "local") {
      return {
        type,
        names: [String(source.name || "").trim()].filter(Boolean),
      };
    }

    return source;
  }

  function unquote(value) {
    return String(value).replace(/^['"]|['"]$/g, "");
  }

  const sharedFontController = getSharedFontController();

  module.exports = sharedFontController;
  module.exports.font = sharedFontController;
  module.exports.createFontController = createFontController;
  module.exports.getSharedFontController = getSharedFontController;
  module.exports.defaults = cloneDefaults(DEFAULT_ALIASES);
  module.exports.defaultFonts = cloneDefaults(DEFAULT_FONT_DEFINITIONS);

  function cloneDefaults(value) {
    if (Array.isArray(value)) {
      return value.map(cloneDefaults);
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneDefaults(item)]));
    }

    return value;
  }
});
