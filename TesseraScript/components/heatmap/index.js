Tessera.define("components/heatmap", function (require, module, exports) {
  const dom = require("../core/dom");
  const createCSSController = require("../core/css");
  const css = createCSSController();
  let stylePromise = null;

  function ensureStyles() {
    if (!stylePromise) {
      stylePromise = css.ensure({
        id: "components-heatmap",
        path: "TesseraScript/components/heatmap/style.css",
      }).catch((error) => {
        stylePromise = null;
        console.warn("[Tessera] Failed to load heatmap styles.", error);
      });
    }

    return stylePromise;
  }

  function normalizeData(data) {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((value) => {
      const numeric = Number(value || 0);
      return Number.isFinite(numeric) ? numeric : 0;
    });
  }

  function levelClass(value, max) {
    if (max <= 0 || value <= 0) return "is-level-0";
    const ratio = value / max;
    if (ratio >= 0.75) return "is-level-4";
    if (ratio >= 0.5) return "is-level-3";
    if (ratio >= 0.25) return "is-level-2";
    return "is-level-1";
  }

  function heatmap(options = {}) {
    ensureStyles();

    const data = normalizeData(options.data || []);
    const max = data.length ? Math.max(...data) : 0;
    const columns = Number(options.columns) > 0 ? Number(options.columns) : 7;

    const cells = data.map((value, index) =>
      dom.createElement("div", {
        className: ["ts-heatmap__cell", levelClass(value, max)],
        attrs: {
          title: `${options.labelPrefix || "Value"} ${index + 1}: ${value}`,
        },
        text: options.showValue ? String(value) : "",
      })
    );

    return dom.createElement("section", {
      className: "ts-heatmap",
      children: [
        options.title
          ? dom.createElement("div", {
              className: "ts-heatmap__title",
              text: options.title,
            })
          : null,
        dom.createElement("div", {
          className: "ts-heatmap__grid",
          style: {
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          },
          children: cells,
        }),
      ],
    });
  }

  module.exports = heatmap;
  module.exports.heatmap = heatmap;
});
