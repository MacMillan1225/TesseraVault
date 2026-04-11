# card

`card` 组件现在支持从 `config.json` 读取结构化默认配置。

## 相关文件

- `index.js`: 组件实现
- `style.css`: 样式变量
- `config.json`: 默认配置

## 典型流程

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.require("components/card");
await card.loadConfig();

dv.container.appendChild(
  card({
    title: "Quarterly Revenue",
    meta: "Updated today",
    value: "$42,000",
    flags: {
      showMeta: true,
    },
  })
);
```

## 可配置字段

- `title`
- `meta`
- `value`
- `emptyText`
- `flags.showHeader`
- `flags.showTitle`
- `flags.showMeta`
- `flags.showValue`
- `layout.maxWidth`
- `layout.padding`
- `layout.radius`
- `layout.gap`
- `layout.bodyGap`
- `colors.background`
- `colors.border`
- `colors.shadow`
- `colors.value`
