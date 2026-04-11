Tessera.define("components/card", function (require, module, exports) {
const createCSSController = require("../core/css");
const css = createCSSController();

const STYLE_PATH = "TesseraScript/components/card/style.css";
const THEME_PATH = "TesseraScript/shared/theme.css";

// 确保样式已加载
async function ensureStyles() {
  await css.ensure({ id: "ts-theme", path: THEME_PATH });
  await css.ensure({ id: "ts-card", path: STYLE_PATH });
}

// 样式加载 Promise（只加载一次）
let stylePromise = null;
function getStylePromise() {
  if (!stylePromise) {
    stylePromise = ensureStyles().catch((err) => {
      stylePromise = null;
      console.warn("[Tessera] Failed to load card styles:", err);
    });
  }
  return stylePromise;
}

// 构建卡片 DOM
function buildCardElement(options) {
  const cfg = {
    title: options.title ?? null,
    meta: options.meta ?? options.subtitle ?? null,
    compact: options.compact ?? false,
    border: options.border ?? true,
    hover: options.hover ?? true,
    headerSep: options.headerSep ?? true,
    cssVars: options.cssVars ?? {},
    className: options.className ?? "",
  };

  // 卡片根元素
  const el = document.createElement("div");
  el.classList.add("ts-card");
  if (cfg.compact) el.classList.add("ts-card--compact");
  if (!cfg.border) el.classList.add("ts-card--no-border");
  if (!cfg.hover) el.classList.add("ts-card--no-hover");
  if (cfg.className) {
    const classes = String(cfg.className).split(/\s+/).filter(Boolean);
    el.classList.add(...classes);
  }

  // 局部 CSS 变量覆盖
  Object.entries(cfg.cssVars).forEach(([key, val]) => {
    el.style.setProperty(key, val);
  });

  // Header
  const header = document.createElement("div");
  header.classList.add("ts-card__header");
  if (cfg.headerSep) header.classList.add("ts-card__header--sep");

  const left = document.createElement("div");
  left.style.cssText = "display:flex;flex-direction:column;gap:2px;min-width:0;";

  if (cfg.title) {
    const title = document.createElement("div");
    title.classList.add("ts-card__title");
    title.textContent = cfg.title;
    left.appendChild(title);
  }

  if (cfg.meta) {
    const meta = document.createElement("div");
    meta.classList.add("ts-card__meta");
    meta.textContent = cfg.meta;
    left.appendChild(meta);
  }

  header.appendChild(left);
  el.appendChild(header);

  // Body
  const body = document.createElement("div");
  body.classList.add("ts-card__body");
  el.appendChild(body);

  return { el, header, body, cfg };
}

// 创建 Body API
function createBodyAPI(bodyEl) {
  return {
    el: bodyEl,

    setText(text) {
      bodyEl.textContent = String(text ?? "");
      return this;
    },

    setHTML(html) {
      bodyEl.innerHTML = String(html ?? "");
      return this;
    },

    createEl(tagName, opts = {}) {
      const el = document.createElement(tagName);
      if (opts.className) {
        const classes = Array.isArray(opts.className)
          ? opts.className
          : String(opts.className).split(/\s+/);
        el.classList.add(...classes.filter(Boolean));
      }
      if (opts.text) el.textContent = opts.text;
      if (opts.attrs) {
        Object.entries(opts.attrs).forEach(([k, v]) => el.setAttribute(k, v));
      }
      bodyEl.appendChild(el);
      return el;
    },

    appendChild(child) {
      if (child instanceof Node) bodyEl.appendChild(child);
      return this;
    },

    clear() {
      bodyEl.innerHTML = "";
      return this;
    },
  };
}

// 创建 Header API
function createHeaderAPI(headerEl) {
  return {
    el: headerEl,

    setTitle(text) {
      const el = headerEl.querySelector(".ts-card__title");
      if (el) el.textContent = String(text ?? "");
      return this;
    },

    setMeta(text) {
      const el = headerEl.querySelector(".ts-card__meta");
      if (el) el.textContent = String(text ?? "");
      return this;
    },
  };
}

// ==================== 主卡片函数 ====================
function card(options = {}) {
  // 同步返回 API，异步加载样式
  const styleLoad = getStylePromise();

  const { el, header, body } = buildCardElement(options);

  const api = {
    el,
    header: createHeaderAPI(header),
    body: createBodyAPI(body),

    setTitle(text) {
      this.header.setTitle(text);
      return this;
    },

    setMeta(text) {
      this.header.setMeta(text);
      return this;
    },

    addClass(className) {
      if (className) {
        const classes = String(className).split(/\s+/).filter(Boolean);
        el.classList.add(...classes);
      }
      return this;
    },

    removeClass(className) {
      if (className) {
        const classes = String(className).split(/\s+/).filter(Boolean);
        el.classList.remove(...classes);
      }
      return this;
    },

    appendTo(container) {
      if (container) container.appendChild(this.el);
      return this;
    },
  };

  // 等待样式加载完成（如果需要）
  api.ready = styleLoad;

  return api;
}

// ==================== 布局函数 ====================
card.row = function (options = {}) {
  const { cards = [], preset, cols, gap } = options;

  const el = document.createElement("div");
  el.classList.add("ts-card-row");

  // 列模板
  if (cols && cols.length > 0) {
    el.style.gridTemplateColumns = cols.map((n) => `${n}fr`).join(" ");
  } else if (preset) {
    el.classList.add(`ts-card-row--${preset}`);
  }

  // 自定义间距
  if (gap) el.style.gap = gap;

  // 追加卡片
  cards.forEach((cardItem, i) => {
    const cardEl = cardItem.el ?? cardItem;
    if (preset === "2col-complex" && i === 1) {
      cardEl.classList.add("ts-card--span-2");
    }
    el.appendChild(cardEl);
  });

  return {
    el,
    appendTo(container) {
      if (container) container.appendChild(this.el);
      return this;
    },
  };
};

// 导出
module.exports = card;
});
