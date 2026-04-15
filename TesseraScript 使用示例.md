---
title: TesseraScript 使用示例
tags:
  - tessera
  - obsidian
  - dataviewjs
---

# TesseraScript 使用示例

这份笔记演示如何在 Obsidian 的 `dataviewjs` 中加载并使用 `TesseraScript`。

> [!note]
> 前提：你已经安装并启用了 Dataview 插件。

## 1. 先加载运行时和模块

第一次使用时，需要先执行 bootstrap，再执行要注册的模块文件。
现在组件会在第一次真正渲染时，自动通过 `core/css` 读取并注入对应的 `style.css`，所以示例里要先加载 `core/file` 和 `core/css`。

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/progressbar/index");
await dv.view("TesseraScript/components/card/index");
await dv.view("TesseraScript/components/heatmap/index");
await dv.view("TesseraScript/index");

dv.paragraph("Tessera runtime loaded.");
```

## 2. 单个模块：最短调用

`Tessera.use("progressbar")` 会自动走默认别名，等价于加载 `components/progressbar`。

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/progressbar/index");

const progressbar = Tessera.use("progressbar");
const el = progressbar({ value: 0.68, label: "Weekly Goal" });

dv.container.appendChild(el);
```

## 3. 聚合导入：推荐方式

`Tessera.use("components")` 和 `Tessera.use("@ui")` 都会返回聚合后的组件集合。

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/progressbar/index");
await dv.view("TesseraScript/components/card/index");
await dv.view("TesseraScript/components/heatmap/index");
await dv.view("TesseraScript/index");

const { progressbar, card } = Tessera.use("components");

const progressbarEl = progressbar({ value: 0.82, label: "Project progressbar" });
const cardEl = card({
  title: "Demo Card",
  meta: "Tessera.use(\"components\")",
  content: progressbarEl,
});

dv.container.appendChild(cardEl);
```

## 4. 使用 `@ui`

如果你更喜欢命名空间风格，可以这样写：

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/progressbar/index");
await dv.view("TesseraScript/components/card/index");
await dv.view("TesseraScript/components/heatmap/index");
await dv.view("TesseraScript/index");

const ui = Tessera.use("@ui");

const heatmapEl = ui.heatmap({
  title: "Activity Heatmap",
  data: [1, 4, 0, 2, 3, 5, 1, 2, 4, 3, 0, 1, 2, 5],
  columns: 7,
});

const cardEl = ui.card({
  title: "Heatmap Demo",
  meta: "via @ui",
  content: heatmapEl,
});

dv.container.appendChild(cardEl);
```

## 5. 推荐理解方式

- `Tessera.use("progressbar")`：拿单个组件
- `Tessera.use("components")`：拿常用组件集合
- `Tessera.use("@ui")`：和 `components` 一样，但更像 UI 命名空间
- `Tessera.require("components/progressbar")`：底层写法，能用，但不推荐优先记这个
- `core/file` + `core/css`：用于自动读取并注入组件样式

## 6. 当前加载顺序建议

每次都尽量遵循这个顺序：

```text
1. TesseraScript/tessera.bootstrap
2. TesseraScript/core/dom
3. TesseraScript/core/file
4. TesseraScript/core/css
5. TesseraScript/components/*/index
6. TesseraScript/index
7. 在 dataviewjs 里调用 Tessera.use(...)
```

## 7. 一个完整最小示例

如果你只想复制一段能直接试的代码，用这个：

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/progressbar/index");
await dv.view("TesseraScript/components/card/index");
await dv.view("TesseraScript/index");

const { progressbar, card } = Tessera.use("components");

dv.container.appendChild(
  card({
    title: "Hello Tessera",
    meta: "minimal demo",
    content: progressbar({ value: 0.75, label: "75%" }),
  })
);
```

## 8. 样式自动注入说明

现在 `progressbar`、`card`、`heatmap` 在第一次执行组件函数时，会自动尝试加载自己的 `style.css`。

例如：

- `progressbar()` 会读取 `TesseraScript/components/progressbar/style.css`
- `card()` 会读取 `TesseraScript/components/card/style.css`
- `heatmap()` 会读取 `TesseraScript/components/heatmap/style.css`

所以你不需要手动把 CSS 文本贴进笔记里，但前提仍然是：

- 已先加载 `TesseraScript/core/file`
- 已先加载 `TesseraScript/core/css`
- 组件对应的 `style.css` 文件真实存在
