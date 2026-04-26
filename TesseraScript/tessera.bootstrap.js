;(function (global) {
  if (!global) {
    throw new Error("[Tessera] Global scope is unavailable.");
  }

  const BASE_ALIASES = {
    progressbar: "components/progressbar",
    card: "components/card",
    heatmap: "components/heatmap",
    example: "components/example",
    font: "core/font",
    pageStyle: "core/page-style",
    components: "index",
    "@ui": "index",
  };

  const existing = global.Tessera;
  if (existing && existing.__initialized) {
    if (typeof existing.alias === "function") {
      existing.alias(BASE_ALIASES);
    }
    return;
  }

  const modules = existing?.modules instanceof Map ? existing.modules : new Map();
  const cache = existing?.cache instanceof Map ? existing.cache : new Map();
  const aliases = existing?.aliases instanceof Map ? existing.aliases : new Map();
  const VERSION = "0.1.0";

  function fail(message) {
    throw new Error(`[Tessera] ${message}`);
  }

  function isRelative(specifier) {
    return specifier === "." || specifier === ".." || specifier.startsWith("./") || specifier.startsWith("../");
  }

  function normalizeId(value) {
    const source = String(value == null ? "" : value).trim().replace(/\\/g, "/");
    if (!source) {
      return "";
    }

    const parts = source.split("/");
    const normalized = [];

    for (const part of parts) {
      if (!part || part === ".") {
        continue;
      }

      if (part === "..") {
        if (!normalized.length) {
          fail(`Invalid module path: ${value}`);
        }
        normalized.pop();
        continue;
      }

      normalized.push(part);
    }

    return normalized.join("/");
  }

  function dirname(moduleId) {
    const normalized = normalizeId(moduleId);
    if (!normalized || !normalized.includes("/")) {
      return "";
    }
    return normalized.slice(0, normalized.lastIndexOf("/"));
  }

  function resolveRelative(specifier, from) {
    if (!from) {
      fail(`Cannot resolve relative module "${specifier}" without a parent module.`);
    }

    const baseDir = dirname(from);
    const baseParts = baseDir ? baseDir.split("/") : [];
    const specParts = String(specifier).replace(/\\/g, "/").split("/");

    for (const part of specParts) {
      if (!part || part === ".") {
        continue;
      }

      if (part === "..") {
        if (!baseParts.length) {
          fail(`Invalid relative module "${specifier}" from "${from}".`);
        }
        baseParts.pop();
        continue;
      }

      baseParts.push(part);
    }

    return normalizeId(baseParts.join("/"));
  }

  function resolve(specifier, from) {
    const raw = String(specifier == null ? "" : specifier).trim();
    if (!raw) {
      fail("Module specifier is required.");
    }

    const aliasTarget = aliases.get(raw);
    if (aliasTarget) {
      return resolve(aliasTarget, from);
    }

    if (isRelative(raw)) {
      return resolveRelative(raw, from);
    }

    return normalizeId(raw);
  }

  function register(id, factory) {
    const moduleId = normalizeId(id);
    if (!moduleId) {
      fail("Module id is required.");
    }
    if (typeof factory !== "function") {
      fail(`Module factory must be a function: ${moduleId}`);
    }

    modules.set(moduleId, factory);
    cache.delete(moduleId);
    return Tessera;
  }

  function define(id, factory) {
    if (typeof factory !== "function") {
      fail(`Module factory must be a function: ${normalizeId(id) || id}`);
    }

    return register(id, function (runtime) {
      factory(runtime.require, runtime.module, runtime.exports);
    });
  }

  function requireModule(specifier, from) {
    const moduleId = resolve(specifier, from);
    if (cache.has(moduleId)) {
      const cached = cache.get(moduleId);
      if (cached.loading) {
        fail(`Circular dependency detected: ${from || "<root>"} -> ${moduleId}`);
      }
      return cached.exports;
    }

    const factory = modules.get(moduleId);
    if (!factory) {
      fail(`Module not found: ${moduleId}`);
    }

    const module = {
      id: moduleId,
      exports: {},
      loaded: false,
      loading: true,
    };

    cache.set(moduleId, module);

    function localRequire(childSpecifier) {
      return requireModule(childSpecifier, moduleId);
    }

    try {
      factory({
        id: moduleId,
        require: localRequire,
        module,
        exports: module.exports,
      });
      module.loaded = true;
      module.loading = false;
      return module.exports;
    } catch (error) {
      cache.delete(moduleId);
      const reason = error instanceof Error ? error.message : String(error);
      fail(`Module execution failed: ${moduleId}\n${reason}`);
    }
  }

  function use(name) {
    return requireModule(name);
  }

  function alias(nameOrMap, target) {
    if (typeof nameOrMap === "string") {
      const key = String(nameOrMap).trim();
      const value = String(target == null ? "" : target).trim();
      if (!key || !value) {
        fail("Alias name and target are required.");
      }
      aliases.set(key, value);
      return Tessera;
    }

    if (!nameOrMap || typeof nameOrMap !== "object") {
      fail("Alias map must be an object.");
    }

    Object.entries(nameOrMap).forEach(([key, value]) => {
      if (value == null || String(value).trim() === "") {
        return;
      }
      aliases.set(String(key).trim(), String(value).trim());
    });

    return Tessera;
  }

  function has(id) {
    const moduleId = resolve(id);
    return modules.has(moduleId);
  }

  const Tessera = existing || {};

  Object.assign(Tessera, {
    version: VERSION,
    define,
    register,
    require: requireModule,
    use,
    resolve,
    alias,
    has,
    modules,
    cache,
    aliases,
    __initialized: true,
  });

  global.Tessera = Tessera;

  alias(BASE_ALIASES);
})(typeof globalThis !== "undefined" ? globalThis : window);
