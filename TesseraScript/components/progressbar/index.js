Tessera.define("components/progressbar", function (require, module, exports) {
  const dom = require("../core/dom");
  const createCSSController = require("../core/css");
  const css = createCSSController();
  let stylePromise = null;

  function ensureStyles() {
    if (!stylePromise) {
      stylePromise = css.ensure({
        id: "components-progressbar",
        path: "TesseraScript/components/progressbar/style.css",
      }).catch((error) => {
        stylePromise = null;
        console.warn("[Tessera] Failed to load progressbar styles.", error);
      });
    }

    return stylePromise;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function progressbar(options = {}) {
    ensureStyles();

    const value = Number(options.value || 0);
    const ratio = clamp(Number.isFinite(value) ? value : 0, 0, 1);
    const percent = Math.round(ratio * 100);
    const label = options.label || `${percent}%`;

    const fill = dom.createElement("div", {
      className: "ts-progressbar__fill",
      style: {
        width: `${percent}%`,
      },
    });

    const bar = dom.createElement("div", {
      className: "ts-progressbar__bar",
      children: fill,
    });

    return dom.createElement("div", {
      className: "ts-progressbar",
      attrs: {
        role: "progressbarbar",
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": percent,
      },
      children: [
        dom.createElement("div", {
          className: "ts-progressbar__meta",
          children: [
            dom.createElement("span", { className: "ts-progressbar__label", text: label }),
            dom.createElement("span", { className: "ts-progressbar__value", text: `${percent}%` }),
          ],
        }),
        bar,
      ],
    });
  }

  module.exports = progressbar;
  module.exports.progressbar = progressbar;
});
