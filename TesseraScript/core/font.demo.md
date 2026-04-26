# core/font demo

## 1. 加载方式

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/font");

const font = Tessera.use("font");
await font.ensureDefaults();

dv.paragraph("字体默认别名已注入，可直接使用 var(--ts-font-*)。");
```

## 2. 查看默认别名

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/font");

const font = Tessera.use("font");
await font.ensureDefaults();

const pre = document.createElement("pre");
pre.textContent = JSON.stringify(font.listAliases(), null, 2);
dv.container.appendChild(pre);
```

## 3. 使用默认展示字体与等宽字体

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/font");

const font = Tessera.use("font");
await font.ensureDefaults();

const style = document.createElement("style");
style.textContent = `
  .ts-font-demo {
    display: grid;
    gap: 10px;
    margin-top: 12px;
  }

  .ts-font-demo__display {
    font-family: var(--ts-font-display);
    font-size: 28px;
    line-height: 1.3;
  }

  .ts-font-demo__body {
    font-family: var(--ts-font-body);
    font-size: 14px;
    line-height: 1.7;
  }

  .ts-font-demo__mono {
    font-family: var(--ts-font-mono);
    font-size: 13px;
  }
`;
document.head.appendChild(style);

const root = document.createElement("div");
root.className = "ts-font-demo";
root.innerHTML = `
  <div class="ts-font-demo__display">优设好身体 / YOUSHE HaoShenTi</div>
  <div class="ts-font-demo__body">这是一段正文示例，用于观察默认 body 字体变量的表现。</div>
  <div class="ts-font-demo__mono">const ratio = 0.618; // JetBrains Mono</div>
`;

dv.container.appendChild(root);
```

## 4. 覆盖默认别名

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/font");

const font = Tessera.use("font");
await font.ensureDefaults();

await font.defineAlias("body", ['"PingFang SC"', '"Microsoft YaHei"', 'sans-serif']);

const pre = document.createElement("pre");
pre.textContent = JSON.stringify(font.getAlias("body"), null, 2);
dv.container.appendChild(pre);
```

## 5. 注册额外字体并绑定别名

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/font");

const font = Tessera.use("font");
await font.ensureDefaults();

await font.register({
  family: "Maple Mono",
  source: {
    type: "remote-file",
    url: "https://example.com/fonts/maple-mono.woff2",
    format: "woff2",
  },
});

await font.defineAlias("mono", ['"Maple Mono"', '"JetBrains Mono"', 'monospace']);

dv.paragraph("mono 别名已更新。");
```
