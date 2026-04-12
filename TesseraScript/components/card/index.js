Tessera.define("components/card", function (require, module, exports) {
  const dom = require("../core/dom");
  const createCSSController = require("../core/css");
  const createConfigController = require("../core/config");

  const css = createCSSController();
  const config = createConfigController();

  let stylePromise = null;

  const defaultCardConfig = {
    title: "",
    meta: "",
    value: null,
    emptyText: "No content",
    flags: {
      showHeader: true,
      showTitle: true,
      showMeta: true,
      showValue: true,
    },
    layout: {
      maxWidth: "100%",
      padding: "16px",
      radius: "16px",
      gap: "14px",
      bodyGap: "12px",
    },
    colors: {
      background:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(245, 248, 252, 0.9))",
      border: "rgba(120, 140, 160, 0.18)",
      shadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
      value: "var(--text-accent, var(--text-normal))",
    },
  };

  const cardConfig = config.createScope({
    path: "TesseraScript/components/card/config.json",
    fallback: defaultCardConfig,
  });

  function ensureStyles() {
    if (!stylePromise) {
      stylePromise = css
        .ensure({
          id: "components-card",
          path: "TesseraScript/components/card/style.css",
        })
        .catch((error) => {
          stylePromise = null;
          console.warn("[Tessera] Failed to load card styles.", error);
        });
    }

    return stylePromise;
  }

  function normalizeChildren(content) {
    if (content == null) {
      return [];
    }

    return Array.isArray(content) ? content : [content];
  }

  function loadCardConfig(options = {}) {
    return cardConfig.load(options).catch((error) => {
      console.warn("[Tessera] Failed to load card config.", error);
      return cardConfig.get();
    });
  }

  function card(options = {}) {
    ensureStyles();
    loadCardConfig();

    const resolved = cardConfig.merge(options);

    const flags = resolved.flags || {};
    const layout = resolved.layout || {};
    const colors = resolved.colors || {};

    const headerChildren = [];
    const titleText = resolved.title;
    const metaText = resolved.meta;
    const valueContent = resolved.value;

    if (flags.showTitle !== false && titleText) {
      headerChildren.push(
        dom.createElement("div", {
          className: "ts-card__title",
          text: titleText,
        })
      );
    }

    if (flags.showMeta !== false && metaText) {
      headerChildren.push(
        dom.createElement("div", {
          className: "ts-card__meta",
          text: metaText,
        })
      );
    }

    const bodyChildren = [];

    if (flags.showValue !== false && valueContent != null) {
      bodyChildren.push(
        dom.createElement("div", {
          className: "ts-card__value",
          text: String(valueContent),
        })
      );
    }

    bodyChildren.push(
      ...normalizeChildren(
        resolved.content !== undefined ? resolved.content : resolved.children
      )
    );

    return dom.createElement("article", {
      className: ["ts-card", resolved.className],
      style: {
        maxWidth: layout.maxWidth,
        "--ts-card-padding": layout.padding,
        "--ts-card-radius": layout.radius,
        "--ts-card-gap": layout.gap,
        "--ts-card-body-gap": layout.bodyGap,
        "--ts-card-background": colors.background,
        "--ts-card-border": colors.border,
        "--ts-card-shadow": colors.shadow,
        "--ts-card-value-color": colors.value,
      },
      children: [
        flags.showHeader !== false && headerChildren.length
          ? dom.createElement("header", {
              className: "ts-card__header",
              children: headerChildren,
            })
          : null,

        dom.createElement("section", {
          className: "ts-card__body",
          children: bodyChildren.length
            ? bodyChildren
            : dom.createElement("div", {
                className: "ts-card__empty",
                text: resolved.emptyText,
              }),
        }),
      ],
    });
  }

  module.exports = card;
  module.exports.card = card;
  module.exports.loadConfig = loadCardConfig;
  module.exports.getDefaultConfig = cardConfig.get;
});