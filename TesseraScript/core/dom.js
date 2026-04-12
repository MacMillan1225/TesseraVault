Tessera.define("core/dom", function (require, module, exports) {
  function assignClasses(element, className) {
    if (!className) {
      return element;
    }

    const classes = Array.isArray(className)
      ? className.flatMap((item) => String(item || "").split(/\s+/))
      : String(className).split(/\s+/);

    classes.filter(Boolean).forEach((name) => element.classList.add(name));
    return element;
  }

  function assignStyles(element, styles) {
    if (!styles || typeof styles !== "object") {
      return element;
    }

    Object.entries(styles).forEach(([key, value]) => {
      if (value == null) {
        return;
      }

      if (key.startsWith("--") || key.includes("-")) {
        element.style.setProperty(key, String(value));
        return;
      }

      element.style[key] = value;
    });

    return element;
  }

  function assignAttributes(element, attrs) {
    if (!attrs || typeof attrs !== "object") {
      return element;
    }

    Object.entries(attrs).forEach(([key, value]) => {
      if (value == null) {
        return;
      }

      if (key === "dataset" && value && typeof value === "object") {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          if (dataValue != null) {
            element.dataset[dataKey] = String(dataValue);
          }
        });
        return;
      }

      if (key in element && key !== "style") {
        element[key] = value;
        return;
      }

      element.setAttribute(key, String(value));
    });

    return element;
  }

  function appendChildren(element, children) {
    const list = Array.isArray(children) ? children : [children];

    list.flat(Infinity).forEach((child) => {
      if (child == null || child === false) {
        return;
      }

      if (child instanceof Node) {
        element.appendChild(child);
        return;
      }

      element.appendChild(document.createTextNode(String(child)));
    });

    return element;
  }

  function createElement(tagName, options = {}) {
    const element = document.createElement(tagName);

    assignClasses(element, options.className);
    assignAttributes(element, options.attrs);
    assignStyles(element, options.style);

    if (options.text != null) {
      element.textContent = String(options.text);
    }

    if (options.html != null) {
      element.innerHTML = String(options.html);
    }

    if (options.children != null) {
      appendChildren(element, options.children);
    }

    return element;
  }

  function fragment(children) {
    const node = document.createDocumentFragment();
    appendChildren(node, children);
    return node;
  }

  module.exports = {
    createElement,
    el: createElement,
    fragment,
    appendChildren,
    assignClasses,
    assignAttributes,
    assignStyles,
  };
});
