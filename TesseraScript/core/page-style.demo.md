# core/page-style demo

## 1. 最小示例

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/page-style");

const pageStyle = Tessera.use("pageStyle");

await pageStyle.apply({
  id: "demo-page-surface",
  container: dv.container,
  text: `
    .block-language-dataviewjs {
      border: 1px solid color-mix(in srgb, var(--background-modifier-border) 70%, transparent);
      border-radius: 14px;
      padding: 12px;
      background: color-mix(in srgb, var(--background-primary) 88%, var(--background-secondary));
    }

    .dataview.result-group {
      margin-top: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--background-secondary) 78%, transparent);
    }
  `,
});

dv.paragraph("当前样式只挂在这个页面宿主下，切走页面或销毁容器时会自动清理。");
```

## 2. 直接设置页面宽度

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/page-style");

const pageStyle = Tessera.use("pageStyle");

await pageStyle.applyWidth(920, {
  container: dv.container,
});

dv.paragraph("当前页面宽度已设为 920px，代码块宽度也会一起跟随。滚动页面后样式仍然保留，直到离开这个页面宿主。 ");
```

## 3. 修改页面外层区域

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/page-style");

const pageStyle = Tessera.use("pageStyle");

await pageStyle.apply({
  id: "demo-page-width",
  container: dv.container,
  text: `
    :scope {
      --file-line-width: 920px;
      --line-width-adaptive: 920px;
    }

    .el-pre {
      max-width: 920px !important;
    }
  `,
});

dv.paragraph("这类规则会被改写到当前 markdown 页面宿主上，而不是全局常驻。 ");
```

## 4. 主动注销

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/page-style");

const pageStyle = Tessera.use("pageStyle");

const handle = await pageStyle.apply({
  id: "demo-page-remove",
  container: dv.container,
  text: `
    .callout[data-callout="note"] {
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12);
    }
  `,
});

const button = document.createElement("button");
button.textContent = "Remove page style";
button.addEventListener("click", function () {
  handle.remove();
});

dv.container.appendChild(button);
```

## 5. 查看当前记录

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/page-style");

const pageStyle = Tessera.use("pageStyle");
const pre = document.createElement("pre");
pre.textContent = JSON.stringify(pageStyle.list(), null, 2);
dv.container.appendChild(pre);
```
