Tessera.define("core/config", function (require, module, exports) {
  const createFileController = require("./file");

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  function cloneValue(value) {
    if (Array.isArray(value)) {
      return value.map(cloneValue);
    }

    if (isPlainObject(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, cloneValue(item)])
      );
    }

    return value;
  }

  function mergeConfig(baseConfig, overrideConfig) {
    if (overrideConfig == null) {
      return cloneValue(baseConfig);
    }

    if (baseConfig == null) {
      return cloneValue(overrideConfig);
    }

    if (Array.isArray(baseConfig) || Array.isArray(overrideConfig)) {
      return cloneValue(overrideConfig);
    }

    if (!isPlainObject(baseConfig) || !isPlainObject(overrideConfig)) {
      return cloneValue(overrideConfig);
    }

    const merged = cloneValue(baseConfig);

    Object.entries(overrideConfig).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }

      merged[key] = key in merged ? mergeConfig(merged[key], value) : cloneValue(value);
    });

    return merged;
  }

  function createConfigController(context = {}) {
    const file = createFileController(context);
    const cache = new Map();

    function normalizePath(path) {
      return file.normalizePath(path);
    }

    function createEntry(path, fallback) {
      const normalizedPath = normalizePath(path);
      if (!normalizedPath) {
        throw new Error("[config] path 不能为空。");
      }

      const existing = cache.get(normalizedPath);
      if (existing) {
        if (fallback !== undefined) {
          existing.fallback = mergeConfig(existing.fallback, fallback);
          if (!existing.loaded) {
            existing.value = cloneValue(existing.fallback);
          }
        }
        return existing;
      }

      const initialFallback = cloneValue(fallback || {});
      const entry = {
        path: normalizedPath,
        fallback: initialFallback,
        value: cloneValue(initialFallback),
        loaded: false,
        loading: null,
        error: null,
      };

      cache.set(normalizedPath, entry);
      return entry;
    }

    async function load(path, options = {}) {
      const entry = createEntry(path, options.fallback);

      if (entry.loaded && options.force !== true) {
        return cloneValue(entry.value);
      }

      if (entry.loading && options.force !== true) {
        return entry.loading;
      }

      entry.loading = file
        .readJson(entry.path, { cached: options.cached })
        .then((json) => {
          entry.value = mergeConfig(entry.fallback, json);
          entry.loaded = true;
          entry.error = null;
          return cloneValue(entry.value);
        })
        .catch((error) => {
          entry.loaded = false;
          entry.error = error;

          if (options.silent !== false) {
            return cloneValue(entry.value);
          }

          throw error;
        })
        .finally(() => {
          entry.loading = null;
        });

      return entry.loading;
    }

    function get(path, options = {}) {
      const entry = createEntry(path, options.fallback);
      return cloneValue(entry.value);
    }

    function resolve(path, overrides = {}, options = {}) {
      const current = get(path, options);
      return mergeConfig(current, overrides);
    }

    function createScope(scopeOptions = {}) {
      const scopePath = normalizePath(scopeOptions.path);
      const scopeFallback = cloneValue(scopeOptions.fallback || {});

      if (!scopePath) {
        throw new Error("[config] scope.path 不能为空。");
      }

      createEntry(scopePath, scopeFallback);

      return {
        path: scopePath,
        load(loadOptions = {}) {
          return load(scopePath, {
            ...loadOptions,
            fallback: scopeFallback,
          });
        },
        get() {
          return get(scopePath, { fallback: scopeFallback });
        },
        merge(overrides = {}) {
          return resolve(scopePath, overrides, { fallback: scopeFallback });
        },
      };
    }

    return {
      normalizePath,
      clone: cloneValue,
      merge: mergeConfig,
      get,
      load,
      resolve,
      createScope,
      cache,
    };
  }

  module.exports = createConfigController;
  module.exports.createConfigController = createConfigController;
  module.exports.mergeConfig = mergeConfig;
  module.exports.cloneConfig = cloneValue;
});
