# Card - Demo

## 基础用法

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const myCard = card({ title: "今日任务" });
myCard.body.setText("这里是卡片内容。");
myCard.appendTo(dv.container);
```

---

## 带副标题

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const myCard = card({
    title: "学习记录",
    meta: "Study Logs",
});
myCard.body.setText("语法学习：100条");
myCard.appendTo(dv.container);
```

---

## 紧凑变体

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const compactCard = card({
    title: "快速统计",
    compact: true,
    value: "7",
});
compactCard.body.setText("今日完成：7 项");
compactCard.appendTo(dv.container);
```

---

## 无 header 分隔线

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const noSepCard = card({
    title: "备忘",
    headerSep: false,
});
noSepCard.body.setText("记得喝水。");
noSepCard.appendTo(dv.container);
```

---

## 禁用 hover 效果

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const noHoverCard = card({
    title: "静态信息",
    hover: false,
});
noHoverCard.body.setText("这张卡片不会有 hover 左边框。");
noHoverCard.appendTo(dv.container);
```

---

## 动画效果

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

// fade 动画（默认）
const fadeCard = card({
    title: "Fade 动画",
    meta: "DEFAULT",
    animation: "fade",
});
fadeCard.body.setText("淡入效果");
fadeCard.appendTo(dv.container);

// slide-up 动画
const slideCard = card({
    title: "Slide Up",
    meta: "ANIMATION",
    animation: "slide-up",
});
slideCard.body.setText("从下方滑入");
slideCard.appendTo(dv.container);

// scale 动画
const scaleCard = card({
    title: "Scale 动画",
    meta: "ANIMATION",
    animation: "scale",
});
scaleCard.body.setText("缩放进入");
scaleCard.appendTo(dv.container);
```

---

## 局部覆盖 CSS 变量

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const customCard = card({
    title: "自定义外观",
    meta: "CUSTOM",
    cssVars: {
        "--ts-card-radius": "4px",
        "--ts-card-padding": "20px",
        "--ts-hover-accent-width": "5px",
        "--ts-card-background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
});
customCard.body.setText("这张卡片有独立的圆角和内边距。");
customCard.appendTo(dv.container);
```

---

## 多卡片横排布局 - 等分三列

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");
const row = card.row;

const items = [
    { title: "笔记数", meta: "NOTES", value: "128" },
    { title: "完成任务", meta: "DONE", value: "34" },
    { title: "连续天数", meta: "STREAK", value: "12" },
];

const cards = items.map((item) =>
    card({ title: item.title, meta: item.meta, compact: true, value: item.value })
);

const rowEl = row({ preset: "3", cards });
rowEl.appendTo(dv.container);
```

---

## 多卡片横排布局 - 左宽右窄（2:1 比例）

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");
const row = card.row;

const main = card({ title: "主要内容", meta: "MAIN" });
main.body.setText("这张卡片占 2/3 宽度。");

const side = card({ title: "侧边信息", meta: "SIDE" });
side.body.setText("这张卡片占 1/3 宽度。");

const rowEl = row({ preset: "2-1", cards: [main, side] });
rowEl.appendTo(dv.container);
```

---

## 多卡片横排布局 - 左2卡片右1卡片（右侧撑满）

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");
const row = card.row;

const topLeft = card({ title: "左上", meta: "TOP LEFT" });
topLeft.body.setText("左侧第一张卡片。");

const right = card({ title: "右侧", meta: "RIGHT" });
right.body.setText("这张卡片撑满左侧两张的总高度。");

const bottomLeft = card({ title: "左下", meta: "BOTTOM LEFT" });
bottomLeft.body.setText("左侧第二张卡片。");

const rowEl = row({
    preset: "2col-complex",
    cards: [topLeft, right, bottomLeft],
});
rowEl.appendTo(dv.container);
```

---

## 多卡片横排布局 - 自定义列比例

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");
const row = card.row;

const a = card({ title: "A", meta: "3fr" });
a.body.setText("最宽");

const b = card({ title: "B", meta: "2fr" });
b.body.setText("中等");

const c = card({ title: "C", meta: "1fr" });
c.body.setText("最窄");

const rowEl = row({ cols: [3, 2, 1], cards: [a, b, c] });
rowEl.appendTo(dv.container);
```

---

## 向 body 追加 Dataview 查询结果

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");

const card = Tessera.use("card");

const recentCard = card({
    title: "最近笔记",
    meta: "RECENT",
});

const listEl = recentCard.body.createEl("ul", {
    attrs: { style: "list-style:none;padding:0;margin:0;" },
});

const pages = dv.pages().sort((p) => p.file.mtime, "desc").limit(5);
for (const page of pages) {
    const item = recentCard.body.createEl("li");
    item.style.cssText = "padding:4px 0;border-bottom:1px solid var(--ts-card-border);";
    item.createEl("a", { text: page.file.name, href: page.file.path });
}

recentCard.appendTo(dv.container);
```

---

## 功能总结

### 属性

| 属性          | 类型      | 默认值    | 说明                               |
| ----------- | ------- | ------ | -------------------------------- |
| `title`     | string  | ""     | 卡片标题                             |
| `meta`      | string  | ""     | 副标题/元信息                          |
| `value`     | any     | null   | 数值显示                             |
| `compact`   | boolean | false  | 紧凑模式                             |
| `border`    | boolean | true   | 显示边框                             |
| `hover`     | boolean | true   | 启用 hover 效果                      |
| `headerSep` | boolean | true   | header 底部分隔线                     |
| `animation` | string  | "fade" | 入场动画：fade, slide-up, scale, none |
| `cssVars`   | object  | {}     | 局部 CSS 变量覆盖                      |

### row 布局

| preset | 说明 |
|--------|------|
| "2" | 等分两列 |
| "3" | 等分三列 |
| "4" | 等分四列 |
| "2-1" | 2:1 比例 |
| "1-2" | 1:2 比例 |
| "2col-complex" | 左2卡片右1卡片（右侧跨行） |