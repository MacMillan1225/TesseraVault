import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const rootDir = process.cwd();
const tesseraDir = path.join(rootDir, "TesseraScript");

async function main() {
  const files = await collectFiles(tesseraDir);
  const jsFiles = files.filter((file) => file.endsWith(".js")).sort();
  const jsonFiles = files.filter((file) => file.endsWith(".json")).sort();
  const cssFiles = files.filter((file) => file.endsWith(".css")).sort();

  if (!jsFiles.length) {
    throw new Error("No JavaScript files found in TesseraScript/.");
  }

  console.log(`Checking ${jsFiles.length} JS, ${jsonFiles.length} JSON, ${cssFiles.length} CSS files.`);

  for (const file of jsFiles) {
    const code = await fs.readFile(file, "utf8");
    new vm.Script(code, { filename: relative(file) });
  }

  for (const file of jsonFiles) {
    const text = await fs.readFile(file, "utf8");
    JSON.parse(text);
  }

  for (const file of cssFiles) {
    const text = await fs.readFile(file, "utf8");
    if (!text.trim()) {
      console.warn(`Warning: CSS file is empty: ${relative(file)}`);
    }
  }

  installRuntimeStubs(rootDir);

  const bootstrapFile = path.join(tesseraDir, "tessera.bootstrap.js");
  await executeFile(bootstrapFile);

  for (const file of jsFiles) {
    if (file === bootstrapFile) {
      continue;
    }
    await executeFile(file);
  }

  smokeTestRuntime();
  await smokeTestModules();

  console.log("TesseraScript validation passed.");
}

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

async function executeFile(file) {
  const code = await fs.readFile(file, "utf8");
  vm.runInThisContext(code, { filename: relative(file) });
}

function relative(file) {
  return path.relative(rootDir, file).replace(/\\/g, "/");
}

function installRuntimeStubs(repoRoot) {
  class FakeNode {
    constructor() {
      this.parentNode = null;
      this.parentElement = null;
      this.childNodes = [];
      this.ownerDocument = null;
    }

    get isConnected() {
      let current = this;
      while (current) {
        if (current.nodeType === 9) {
          return true;
        }
        current = current.parentNode;
      }
      return false;
    }

    appendChild(child) {
      if (child == null) {
        return child;
      }

      if (child.nodeType === 11) {
        const nodes = [...child.childNodes];
        nodes.forEach((node) => this.appendChild(node));
        child.childNodes = [];
        return child;
      }

      if (child.parentNode) {
        child.parentNode.removeChild(child);
      }

      this.childNodes.push(child);
      child.parentNode = this;
      child.parentElement = this instanceof FakeElement ? this : null;
      if (!child.ownerDocument) {
        child.ownerDocument = this.ownerDocument || null;
      }

      return child;
    }

    removeChild(child) {
      const index = this.childNodes.indexOf(child);
      if (index >= 0) {
        this.childNodes.splice(index, 1);
        child.parentNode = null;
        child.parentElement = null;
      }
      return child;
    }

    remove() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    }

    get children() {
      return this.childNodes.filter((child) => child instanceof FakeElement);
    }
  }

  class FakeTextNode extends FakeNode {
    constructor(text) {
      super();
      this.nodeType = 3;
      this.textContent = String(text);
    }
  }

  class FakeClassList {
    constructor(element) {
      this.element = element;
      this.set = new Set();
    }

    add(...names) {
      names.filter(Boolean).forEach((name) => this.set.add(String(name)));
    }

    remove(...names) {
      names.forEach((name) => this.set.delete(String(name)));
    }

    contains(name) {
      return this.set.has(String(name));
    }

    toggle(name, force) {
      const normalized = String(name);
      if (force === true) {
        this.set.add(normalized);
        return true;
      }
      if (force === false) {
        this.set.delete(normalized);
        return false;
      }
      if (this.set.has(normalized)) {
        this.set.delete(normalized);
        return false;
      }
      this.set.add(normalized);
      return true;
    }

    toString() {
      return Array.from(this.set).join(" ");
    }
  }

  class FakeStyle {
    constructor() {
      this.values = {};
    }

    setProperty(key, value) {
      this.values[key] = String(value);
    }
  }

  class FakeElement extends FakeNode {
    constructor(tagName, ownerDocument) {
      super();
      this.nodeType = 1;
      this.tagName = String(tagName).toUpperCase();
      this.ownerDocument = ownerDocument;
      this.attributes = new Map();
      this.dataset = {};
      this.style = new FakeStyle();
      this.classList = new FakeClassList(this);
      this.eventListeners = new Map();
      this.textContent = "";
      this.innerHTML = "";
      this.id = "";
      this.clientWidth = 960;
    }

    setAttribute(key, value) {
      const normalized = String(key);
      const text = String(value);
      this.attributes.set(normalized, text);
      if (normalized === "id") {
        this.id = text;
      }
      if (normalized === "class") {
        this.classList = new FakeClassList(this);
        text.split(/\s+/).filter(Boolean).forEach((name) => this.classList.add(name));
      }
    }

    getAttribute(key) {
      return this.attributes.get(String(key)) ?? null;
    }

    addEventListener(type, handler) {
      const list = this.eventListeners.get(type) || [];
      list.push(handler);
      this.eventListeners.set(type, list);
    }

    dispatchEvent(event) {
      const list = this.eventListeners.get(event.type) || [];
      list.forEach((handler) => handler.call(this, event));
    }

    closest(selector) {
      let current = this;
      while (current) {
        if (matchesSelector(current, selector)) {
          return current;
        }
        current = current.parentElement;
      }
      return null;
    }

    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        right: 120,
        bottom: 24,
        width: 120,
        height: 24,
      };
    }
  }

  class FakeDocumentFragment extends FakeNode {
    constructor(ownerDocument) {
      super();
      this.nodeType = 11;
      this.ownerDocument = ownerDocument;
    }
  }

  class FakeDocument extends FakeNode {
    constructor() {
      super();
      this.nodeType = 9;
      this.ownerDocument = this;
      this.documentElement = new FakeElement("html", this);
      this.head = new FakeElement("head", this);
      this.body = new FakeElement("body", this);
      this.documentElement.appendChild(this.head);
      this.documentElement.appendChild(this.body);
      this.appendChild(this.documentElement);
    }

    createElement(tagName) {
      return new FakeElement(tagName, this);
    }

    createTextNode(text) {
      return new FakeTextNode(text);
    }

    createDocumentFragment() {
      return new FakeDocumentFragment(this);
    }

    getElementById(id) {
      return walkTree(this).find((node) => node instanceof FakeElement && node.id === id) || null;
    }
  }

  function matchesSelector(element, selector) {
    if (!(element instanceof FakeElement)) {
      return false;
    }

    if (selector.startsWith(".")) {
      return element.classList.contains(selector.slice(1));
    }

    if (selector.startsWith("[") && selector.endsWith("]")) {
      const attr = selector.slice(1, -1).trim();
      return element.attributes.has(attr);
    }

    return element.tagName.toLowerCase() === selector.toLowerCase();
  }

  function walkTree(root) {
    const result = [];
    const queue = [root];
    while (queue.length) {
      const node = queue.shift();
      result.push(node);
      if (node.childNodes?.length) {
        queue.push(...node.childNodes);
      }
    }
    return result;
  }

  const document = new FakeDocument();
  document.body.classList.add("theme-light");

  const vault = {
    getAbstractFileByPath(filePath) {
      const normalized = normalizeVaultPath(filePath);
      const absolute = path.join(repoRoot, normalized);
      return { path: normalized, absolute };
    },
    async cachedRead(file) {
      return fs.readFile(file.absolute, "utf8");
    },
    async read(file) {
      return fs.readFile(file.absolute, "utf8");
    },
    getResourcePath(file) {
      return `app://local/${file.path}`;
    },
  };

  globalThis.Node = FakeNode;
  globalThis.document = document;
  globalThis.window = globalThis;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { userAgent: "github-actions" },
  });
  globalThis.app = { vault };
  globalThis.requestAnimationFrame = (callback) => {
    callback();
    return 1;
  };
  globalThis.cancelAnimationFrame = () => {};
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  globalThis.MutationObserver = class {
    observe() {}
    disconnect() {}
  };
}

function normalizeVaultPath(filePath) {
  return String(filePath || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function smokeTestRuntime() {
  if (!globalThis.Tessera || typeof globalThis.Tessera.use !== "function") {
    throw new Error("Tessera bootstrap did not initialize the runtime.");
  }

  const requiredModules = [
    "index",
    "components/card",
    "components/progressbar",
    "components/heatmap",
    "components/example",
    "core/dom",
    "core/file",
    "core/config",
    "core/css",
    "core/font",
    "core/page-style",
  ];

  for (const moduleId of requiredModules) {
    if (!globalThis.Tessera.has(moduleId)) {
      throw new Error(`Expected module to be registered: ${moduleId}`);
    }
  }
}

async function smokeTestModules() {
  const api = globalThis.Tessera.use("index");
  if (!api || typeof api !== "object") {
    throw new Error("Index module did not export a component map.");
  }

  const card = globalThis.Tessera.use("components/card");
  const progressbar = globalThis.Tessera.use("components/progressbar");
  const heatmap = globalThis.Tessera.use("components/heatmap");
  const example = globalThis.Tessera.use("components/example");
  const createCSSController = globalThis.Tessera.use("core/css");
  const createConfigController = globalThis.Tessera.use("core/config");
  const fontModule = globalThis.Tessera.use("core/font");
  const pageStyleModule = globalThis.Tessera.use("core/page-style");

  const cardNode = card({ title: "Card", value: 1, content: "body" });
  const progressNode = progressbar({ value: 64, min: 0, max: 100 });
  const exampleNode = example({ content: "example content" });
  const heatmapNode = heatmap({
    data: {
      "2026-01-01": { value: 1, title: "ok" },
      "2026-01-02": { value: 3, title: "ok" },
    },
  });

  if (!cardNode || !progressNode || !exampleNode || !heatmapNode) {
    throw new Error("One or more components failed to create DOM output.");
  }

  await heatmapNode.refresh();
  heatmapNode.destroy();

  const css = createCSSController();
  const cssRecord = await css.ensure({ id: "smoke-style", text: ".smoke { color: red; }" });
  if (!cssRecord || !css.has("smoke-style")) {
    throw new Error("CSS controller smoke test failed.");
  }

  const config = createConfigController();
  const scope = config.createScope({
    path: "TesseraScript/components/card/config.json",
    fallback: { title: "Fallback" },
  });
  await scope.load({ silent: false });
  const merged = scope.merge({ title: "Override" });
  if (merged.title !== "Override") {
    throw new Error("Config controller merge smoke test failed.");
  }

  const fonts = fontModule.createFontController();
  const fontState = typeof fonts.listFonts === "function" ? fonts.listFonts() : null;
  if (!Array.isArray(fontState)) {
    throw new Error("Font controller did not expose listFonts().");
  }

  const host = document.createElement("div");
  host.classList.add("markdown-reading-view");
  const container = document.createElement("div");
  host.appendChild(container);
  document.body.appendChild(host);

  const pageStyle = pageStyleModule.createPageStyleController();
  await pageStyle.applyWidth("720px", { container, id: "smoke-width" });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
