Tessera.define("components/progress", function (require, module, exports) {
  const dom = require("../core/dom");

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function progress(options = {}) {
    const value = Number(options.value || 0);
    const ratio = clamp(Number.isFinite(value) ? value : 0, 0, 1);
    const percent = Math.round(ratio * 100);
    const label = options.label || `${percent}%`;

    const fill = dom.createElement("div", {
      className: "ts-progress__fill",
      style: {
        width: `${percent}%`,
      },
    });

    const bar = dom.createElement("div", {
      className: "ts-progress__bar",
      children: fill,
    });

    return dom.createElement("div", {
      className: "ts-progress",
      attrs: {
        role: "progressbar",
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": percent,
      },
      children: [
        dom.createElement("div", {
          className: "ts-progress__meta",
          children: [
            dom.createElement("span", { className: "ts-progress__label", text: label }),
            dom.createElement("span", { className: "ts-progress__value", text: `${percent}%` }),
          ],
        }),
        bar,
      ],
    });
  }

  module.exports = progress;
  module.exports.progress = progress;
});
