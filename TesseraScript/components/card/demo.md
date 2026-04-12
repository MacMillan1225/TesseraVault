下面是一个**适配“现代版 card 逻辑”**的 `demo.md`。

核心改动：

- 不再使用：
  ```js
  myCard.body.setText(...)
  myCard.appendTo(...)
  card.row(...)
  ```
- 改成：
  ```js
  const el = card({ ... });
  dv.container.appendChild(el);
  ```
- 正文内容通过：
  ```js
  value
  content
  children
  ```
  传入。
- 样式覆盖通过新版的：
  ```js
  layout
  colors
  flags
  className
  ```
  来演示。
- 因为现代版 `card` 没有 `card.row`，所以横排布局 demo 改成用 `dom.createElement("div", { ... })` 自己创建布局容器。

---

```md
# Card - Demo

## 基础用法

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const myCard = card({
    title: "今日任务",
    content: "这里是卡片内容。",
});

dv.container.appendChild(myCard);
```

---

## 带副标题

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const myCard = card({
    title: "学习记录",
    meta: "Study Logs",
    content: "语法学习：100条",
});

dv.container.appendChild(myCard);
```

---

## 数值卡片

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const statCard = card({
    title: "快速统计",
    meta: "TODAY",
    value: "7",
    content: "今日完成：7 项",
});

dv.container.appendChild(statCard);
```

---

## 隐藏 Header

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const noHeaderCard = card({
    title: "备忘",
    content: "记得喝水。",
    flags: {
        showHeader: false,
        showTitle: true,
        showMeta: true,
        showValue: true,
    },
});

dv.container.appendChild(noHeaderCard);
```

---

## 只显示标题，不显示副标题

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const titleOnlyCard = card({
    title: "静态信息",
    meta: "META WILL BE HIDDEN",
    content: "这张卡片隐藏了 meta 信息。",
    flags: {
        showHeader: true,
        showTitle: true,
        showMeta: false,
        showValue: true,
    },
});

dv.container.appendChild(titleOnlyCard);
```

---

## 空内容状态

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const emptyCard = card({
    title: "空卡片",
    meta: "EMPTY",
    emptyText: "暂无内容",
});

dv.container.appendChild(emptyCard);
```

---

## 局部覆盖布局和颜色

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const customCard = card({
    title: "自定义外观",
    meta: "CUSTOM",
    value: "42",
    content: "这张卡片使用了独立的圆角、内边距、背景和阴影。",
    layout: {
        maxWidth: "100%",
        padding: "20px",
        radius: "8px",
        gap: "16px",
        bodyGap: "12px",
    },
    colors: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        border: "rgba(255, 255, 255, 0.35)",
        shadow: "0 16px 36px rgba(76, 81, 191, 0.28)",
        value: "#ffffff",
    },
});

dv.container.appendChild(customCard);
```

---
## 多卡片横排布局 - 等分三列

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const items = [
    { title: "笔记数", meta: "NOTES", value: "128" },
    { title: "完成任务", meta: "DONE", value: "34" },
    { title: "连续天数", meta: "STREAK", value: "12" },
];

const cards = items.map((item) =>
    card({
        title: item.title,
        meta: item.meta,
        value: item.value,
    })
);

const rowEl = document.createElement("div");
rowEl.style.display = "grid";
rowEl.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
rowEl.style.gap = "16px";
rowEl.style.alignItems = "stretch";

for (const el of cards) {
    rowEl.appendChild(el);
}

dv.container.appendChild(rowEl);
```

---
## 多卡片横排布局 - 左宽右窄，2:1 比例

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const main = card({
    title: "主要内容",
    meta: "MAIN",
    content: "这张卡片占 2/3 宽度。",
});

const side = card({
    title: "侧边信息",
    meta: "SIDE",
    content: "这张卡片占 1/3 宽度。",
});

const rowEl = document.createElement("div");
rowEl.style.display = "grid";
rowEl.style.gridTemplateColumns = "2fr 1fr";
rowEl.style.gap = "16px";
rowEl.style.alignItems = "stretch";

rowEl.appendChild(main);
rowEl.appendChild(side);

dv.container.appendChild(rowEl);
```

---

## 多卡片横排布局 - 左 2 卡片右 1 卡片

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const topLeft = card({
    title: "左上",
    meta: "TOP LEFT",
    content: "左侧第一张卡片。",
});

const bottomLeft = card({
    title: "左下",
    meta: "BOTTOM LEFT",
    content: "左侧第二张卡片。",
});

const right = card({
    title: "右侧",
    meta: "RIGHT",
    content: "这张卡片撑满左侧两张的总高度。",
});

const leftColumn = document.createElement("div");
leftColumn.style.display = "grid";
leftColumn.style.gridTemplateRows = "1fr 1fr";
leftColumn.style.gap = "16px";
leftColumn.appendChild(topLeft);
leftColumn.appendChild(bottomLeft);

const rowEl = document.createElement("div");
rowEl.style.display = "grid";
rowEl.style.gridTemplateColumns = "1fr 1fr";
rowEl.style.gap = "16px";
rowEl.style.alignItems = "stretch";
rowEl.appendChild(leftColumn);
rowEl.appendChild(right);

dv.container.appendChild(rowEl);
```

---
## 多卡片横排布局 - 自定义列比例

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const a = card({
    title: "A",
    meta: "3fr",
    content: "最宽",
});

const b = card({
    title: "B",
    meta: "2fr",
    content: "中等",
});

const c = card({
    title: "C",
    meta: "1fr",
    content: "最窄",
});

const rowEl = document.createElement("div");
rowEl.style.display = "grid";
rowEl.style.gridTemplateColumns = "3fr 2fr 1fr";
rowEl.style.gap = "16px";
rowEl.style.alignItems = "stretch";

rowEl.appendChild(a);
rowEl.appendChild(b);
rowEl.appendChild(c);

dv.container.appendChild(rowEl);
```

---
## 向卡片中追加 Dataview 查询结果

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const pages = dv.pages().sort((p) => p.file.mtime, "desc").limit(5);

const listEl = document.createElement("ul");
listEl.style.listStyle = "none";
listEl.style.padding = "0";
listEl.style.margin = "0";

for (const page of pages) {
    const li = document.createElement("li");
    li.style.padding = "4px 0";
    li.style.borderBottom = "1px solid var(--ts-card-border)";

    const link = document.createElement("a");
    link.textContent = page.file.name;
    link.href = page.file.path;

    li.appendChild(link);
    listEl.appendChild(li);
}

const recentCard = card({
    title: "最近笔记",
    meta: "RECENT",
    children: listEl,
});

dv.container.appendChild(recentCard);
```

---

## 加载配置

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

await card.loadConfig();

const myCard = card({
    title: "配置加载示例",
    meta: "CONFIG",
    content: "这个示例会先尝试加载 components/card/config.json，然后再创建卡片。",
});

dv.container.appendChild(myCard);
```

---

## 功能总结

### 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | string | `""` | 卡片标题 |
| `meta` | string | `""` | 副标题/元信息 |
| `value` | any | `null` | 主数值显示 |
| `content` | string / Node / Node[] | `undefined` | 正文内容 |
| `children` | Node / Node[] | `undefined` | 自定义子节点内容 |
| `emptyText` | string | `"No content"` | 无内容时显示的文本 |
| `className` | string / string[] | `undefined` | 追加到 `.ts-card` 的类名 |
| `flags.showHeader` | boolean | `true` | 是否显示 header |
| `flags.showTitle` | boolean | `true` | 是否显示标题 |
| `flags.showMeta` | boolean | `true` | 是否显示 meta |
| `flags.showValue` | boolean | `true` | 是否显示 value |
| `layout.maxWidth` | string | `"100%"` | 卡片最大宽度 |
| `layout.padding` | string | `"16px"` | 卡片内边距 |
| `layout.radius` | string | `"16px"` | 卡片圆角 |
| `layout.gap` | string | `"14px"` | 卡片内部间距 |
| `layout.bodyGap` | string | `"12px"` | body 内部间距 |
| `colors.background` | string | - | 卡片背景 |
| `colors.border` | string | - | 边框颜色 |
| `colors.shadow` | string | - | 阴影 |
| `colors.value` | string | - | value 颜色 |

### 与旧 API 的区别

现代版 `card()` 直接返回 DOM 元素，因此：

```js
const el = card({
    title: "标题",
    content: "内容",
});

dv.container.appendChild(el);
```

不再使用：

```js
myCard.body.setText("内容");
myCard.appendTo(dv.container);
```

现代版也没有内置 `card.row()`，横排布局可以用 `dom.createElement("div", { style, children })` 自行创建。
```
