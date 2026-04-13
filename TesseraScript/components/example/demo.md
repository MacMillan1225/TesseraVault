# example demo

`components/example` 是新组件模板演示文件。这里的示例主要用于说明模板已经包含哪些开发时常用的能力。

## 1. 最小加载

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/example/index");

const example = Tessera.use("example");

dv.container.appendChild(
  example({
    eyebrow: "Demo",
    title: "Example Component",
    text: "If you can see styled content here, the scaffold works.",
    content: "This is the default content slot.",
  })
);
```

## 2. 覆盖单实例内容

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/example/index");

const example = Tessera.use("example");

dv.container.appendChild(
  example({
    eyebrow: "Scaffold",
    title: "My New Component",
    text: "Duplicate this directory and rename all example identifiers.",
    content: "Then replace the structure with your real component DOM.",
  })
);
```

## 3. 日间和夜间颜色配置

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/example/index");

const example = Tessera.use("example");

dv.container.appendChild(
  example({
    eyebrow: "Theme",
    title: "Light / Dark Ready",
    text: "This template already responds to body.theme-light and body.theme-dark.",
    colors: {
      light: {
        background: "rgba(239, 246, 255, 0.96)",
        border: "rgba(96, 165, 250, 0.2)",
        accent: "rgba(59, 130, 246, 0.9)",
      },
      dark: {
        background: "rgba(15, 23, 42, 0.82)",
        border: "rgba(96, 165, 250, 0.28)",
        accent: "rgba(147, 197, 253, 0.95)",
      },
    },
    content: "Replace these theme colors with values that fit your real component.",
  })
);
```

## 4. 单实例内联样式

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/example/index");

const example = Tessera.use("example");

dv.container.appendChild(
  example({
    eyebrow: "Inline Style",
    title: "Per Instance Override",
    text: "Use styles.* when only this one instance should look different.",
    styles: {
      root: {
        borderRadius: "22px",
        transform: "translateY(0)",
      },
      title: {
        fontSize: "20px",
      },
    },
    content: "Shared structure stays in style.css, instance differences stay inline.",
  })
);
```

## 5. 访问子节点

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/example/index");

const example = Tessera.use("example");

const node = example({
  eyebrow: "Parts",
  title: "Accessible Subnodes",
  text: "The returned element exposes key internal nodes on node.parts.",
  content: "You can continue adjusting it after creation.",
});

node.parts.title.textContent = "Title Updated After Creation";
node.parts.body.style.gap = "14px";

dv.container.appendChild(node);
```

## 6. 配置文件加载

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/example/index");

const example = Tessera.use("example");

await example.loadConfig();

dv.container.appendChild(
  example({
    title: "Config Loaded",
    content: "This instance merges runtime options on top of config.json defaults.",
  })
);
```
