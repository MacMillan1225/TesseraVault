# Card Demo

`components/card` 现在是一个返回 DOM 节点的轻量卡片组件，适合在 DataviewJS、普通脚本渲染区、仪表盘模块里直接拼装使用。

## 推荐加载方式

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");
```

## 1. 最小示例

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

dv.container.appendChild(
  card({
    title: "今日任务",
    content: "这里放最基础的卡片内容。",
  })
);
```

## 2. 信息卡片

适合展示说明、摘要、状态文字。

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

dv.container.appendChild(
  card({
    title: "学习记录",
    meta: "STUDY",
    content: "今天完成了 3 个章节复习，并整理了错题。",
  })
);
```

## 3. 数值卡片

适合 KPI、统计概览、计数信息。

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

dv.container.appendChild(
  card({
    title: "完成数",
    meta: "TODAY",
    value: 7,
    content: "较昨天多 2 项。",
  })
);
```

## 4. 关闭 Header 分割线

使用 `flags.headerSep` 控制 header 底部分割线。

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

dv.container.appendChild(
  card({
    title: "无分割线 Header",
    meta: "PLAIN",
    content: "适合内容较短、视觉更轻的卡片。",
    flags: {
      headerSep: false,
    },
  })
);
```

## 5. 自定义 Hover 强调色

使用 `colors.hoverAccent` 控制 hover 时左侧高亮色。

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

dv.container.appendChild(
  card({
    title: "自定义 Hover",
    meta: "GREEN",
    value: "42",
    content: "将默认紫色 hover 改成绿色。",
    colors: {
      hoverAccent: "#22c55e",
    },
  })
);
```

## 6. 自定义外观

适合局部做仪表盘强调卡、封面卡、专题卡。

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

dv.container.appendChild(
  card({
    title: "本周聚焦",
    meta: "FOCUS",
    value: "84%",
    content: "这一张覆盖了背景、边框、数值色和 hover 强调色。",
    layout: {
      padding: "20px",
      radius: "12px",
    },
    colors: {
      background: "rgba(239, 246, 255, 0.96)",
      border: "rgba(96, 165, 250, 0.18)",
      value: "#1d4ed8",
      hoverAccent: "rgba(96, 165, 250, 0.55)",
    },
  })
);
```

## 7. 单卡内联样式覆盖

如果你希望同一页面里的每张卡片都长得不一样，优先使用 `styles`。这些样式会直接内联到当前卡片节点，不会影响别的卡片。

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const wrap = document.createElement("div");
wrap.style.display = "grid";
wrap.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
wrap.style.gap = "16px";

wrap.appendChild(
  card({
    title: "深色卡片",
    meta: "DARK",
    value: "42",
    content: "这一张有独立背景、独立标题色、独立数值大小。",
    colors: {
      background: "rgba(248, 250, 252, 0.98)",
      border: "rgba(148, 163, 184, 0.18)",
      hoverAccent: "rgba(59, 130, 246, 0.45)",
      value: "#0f172a",
      shadow: "0 12px 30px rgba(15, 23, 42, 0.24)",
    },
    styles: {
      title: {
        color: "#0f172a",
        fontSize: "18px",
      },
      meta: {
        color: "#64748b",
      },
      value: {
        fontSize: "40px",
        letterSpacing: "-0.04em",
      },
      body: {
        justifyContent: "space-between",
      },
    },
  })
);

wrap.appendChild(
  card({
    title: "浅色卡片",
    meta: "LIGHT",
    content: "这一张保持完全不同的圆角、边框和 header 样式。",
    flags: {
      headerSep: false,
    },
    styles: {
      card: {
        border: "1px dashed rgba(251, 191, 36, 0.8)",
        borderRadius: "24px",
        background: "#fffbeb",
      },
      header: {
        marginBottom: "4px",
      },
      title: {
        color: "#92400e",
      },
      body: {
        color: "#78350f",
      },
    },
  })
);

dv.container.appendChild(wrap);
```

## 8. 放入自定义节点

`children` 适合塞入列表、按钮区、Dataview 查询结果等复杂节点。

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const list = document.createElement("ul");
list.style.margin = "0";
list.style.paddingLeft = "18px";

["整理项目", "复盘训练", "更新周报"].forEach((text) => {
  const li = document.createElement("li");
  li.textContent = text;
  list.appendChild(li);
});

dv.container.appendChild(
  card({
    title: "待办清单",
    meta: "LIST",
    children: list,
  })
);
```

## 9. 多卡片并排

组件本身只负责单张卡片。多列布局建议交给外层容器处理。

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const grid = document.createElement("div");
grid.style.display = "grid";
grid.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
grid.style.gap = "16px";

[
  { title: "笔记数", meta: "NOTES", value: 128 },
  { title: "任务数", meta: "DONE", value: 34 },
  { title: "连续天数", meta: "STREAK", value: 12 },
].forEach((item) => {
  grid.appendChild(card(item));
});

dv.container.appendChild(grid);
```

## 10. 配置文件加载

如果你希望多个页面共用默认风格，可以先加载 `config.json`。

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

await card.loadConfig();

dv.container.appendChild(
  card({
    title: "配置加载示例",
    meta: "CONFIG",
    content: "会优先使用 components/card/config.json 里的默认配置。",
  })
);
```

## 使用建议

1. 卡片内部信息层级尽量保持 2 到 3 层：`title`、`meta`、`value/content` 即可。
2. 统计数字优先放在 `value`，说明文字放在 `content`，不要把长文本塞进 `meta`。
3. `headerSep: false` 适合极简卡片、封面卡、短摘要卡。
4. `hoverAccent` 建议使用轻一点的半透明颜色，避免 hover 过重。
5. 想做单卡差异化时，优先用 `colors` 和 `styles`，它们只作用在当前卡片。
6. 多卡片排版时，让外层容器负责 `grid` 或 `flex`，不要把布局逻辑塞进卡片本身。
7. 大范围统一风格优先写进 `config.json`，单张特殊卡片再局部覆盖。
