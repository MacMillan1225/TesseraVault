Tessera.define("components/example", function (require, module, exports) {
  const dom = require("../core/dom");
  const createCSSController = require("../core/css");
  const createConfigController = require("../core/config");

  const css = createCSSController();
  const config = createConfigController();

  let stylePromise = null;

  const colorKeys = [
    "background",
    "border",
    "shadow",
    "accent",
    "title",
    "text",
    "muted",
  ];

  const defaultExampleColors = {
    light: {
      background: "rgba(248, 250, 252, 0.96)",
      border: "rgba(120, 140, 160, 0.2)",
      shadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
      accent: "var(--interactive-accent)",
      title: "var(--text-normal)",
      text: "var(--text-normal)",
      muted: "var(--text-muted)",
    },
    dark: {
      background: "rgba(30, 41, 59, 0.72)",
      border: "rgba(148, 163, 184, 0.18)",
      shadow: "0 16px 36px rgba(2, 6, 23, 0.28)",
      accent: "var(--interactive-accent)",
      title: "var(--text-normal)",
      text: "var(--text-normal)",
      muted: "var(--text-muted)",
    },
  };

  const defaultExampleConfig = {
    eyebrow: "Example Component",
    title: "Hello Tessera",
    text: "Use this directory as the starting point for a new component.",
    emptyText: "No content",
    flags: {
      showEyebrow: true,
      showTitle: true,
      showBody: true,
    },
    layout: {
      maxWidth: "100%",
      padding: "16px",
      radius: "14px",
      gap: "10px",
    },
    colors: defaultExampleColors,
    styles: {
      root: null,
      eyebrow: null,
      title: null,
      body: null,
      content: null,
      empty: null,
    },
  };

  const exampleConfig = config.createScope({
    path: "TesseraScript/components/example/config.json",
    fallback: defaultExampleConfig,
  });

  function ensureStyles() {
    if (!stylePromise) {
      stylePromise = css
        .ensure({
          id: "components-example",
          path: "TesseraScript/components/example/style.css",
        })
        .catch((error) => {
          stylePromise = null;
          console.warn("[Tessera] Failed to load example styles.", error);
        });
    }

    return stylePromise;
  }

  function loadExampleConfig(options = {}) {
    return exampleConfig.load(options).catch((error) => {
      console.warn("[Tessera] Failed to load example config.", error);
      return exampleConfig.get();
    });
  }

  function mergeStyles(...styles) {
    return styles.reduce((result, style) => {
      if (!style || typeof style !== "object") {
        return result;
      }

      return Object.assign(result, style);
    }, {});
  }

  function normalizeChildren(content) {
    if (content == null) {
      return [];
    }

    return Array.isArray(content) ? content : [content];
  }

  function pickSharedColors(colors = {}) {
    return colorKeys.reduce((result, key) => {
      if (colors[key] !== undefined) {
        result[key] = colors[key];
      }

      return result;
    }, {});
  }

  function resolveThemeColors(colors = {}) {
    const sharedColors = pickSharedColors(colors);

    return {
      light: mergeStyles(defaultExampleColors.light, sharedColors, colors.light),
      dark: mergeStyles(defaultExampleColors.dark, sharedColors, colors.dark),
    };
  }

  function example(options = {}) {
    ensureStyles();
    loadExampleConfig();

    const resolved = exampleConfig.merge(options);
    const flags = resolved.flags || {};
    const layout = resolved.layout || {};
    const colors = resolveThemeColors(resolved.colors || {});
    const styles = resolved.styles || {};

    const children = normalizeChildren(
      resolved.content !== undefined ? resolved.content : resolved.children
    );

    const parts = {};

    parts.eyebrow =
      flags.showEyebrow !== false && resolved.eyebrow
        ? dom.createElement("div", {
            className: "ts-example__eyebrow",
            style: styles.eyebrow,
            text: resolved.eyebrow,
          })
        : null;

    parts.title =
      flags.showTitle !== false && resolved.title
        ? dom.createElement("div", {
            className: "ts-example__title",
            style: styles.title,
            text: resolved.title,
          })
        : null;

    parts.content = children.length
      ? dom.createElement("div", {
          className: "ts-example__content",
          style: styles.content,
          children,
        })
      : dom.createElement("div", {
          className: "ts-example__empty",
          style: styles.empty,
          text: resolved.emptyText,
        });

    parts.body =
      flags.showBody !== false
        ? dom.createElement("div", {
            className: "ts-example__body",
            style: styles.body,
            children: [
              resolved.text
                ? dom.createElement("div", {
                    className: "ts-example__text",
                    text: resolved.text,
                  })
                : null,
              parts.content,
            ],
          })
        : null;

    const root = dom.createElement("section", {
      className: ["ts-example", resolved.className],
      style: mergeStyles(
        {
          maxWidth: layout.maxWidth,
          "--ts-example-padding": layout.padding,
          "--ts-example-radius": layout.radius,
          "--ts-example-gap": layout.gap,
          "--ts-example-background-light": colors.light.background,
          "--ts-example-background-dark": colors.dark.background,
          "--ts-example-border-light": colors.light.border,
          "--ts-example-border-dark": colors.dark.border,
          "--ts-example-shadow-light": colors.light.shadow,
          "--ts-example-shadow-dark": colors.dark.shadow,
          "--ts-example-accent-light": colors.light.accent,
          "--ts-example-accent-dark": colors.dark.accent,
          "--ts-example-title-light": colors.light.title,
          "--ts-example-title-dark": colors.dark.title,
          "--ts-example-text-light": colors.light.text,
          "--ts-example-text-dark": colors.dark.text,
          "--ts-example-muted-light": colors.light.muted,
          "--ts-example-muted-dark": colors.dark.muted,
        },
        styles.root
      ),
      children: [parts.eyebrow, parts.title, parts.body],
    });

    root.parts = parts;
    return root;
  }

  module.exports = example;
  module.exports.example = example;
  module.exports.loadConfig = loadExampleConfig;
  module.exports.getDefaultConfig = exampleConfig.get;
});
