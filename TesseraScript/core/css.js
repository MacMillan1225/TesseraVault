// core/css.js
//
// 这个模块负责管理页面中的 CSS 样式注入。
// 设计目标：
// - 支持直接传入 CSS 文本
// - 支持从 vault 中读取 .css 文件再注入
// - 按 id 去重，避免重复插入相同逻辑样式
// - 无 id 时自动编号，便于临时样式管理
// - 支持更新、追加、删除、清空、查询
// - 作为 Dataview 手动载入脚本时尽量保持幂等

const createFileController = dv.view("./file");

const GLOBAL_STORE_KEY = "__TESSERA_SCRIPT_CSS_STORE__";
const DEFAULT_PREFIX = "ts-css";

/**
 * 创建一个 CSS 控制器。
 *
 * @param {Object} [context]
 * @param {Object} [context.app] - Obsidian app 实例，可选；未传时会尝试使用 globalThis.app。
 * @param {string} [context.prefix="ts-css"] - 注入到 DOM 中的 style id 前缀。
 * @returns {{
 *   add: Function,
 *   addText: Function,
 *   addFile: Function,
 *   update: Function,
 *   append: Function,
 *   remove: Function,
 *   clear: Function,
 *   has: Function,
 *   get: Function,
 *   list: Function,
 *   ensure: Function,
 * }}
 */
function createCSSController(context = {}) {
  const store = getGlobalStore();
  const prefix = normalizePrefix(context.prefix || DEFAULT_PREFIX);
  const file = createFileController(context);

  /**
   * 确保当前环境存在 document，只有这样才能注入 style 标签。
   */
  function ensureDocument() {
    if (typeof document === "undefined") {
      throw new Error("[css] 当前环境不存在 document，无法注入 CSS。");
    }
    return document;
  }

  /**
   * 规整逻辑 id，用于内部管理与 DOM id 生成。
   */
  function normalizeId(id) {
    if (id == null) return "";
    const normalized = String(id)
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9_-]/g, "-");

    return normalized.replace(/-+/g, "-").replace(/^[-_]+|[-_]+$/g, "");
  }

  /**
   * 根据逻辑 id 生成实际挂在 DOM 上的 style id。
   */
  function makeDomId(id) {
    return `${prefix}-${normalizeId(id)}`;
  }

  /**
   * 当用户没有提供 id 时，自动生成 css-1 / css-2 这样的编号。
   */
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

  /**
   * 通过 DOM id 查找 style 元素。
   */
  function findStyleElement(domId) {
    const doc = ensureDocument();
    return doc.getElementById(domId);
  }

  /**
   * 选择样式挂载目标；默认优先挂到 document.head。
   */
  function ensureMountTarget(target) {
    const doc = ensureDocument();
    if (target && typeof target.appendChild === "function") {
      return target;
    }
    return doc.head || doc.body || doc.documentElement;
  }

  /**
   * 批量设置元素属性，常用于 data-* 或调试属性。
   */
  function setElementAttrs(element, attrs = {}) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value == null) return;
      element.setAttribute(key, String(value));
    });
  }

  /**
   * 创建 style 元素，但暂不挂载。
   */
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

  /**
   * 挂载或更新 style 元素，并把元素引用回写到 record 中。
   */
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

  /**
   * 解析 add / update 时传入的内容来源。
   * - text: 直接使用
   * - path: 通过 file.js 读取 vault 内 CSS 文件
   */
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

  /**
   * 生成内部记录对象。
   */
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

  /**
   * 保存记录到全局 store，便于多次执行脚本后仍能复用管理状态。
   */
  function saveRecord(record) {
    store.registry.set(record.id, record);
    return record;
  }

  /**
   * 对外返回记录的浅拷贝，避免用户意外修改内部状态。
   */
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

  /**
   * 通过逻辑 id 获取已有记录。
   * 若全局 store 中没有，但 DOM 中已经存在对应 style，也会尝试恢复记录。
   */
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

  /**
   * 添加样式。
   *
   * 行为规则：
   * - 有 id：按 id 去重
   * - 无 id：自动编号
   * - id 已存在且 replace !== true：直接返回已有记录，不覆盖
   */
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

  /**
   * 语义化快捷方法：直接添加 CSS 文本。
   */
  async function addText(text, options = {}) {
    return add({ ...options, text });
  }

  /**
   * 语义化快捷方法：从 vault 路径读取 CSS 文件并添加。
   */
  async function addFile(path, options = {}) {
    return add({ ...options, path });
  }

  /**
   * 更新指定 id 的样式。
   * 可传 text 或 path，但不能同时传。
   */
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

  /**
   * 向已有样式末尾追加 CSS 文本。
   */
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

  /**
   * 删除指定 id 对应的样式。
   */
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

  /**
   * 清空当前 prefix 下由控制器管理的全部样式。
   */
  function clear() {
    const ids = Array.from(store.registry.keys()).filter((id) => makeDomId(id).startsWith(prefix));
    ids.forEach((id) => {
      remove(id);
    });
    return ids.length;
  }

  /**
   * 判断指定 id 的样式是否存在。
   */
  function has(id) {
    return !!getExistingRecord(id);
  }

  /**
   * 获取指定 id 的样式记录。
   */
  function get(id) {
    return cloneRecord(getExistingRecord(id));
  }

  /**
   * 列出当前 prefix 下的全部样式记录。
   */
  function list() {
    return Array.from(store.registry.values())
      .filter((record) => record.domId.startsWith(prefix))
      .map((record) => cloneRecord(record));
  }

  /**
   * 确保样式存在：
   * - 有则返回已有记录
   * - 无则自动 add
   */
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

/**
 * 获取全局共享 store。
 * 这样即便 Dataview 反复执行脚本，也能尽量复用状态。
 */
function getGlobalStore() {
  if (!globalThis[GLOBAL_STORE_KEY]) {
    globalThis[GLOBAL_STORE_KEY] = {
      registry: new Map(),
      counters: {},
    };
  }

  return globalThis[GLOBAL_STORE_KEY];
}

/**
 * 规整 DOM id 前缀。
 */
function normalizePrefix(prefix) {
  const value = String(prefix || DEFAULT_PREFIX).trim();
  return value || DEFAULT_PREFIX;
}

module.exports = createCSSController;
module.exports.createCSSController = createCSSController;
