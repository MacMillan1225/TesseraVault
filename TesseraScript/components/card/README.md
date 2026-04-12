# components/card

`components/card` 是一个返回 DOM 元素的通用卡片组件，适合在 Obsidian 的 DataviewJS 面板、仪表盘页面、统计区块和信息摘要区里复用。

## 适用场景

1. 仪表盘里的 KPI 卡片
2. 最近更新、今日任务、学习摘要
3. 左右分栏中的说明块
4. 装载列表、链接、查询结果的轻量容器

## 核心特点

1. API 简单，`card(options)` 直接返回 DOM 节点
2. 支持标题、副标题、数值、正文和自定义子节点
3. 支持全局默认配置和单次局部覆盖
4. 支持关闭 header 分割线
5. 支持自定义 hover 强调色
6. 支持单卡级 `styles` 内联样式覆盖

## 快速开始

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
    title: "今日概览",
    meta: "OVERVIEW",
    value: 12,
    content: "今天共处理了 12 条记录。",
  })
);
```

## API

### 基础字段

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `""` | 卡片标题 |
| `meta` | `string` | `""` | 右侧元信息 |
| `value` | `any` | `null` | 主数值，内部会转成字符串 |
| `content` | `string \| Node \| Array` | `undefined` | 正文内容 |
| `children` | `Node \| Array` | `undefined` | 自定义节点内容 |
| `emptyText` | `string` | `"No content"` | 没有正文时显示的占位文本 |
| `className` | `string \| string[]` | `undefined` | 追加到卡片根节点的类名 |

### `flags`

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `flags.showHeader` | `boolean` | `true` | 是否渲染 header |
| `flags.headerSep` | `boolean` | `true` | 是否显示 header 底部分割线 |
| `flags.showTitle` | `boolean` | `true` | 是否显示标题 |
| `flags.showMeta` | `boolean` | `true` | 是否显示副标题 |
| `flags.showValue` | `boolean` | `true` | 是否显示数值 |

### `layout`

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `layout.maxWidth` | `string` | `"100%"` | 卡片最大宽度 |
| `layout.padding` | `string` | `"16px"` | 内边距 |
| `layout.radius` | `string` | `"16px"` | 圆角 |
| `layout.gap` | `string` | `"14px"` | 预留卡片内部节奏字段 |
| `layout.bodyGap` | `string` | `"12px"` | 预留正文节奏字段 |

### `colors`

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `colors.background` | `string` | 见默认配置 | 卡片背景 |
| `colors.border` | `string` | 见默认配置 | 边框颜色 |
| `colors.shadow` | `string` | 见默认配置 | 阴影变量入口 |
| `colors.hoverAccent` | `string` | `var(--interactive-accent)` | hover 时左侧强调色 |
| `colors.value` | `string` | `var(--text-accent, var(--text-normal))` | 数值颜色 |

### `styles`

这些字段会以内联样式写到当前卡片节点，因此同一页面里的卡片可以完全独立覆盖。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `styles.card` | `object` | 卡片根节点 `<article>` 的内联样式 |
| `styles.header` | `object` | header 区域内联样式 |
| `styles.title` | `object` | 标题内联样式 |
| `styles.meta` | `object` | 副标题内联样式 |
| `styles.body` | `object` | body 区域内联样式 |
| `styles.value` | `object` | 数值区域内联样式 |
| `styles.empty` | `object` | 空状态文本内联样式 |

## 推荐用法

### 1. 信息卡片

推荐结构：`title + meta + content`

适合说明、备注、摘要。

```js
card({
  title: "周目标",
  meta: "GOAL",
  content: "本周重点完成写作、训练和项目复盘。",
});
```

### 2. 统计卡片

推荐结构：`title + meta + value + content`

适合数字概览和趋势提示。

```js
card({
  title: "本周训练",
  meta: "WORKOUT",
  value: 5,
  content: "已完成 5 次训练。",
});
```

### 3. 极简卡片

推荐关闭 header 分割线，让视觉更轻。

```js
card({
  title: "一句话提醒",
  content: "今天优先完成最重要的一件事。",
  flags: {
    headerSep: false,
  },
});
```

### 4. 查询结果容器

复杂内容建议放到 `children`，不要把 HTML 字符串硬塞进 `content`。

```js
card({
  title: "最近更新",
  meta: "RECENT",
  children: listNode,
});
```

### 5. 单卡独立视觉覆盖

推荐结构：`colors + styles` 一起使用。

```js
card({
  title: "重点卡片",
  meta: "PINNED",
  value: "42",
  content: "这一张不会影响同页其它卡片。",
  colors: {
    background: "rgba(248, 250, 252, 0.98)",
    border: "rgba(148, 163, 184, 0.18)",
    hoverAccent: "rgba(59, 130, 246, 0.45)",
    value: "#0f172a",
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
    },
  },
});
```

## 配置策略建议

1. 页面级统一风格：写进 `TesseraScript/components/card/config.json`
2. 单卡特殊样式：在 `card({...})` 里覆盖 `layout`、`colors` 或 `styles`
3. 同一页面多个卡片：公共风格放 `config.json`，差异化风格放单卡 `styles`
4. 想要更安静的界面：将 `headerSep` 设为 `false`
5. 想要更强的状态提示：优先只改 `value` 和较轻的 `hoverAccent`，不要同时把所有颜色都改掉

## 不推荐的用法

1. 把整段长文直接塞进 `meta`
2. 在卡片内部承担多列布局职责
3. 每张卡片都使用完全不同且没有信息层级的背景和强调色
4. 同时混用 `content` 和过于复杂的纯文本拼接 HTML

## 布局建议

`card` 只负责单卡片结构，多卡片布局请交给外层容器。

```js
const grid = document.createElement("div");
grid.style.display = "grid";
grid.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
grid.style.gap = "16px";

grid.appendChild(card({ title: "A", value: 1 }));
grid.appendChild(card({ title: "B", value: 2 }));
grid.appendChild(card({ title: "C", value: 3 }));
```

## 配置加载

```js
const card = Tessera.use("card");
await card.loadConfig();
```

加载后，后续 `card()` 会优先使用 `config.json` 中的默认值，再与传入参数合并。
