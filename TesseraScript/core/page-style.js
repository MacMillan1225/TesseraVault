Tessera.define("core/page-style", function (require, module, exports) {
  const createCSSController = require("./css");
  const createFileController = require("./file");

  const GLOBAL_STORE_KEY = "__TESSERA_SCRIPT_PAGE_STYLE_STORE__";
  const SHARED_CONTROLLER_KEY = "__TESSERA_SCRIPT_SHARED_PAGE_STYLE_CONTROLLER__";
  const DEFAULT_PREFIX = "ts-page-style";
  const DEFAULT_SCOPE_ATTR_PREFIX = "data-ts-page-scope";
  const DEFAULT_WIDTH_STYLE_ID = "page-width";
  const PAGE_HOST_SELECTORS = [
    ".markdown-reading-view",
    ".markdown-preview-view",
    ".markdown-source-view",
    ".workspace-leaf-content",
    ".view-content",
  ];
  const NESTED_AT_RULES = new Set(["@media", "@supports", "@container", "@layer", "@scope"]);
  const PASSTHROUGH_AT_RULES = new Set([
    "@font-face",
    "@keyframes",
    "@-webkit-keyframes",
    "@property",
    "@counter-style",
    "@page",
  ]);

  function createPageStyleController(context = {}) {
    const store = getGlobalStore();
    const prefix = normalizeToken(context.prefix || DEFAULT_PREFIX, DEFAULT_PREFIX);
    const css = createCSSController({ ...context, prefix });
    const file = createFileController(context);

    function ensureDocument() {
      if (typeof document === "undefined") {
        throw new Error("[page-style] 当前环境不存在 document，无法注入页面样式。");
      }
      return document;
    }

    function normalizeId(id) {
      if (id == null) return "";
      const normalized = String(id)
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9_-]/g, "-");

      return normalized.replace(/-+/g, "-").replace(/^[-_]+|[-_]+$/g, "");
    }

    function getContainer(container) {
      const target = container || globalThis.dv?.container || null;
      if (!target || typeof target.closest !== "function") {
        throw new Error("[page-style] 需要提供 container，或在 DataviewJS 中调用并可访问 dv.container。");
      }
      return target;
    }

    function getPageHost(container) {
      for (const selector of PAGE_HOST_SELECTORS) {
        const host = container.closest(selector);
        if (host) {
          return host;
        }
      }

      return container;
    }

    function getHostKey(host) {
      if (!store.hostKeys.has(host)) {
        store.hostCounter += 1;
        store.hostKeys.set(host, `host-${store.hostCounter}`);
      }

      return store.hostKeys.get(host);
    }

    function nextLogicalId() {
      store.logicalCounter += 1;
      return `page-style-${store.logicalCounter}`;
    }

    function makeSessionKey(logicalId, hostKey) {
      return `${logicalId}__${hostKey}`;
    }

    function makeScopeAttrName(sessionKey) {
      return `${DEFAULT_SCOPE_ATTR_PREFIX}-${sessionKey}`;
    }

    function resolveScopeSelector(session) {
      return `[${session.scopeAttrName}]`;
    }

    async function resolveContent(options = {}) {
      const hasText = typeof options.text === "string";
      const hasPath = typeof options.path === "string" && options.path.trim() !== "";

      if (hasText && hasPath) {
        throw new Error("[page-style] text 和 path 只能二选一。");
      }

      if (!hasText && !hasPath) {
        throw new Error("[page-style] 必须提供 text 或 path 其中之一。");
      }

      if (hasText) {
        return {
          sourceType: "text",
          source: options.source || null,
          content: options.text,
        };
      }

      const normalizedPath = file.normalizePath(options.path);
      const content = await file.readCss(normalizedPath, { cached: options.cached });

      return {
        sourceType: "file",
        source: normalizedPath,
        content,
      };
    }

    function ensureSession(options = {}) {
      const container = getContainer(options.container);
      const host = getPageHost(container);
      const hostKey = getHostKey(host);
      const logicalId = normalizeId(options.id) || nextLogicalId();
      const key = makeSessionKey(logicalId, hostKey);
      const existing = store.sessions.get(key) || null;

      if (existing) {
        existing.container = container;
        existing.host = host;
        return existing;
      }

      const session = {
        key,
        logicalId,
        cssId: key,
        container,
        host,
        hostKey,
        scope: options.scope !== false,
        scopeAttrName: makeScopeAttrName(key),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sourceType: null,
        source: null,
        originalContent: "",
        content: "",
      };

      store.sessions.set(key, session);
      ensureSweeper();
      return session;
    }

    function bindScope(session) {
      if (!session.scope) {
        return;
      }

      session.host.setAttribute(session.scopeAttrName, "");
    }

    function unbindScope(session) {
      if (!session.scope) {
        return;
      }

      session.host.removeAttribute(session.scopeAttrName);
    }

    function buildScopedCss(content, session) {
      if (!session.scope) {
        return content;
      }

      return scopeCssText(content, resolveScopeSelector(session));
    }

    function normalizeSizeValue(value, fallback = "") {
      if (value == null || value === "") {
        return fallback;
      }

      if (typeof value === "number" && Number.isFinite(value)) {
        return `${value}px`;
      }

      const text = String(value).trim();
      return text || fallback;
    }

    function buildWidthCss(width, options = {}) {
      const widthValue = normalizeSizeValue(width);
      if (!widthValue) {
        throw new Error("[page-style] 宽度值不能为空。");
      }

      const maxWidth = normalizeSizeValue(options.maxWidth, widthValue);
      const codeWidth = normalizeSizeValue(options.codeWidth, widthValue);
      const centered = options.center !== false;
      const codeBlock = options.codeBlock !== false;
      const marginInline = centered ? "auto" : "0";

      const blocks = [
        `
          :scope {
            --file-line-width: ${widthValue};
            --line-width-adaptive: ${widthValue};
          }
        `,
        `
          .markdown-preview-sizer,
          .markdown-source-view.mod-cm6 .cm-sizer,
          .markdown-source-view.mod-cm6 .cm-contentContainer {
            max-width: ${maxWidth} !important;
            width: 100%;
            margin-left: ${marginInline};
            margin-right: ${marginInline};
          }
        `,
      ];

      if (codeBlock) {
        blocks.push(`
          .el-pre {
            max-width: ${codeWidth} !important;
            width: min(100%, ${codeWidth}) !important;
          }
        `);
      }

      return blocks.join("\n");
    }

    async function applyWidth(width, options = {}) {
      const id = normalizeId(options.id) || DEFAULT_WIDTH_STYLE_ID;
      const text = buildWidthCss(width, options);
      return apply({
        ...options,
        id,
        text,
      });
    }

    async function ensureWidth(width, options = {}) {
      const id = normalizeId(options.id) || DEFAULT_WIDTH_STYLE_ID;
      const text = buildWidthCss(width, options);
      return ensure({
        ...options,
        id,
        text,
      });
    }

    function removeWidth(target = DEFAULT_WIDTH_STYLE_ID) {
      return remove(target);
    }

    async function apply(options = {}) {
      const resolved = await resolveContent(options);
      const session = ensureSession(options);
      session.scope = options.scope !== false;
      const scopedContent = buildScopedCss(resolved.content, session);

      bindScope(session);

      const existingStyle = css.get(session.cssId);
      if (existingStyle) {
        await css.update(session.cssId, { text: scopedContent, attrs: options.attrs });
      } else {
        await css.add({ id: session.cssId, text: scopedContent, replace: true, attrs: options.attrs });
      }

      session.sourceType = resolved.sourceType;
      session.source = resolved.source;
      session.originalContent = resolved.content;
      session.content = scopedContent;
      session.updatedAt = Date.now();

      return createHandle(session, {
        exists: !!existingStyle,
        replaced: !!existingStyle,
      });
    }

    async function ensure(options = {}) {
      const session = ensureSession(options);
      const existingStyle = css.get(session.cssId);
      if (existingStyle) {
        return createHandle(session, {
          exists: true,
          replaced: false,
        });
      }

      return apply(options);
    }

    function remove(target) {
      const sessions = resolveSessions(target);
      sessions.forEach(removeSession);
      return sessions.length;
    }

    function clear(container) {
      const sessions = container ? resolveSessions(container) : Array.from(store.sessions.values());
      sessions.forEach(removeSession);
      return sessions.length;
    }

    function list() {
      return Array.from(store.sessions.values()).map((session) => cloneSession(session));
    }

    function get(target) {
      const sessions = resolveSessions(target);
      return sessions.length ? cloneSession(sessions[0]) : null;
    }

    function has(target) {
      return resolveSessions(target).length > 0;
    }

    function resolveSessions(target) {
      if (!target) {
        return [];
      }

      if (typeof target === "string") {
        const logicalId = normalizeId(target);
        if (!logicalId) {
          return [];
        }

        return Array.from(store.sessions.values()).filter((session) => session.logicalId === logicalId);
      }

      if (target && typeof target === "object") {
        if (typeof target.key === "string") {
          const session = store.sessions.get(target.key);
          return session ? [session] : [];
        }

        if (typeof target.closest === "function") {
          const host = getPageHost(target);
          return Array.from(store.sessions.values()).filter((session) => session.host === host);
        }
      }

      return [];
    }

    function removeSession(session) {
      css.remove(session.cssId);
      unbindScope(session);
      store.sessions.delete(session.key);
      maybeStopSweeper();
    }

    function createHandle(session, extra = {}) {
      return {
        ...cloneSession(session),
        ...extra,
        remove() {
          return remove(session.key) > 0;
        },
      };
    }

    function cloneSession(session) {
      return {
        key: session.key,
        id: session.logicalId,
        cssId: session.cssId,
        hostKey: session.hostKey,
        scope: session.scope,
        scopeAttrName: session.scopeAttrName,
        sourceType: session.sourceType,
        source: session.source,
        content: session.content,
        originalContent: session.originalContent,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        mounted: !!session.host?.isConnected,
        container: session.container || null,
        host: session.host || null,
      };
    }

    function ensureSweeper() {
      const doc = ensureDocument();
      if (store.observer || !doc.body || typeof MutationObserver !== "function") {
        return;
      }

      store.observer = new MutationObserver(function () {
        sweepDetachedSessions();
      });
      store.observer.observe(doc.body, {
        childList: true,
        subtree: true,
      });
    }

    function maybeStopSweeper() {
      if (store.sessions.size > 0) {
        return;
      }

      if (store.observer) {
        store.observer.disconnect();
        store.observer = null;
      }
    }

    function sweepDetachedSessions() {
      Array.from(store.sessions.values()).forEach((session) => {
        if (!session.host?.isConnected) {
          removeSession(session);
        }
      });
    }

    return {
      apply,
      ensure,
      buildWidthCss,
      applyWidth,
      ensureWidth,
      removeWidth,
      remove,
      clear,
      list,
      get,
      has,
    };
  }

  function getGlobalStore() {
    if (!globalThis[GLOBAL_STORE_KEY]) {
      globalThis[GLOBAL_STORE_KEY] = {
        sessions: new Map(),
        hostKeys: new WeakMap(),
        hostCounter: 0,
        logicalCounter: 0,
        observer: null,
      };
    }

    return globalThis[GLOBAL_STORE_KEY];
  }

  function normalizeToken(value, fallback) {
    const normalized = String(value || "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_]+|[-_]+$/g, "");

    return normalized || fallback;
  }

  function scopeCssText(cssText, scopeSelector) {
    const source = String(cssText || "");
    let cursor = 0;
    let output = "";

    while (cursor < source.length) {
      const nextBrace = source.indexOf("{", cursor);
      if (nextBrace === -1) {
        output += source.slice(cursor);
        break;
      }

      const selectorText = source.slice(cursor, nextBrace);
      const endBrace = findBlockEnd(source, nextBrace);
      if (endBrace === -1) {
        output += source.slice(cursor);
        break;
      }

      const body = source.slice(nextBrace + 1, endBrace);
      const trimmedSelector = selectorText.trim();

      if (!trimmedSelector) {
        output += `${selectorText}{${body}}`;
        cursor = endBrace + 1;
        continue;
      }

      if (trimmedSelector.startsWith("@")) {
        const atRuleName = trimmedSelector.split(/\s+/)[0].toLowerCase();

        if (NESTED_AT_RULES.has(atRuleName)) {
          output += `${selectorText}{${scopeCssText(body, scopeSelector)}}`;
        } else if (PASSTHROUGH_AT_RULES.has(atRuleName)) {
          output += `${selectorText}{${body}}`;
        } else {
          output += `${selectorText}{${body}}`;
        }

        cursor = endBrace + 1;
        continue;
      }

      const scopedSelector = splitSelectorList(selectorText)
        .map((selector) => prefixSelector(selector, scopeSelector))
        .join(", ");

      output += `${scopedSelector}{${body}}`;
      cursor = endBrace + 1;
    }

    return output;
  }

  function findBlockEnd(source, openIndex) {
    let depth = 0;
    let quote = "";

    for (let index = openIndex; index < source.length; index += 1) {
      const char = source[index];
      const previous = index > 0 ? source[index - 1] : "";

      if (quote) {
        if (char === quote && previous !== "\\") {
          quote = "";
        }
        continue;
      }

      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }

      if (char === "{") {
        depth += 1;
        continue;
      }

      if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          return index;
        }
      }
    }

    return -1;
  }

  function splitSelectorList(selectorText) {
    const result = [];
    let current = "";
    let roundDepth = 0;
    let squareDepth = 0;
    let quote = "";

    for (let index = 0; index < selectorText.length; index += 1) {
      const char = selectorText[index];
      const previous = index > 0 ? selectorText[index - 1] : "";

      if (quote) {
        current += char;
        if (char === quote && previous !== "\\") {
          quote = "";
        }
        continue;
      }

      if (char === '"' || char === "'") {
        quote = char;
        current += char;
        continue;
      }

      if (char === "(") {
        roundDepth += 1;
        current += char;
        continue;
      }

      if (char === ")") {
        roundDepth = Math.max(0, roundDepth - 1);
        current += char;
        continue;
      }

      if (char === "[") {
        squareDepth += 1;
        current += char;
        continue;
      }

      if (char === "]") {
        squareDepth = Math.max(0, squareDepth - 1);
        current += char;
        continue;
      }

      if (char === "," && roundDepth === 0 && squareDepth === 0) {
        if (current.trim()) {
          result.push(current.trim());
        }
        current = "";
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      result.push(current.trim());
    }

    return result;
  }

  function prefixSelector(selector, scopeSelector) {
    const trimmed = String(selector || "").trim();
    if (!trimmed) {
      return scopeSelector;
    }

    if (trimmed === ":scope") {
      return scopeSelector;
    }

    if (trimmed.includes(":scope")) {
      return trimmed.replace(/:scope/g, scopeSelector);
    }

    if (/^(html|body|:root)\b/.test(trimmed)) {
      return trimmed.replace(/^(html|body|:root)\b/, scopeSelector);
    }

    if (trimmed.startsWith(scopeSelector)) {
      return trimmed;
    }

    if (/^[>:~+]/.test(trimmed)) {
      return `${scopeSelector} ${trimmed}`;
    }

    if (trimmed.startsWith(":")) {
      return `${scopeSelector}${trimmed}`;
    }

    return `${scopeSelector} ${trimmed}`;
  }

  function getSharedPageStyleController(context = {}) {
    if (!globalThis[SHARED_CONTROLLER_KEY]) {
      globalThis[SHARED_CONTROLLER_KEY] = createPageStyleController(context);
    }

    return globalThis[SHARED_CONTROLLER_KEY];
  }

  const sharedPageStyleController = getSharedPageStyleController();

  module.exports = sharedPageStyleController;
  module.exports.pageStyle = sharedPageStyleController;
  module.exports.createPageStyleController = createPageStyleController;
  module.exports.getSharedPageStyleController = getSharedPageStyleController;
});
