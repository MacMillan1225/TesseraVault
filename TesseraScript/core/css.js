Tessera.define("core/css", function (require, module, exports) {
  const createFileController = require("./file");

  const GLOBAL_STORE_KEY = "__TESSERA_SCRIPT_CSS_STORE__";
  const DEFAULT_PREFIX = "ts-css";
  const SHARED_CONTROLLER_KEY = "__TESSERA_SCRIPT_SHARED_CSS_CONTROLLER__";

  function createCSSController(context = {}) {
    const store = getGlobalStore();
    const prefix = normalizePrefix(context.prefix || DEFAULT_PREFIX);
    const file = createFileController(context);

    function ensureDocument() {
      if (typeof document === "undefined") {
        throw new Error("[css] 当前环境不存在 document，无法注入 CSS。");
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

    function makeDomId(id) {
      return `${prefix}-${normalizeId(id)}`;
    }

    function nextAutoId() {
      let next = store.counters[prefix] || 1;

      while (true) {
        const candidate = `css-${next}`;
        const domId = makeDomId(candidate);

        if (!store.registry.has(candidate) && !findStyleElement(domId)) {
          store.counters[prefix] = next + 1;
          return candidate;
        }

        next += 1;
      }
    }

    function findStyleElement(domId) {
      const doc = ensureDocument();
      return doc.getElementById(domId);
    }

    function ensureMountTarget(target) {
      const doc = ensureDocument();
      if (target && typeof target.appendChild === "function") {
        return target;
      }
      return doc.head || doc.body || doc.documentElement;
    }

    function setElementAttrs(element, attrs = {}) {
      Object.entries(attrs).forEach(([key, value]) => {
        if (value == null) return;
        element.setAttribute(key, String(value));
      });
    }

    function createStyleElement(record, options = {}) {
      const doc = ensureDocument();
      const styleEl = doc.createElement("style");

      styleEl.id = record.domId;
      styleEl.type = "text/css";
      styleEl.textContent = record.content;
      styleEl.setAttribute("data-tessera-css-id", record.id);
      styleEl.setAttribute("data-tessera-css-source-type", record.sourceType);

      if (record.source) {
        styleEl.setAttribute("data-tessera-css-source", record.source);
      }

      setElementAttrs(styleEl, options.attrs);
      return styleEl;
    }

    function attachElement(record, target, attrs) {
      const mountTarget = ensureMountTarget(target);
      let element = findStyleElement(record.domId);

      if (!element) {
        element = createStyleElement(record, { attrs });
        mountTarget.appendChild(element);
      } else {
        element.textContent = record.content;
        element.setAttribute("data-tessera-css-id", record.id);
        element.setAttribute("data-tessera-css-source-type", record.sourceType);

        if (record.source) {
          element.setAttribute("data-tessera-css-source", record.source);
        }

        setElementAttrs(element, attrs);
      }

      record.element = element;
      return element;
    }

    async function resolveContent(options = {}) {
      const hasText = typeof options.text === "string";
      const hasPath = typeof options.path === "string" && options.path.trim() !== "";

      if (hasText && hasPath) {
        throw new Error("[css] text 和 path 只能二选一。");
      }

      if (!hasText && !hasPath) {
        throw new Error("[css] 必须提供 text 或 path 其中之一。");
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

    function buildRecord({ id, sourceType, source, content }) {
      const now = Date.now();
      const domId = makeDomId(id);
      const existing = store.registry.get(id);

      return {
        id,
        domId,
        sourceType,
        source,
        content,
        element: existing?.element || findStyleElement(domId) || null,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
    }

    function saveRecord(record) {
      store.registry.set(record.id, record);
      return record;
    }

    function cloneRecord(record, extra = {}) {
      if (!record) return null;

      return {
        id: record.id,
        domId: record.domId,
        sourceType: record.sourceType,
        source: record.source,
        content: record.content,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        mounted: !!(record.element || findStyleElement(record.domId)),
        ...extra,
      };
    }

    function getExistingRecord(id) {
      const normalizedId = normalizeId(id);
      if (!normalizedId) return null;

      const fromRegistry = store.registry.get(normalizedId);
      if (fromRegistry) {
        const element = findStyleElement(fromRegistry.domId);
        if (element) fromRegistry.element = element;
        return fromRegistry;
      }

      const domId = makeDomId(normalizedId);
      const element = findStyleElement(domId);
      if (!element) return null;

      const now = Date.now();
      const recovered = {
        id: normalizedId,
        domId,
        sourceType: element.getAttribute("data-tessera-css-source-type") || "text",
        source: element.getAttribute("data-tessera-css-source") || null,
        content: element.textContent || "",
        element,
        createdAt: now,
        updatedAt: now,
      };

      store.registry.set(normalizedId, recovered);
      return recovered;
    }

    async function add(options = {}) {
      const resolved = await resolveContent(options);
      const requestedId = normalizeId(options.id);
      const id = requestedId || nextAutoId();
      const existing = getExistingRecord(id);

      if (existing && !options.replace) {
        return cloneRecord(existing, {
          exists: true,
          replaced: false,
        });
      }

      const record = buildRecord({
        id,
        sourceType: resolved.sourceType,
        source: resolved.source,
        content: resolved.content,
      });

      attachElement(record, options.target, options.attrs);
      saveRecord(record);

      return cloneRecord(record, {
        exists: !!existing,
        replaced: !!existing,
      });
    }

    async function addText(text, options = {}) {
      return add({ ...options, text });
    }

    async function addFile(path, options = {}) {
      return add({ ...options, path });
    }

    async function update(id, options = {}) {
      const existing = getExistingRecord(id);
      if (!existing) {
        throw new Error(`[css] 不存在 id 为 ${id} 的样式，无法更新。`);
      }

      const resolved = await resolveContent(options);
      existing.sourceType = resolved.sourceType;
      existing.source = resolved.source;
      existing.content = resolved.content;
      existing.updatedAt = Date.now();

      attachElement(existing, options.target, options.attrs);
      saveRecord(existing);

      return cloneRecord(existing, {
        exists: true,
        replaced: true,
      });
    }

    function append(id, text) {
      if (typeof text !== "string") {
        throw new Error("[css] append 需要提供字符串类型的 text。");
      }

      const existing = getExistingRecord(id);
      if (!existing) {
        throw new Error(`[css] 不存在 id 为 ${id} 的样式，无法追加。`);
      }

      existing.content = `${existing.content}${existing.content ? "\n" : ""}${text}`;
      existing.updatedAt = Date.now();
      existing.sourceType = "text";

      attachElement(existing);
      saveRecord(existing);

      return cloneRecord(existing, {
        appended: true,
      });
    }

    function remove(id) {
      const existing = getExistingRecord(id);
      if (!existing) return false;

      const element = existing.element || findStyleElement(existing.domId);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }

      store.registry.delete(existing.id);
      return true;
    }

    function clear() {
      const ids = Array.from(store.registry.keys()).filter((id) => makeDomId(id).startsWith(prefix));
      ids.forEach((id) => remove(id));
      return ids.length;
    }

    function has(id) {
      return !!getExistingRecord(id);
    }

    function get(id) {
      return cloneRecord(getExistingRecord(id));
    }

    function list() {
      return Array.from(store.registry.values())
        .filter((record) => record.domId.startsWith(prefix))
        .map((record) => cloneRecord(record));
    }

    async function ensure(options = {}) {
      const normalizedId = normalizeId(options.id);
      if (normalizedId) {
        const existing = getExistingRecord(normalizedId);
        if (existing) {
          return cloneRecord(existing, {
            exists: true,
            replaced: false,
          });
        }
      }

      return add(options);
    }

    return {
      add,
      addText,
      addFile,
      update,
      append,
      remove,
      clear,
      has,
      get,
      list,
      ensure,
    };
  }

  function getGlobalStore() {
    if (!globalThis[GLOBAL_STORE_KEY]) {
      globalThis[GLOBAL_STORE_KEY] = {
        registry: new Map(),
        counters: {},
      };
    }

    return globalThis[GLOBAL_STORE_KEY];
  }

  function normalizePrefix(prefix) {
    const value = String(prefix || DEFAULT_PREFIX).trim();
    return value || DEFAULT_PREFIX;
  }

  function getSharedCSSController(context = {}) {
    if (!globalThis[SHARED_CONTROLLER_KEY]) {
      globalThis[SHARED_CONTROLLER_KEY] = createCSSController(context);
    }
    return globalThis[SHARED_CONTROLLER_KEY];
  }

  async function ensureSharedStyle(options = {}) {
    return getSharedCSSController(options.context).ensure(options);
  }

  module.exports = createCSSController;
  module.exports.createCSSController = createCSSController;
  module.exports.getSharedCSSController = getSharedCSSController;
  module.exports.ensureSharedStyle = ensureSharedStyle;
});
