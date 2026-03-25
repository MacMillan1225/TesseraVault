Tessera.define("components/card", function (require, module, exports) {
  const dom = require("../core/dom");

  function normalizeChildren(content) {
    if (content == null) {
      return [];
    }
    return Array.isArray(content) ? content : [content];
  }

  function card(options = {}) {
    const headerChildren = [];

    if (options.title) {
      headerChildren.push(
        dom.createElement("div", {
          className: "ts-card__title",
          text: options.title,
        })
      );
    }

    if (options.meta) {
      headerChildren.push(
        dom.createElement("div", {
          className: "ts-card__meta",
          text: options.meta,
        })
      );
    }

    const bodyChildren = [];

    if (options.value != null) {
      bodyChildren.push(
        dom.createElement("div", {
          className: "ts-card__value",
          text: String(options.value),
        })
      );
    }

    bodyChildren.push(...normalizeChildren(options.content || options.children));

    return dom.createElement("article", {
      className: ["ts-card", options.className],
      children: [
        headerChildren.length
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
                text: options.emptyText || "No content",
              }),
        }),
      ],
    });
  }

  module.exports = card;
  module.exports.card = card;
});
