Tessera.define("components/example", function (require, module, exports) {
  const dom = require("../core/dom");
  const createCSSController = require("../core/css");
  const css = createCSSController();
  let stylePromise = null;

  function ensureStyles() {
    if (!stylePromise) {
      stylePromise = css.ensure({
        id: "components-example",
        path: "TesseraScript/components/example/style.css",
      }).catch((error) => {
        stylePromise = null;
        console.warn("[Tessera] Failed to load example styles.", error);
      });
    }

    return stylePromise;
  }

  function example(options = {}) {
    ensureStyles();

    return dom.createElement("section", {
      className: ["ts-example", options.className],
      children: [
        dom.createElement("div", {
          className: "ts-example__eyebrow",
          text: options.eyebrow || "Example Component",
        }),
        dom.createElement("div", {
          className: "ts-example__title",
          text: options.title || "Hello Tessera",
        }),
        dom.createElement("div", {
          className: "ts-example__body",
          text: options.text || "Use this directory as the starting point for a new component.",
        }),
      ],
    });
  }

  module.exports = example;
  module.exports.example = example;
});
