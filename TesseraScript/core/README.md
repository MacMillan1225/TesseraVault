# TesseraScript Core 使用说明

本文档记录 `core/file.js`、`core/css.js` 与 `core/config.js` 的用途和常见调用方式，供后续查询。

---

## 1. `core/file.js`

### 作用

`file.js` 是一个面向 Obsidian vault 的文件读取控制器，负责：

- 获取 `app` 实例
- 规整 vault 路径
- 按路径获取文件对象
- 读取文本文件
- 读取 CSS 文件
- 读取 JSON 文件并自动解析

它是一个底层模块，后续其他 core 模块可以直接复用它。

---

### 导出方式

```js
const createFileController = require("./file");
```

---

### 创建控制器

```js
const createFileController = require("./file");

const file = createFileController({ app });
```

如果不传 `app`，模块会尝试使用全局的 `app`：

```js
const file = createFileController();
```

---

### 常用方法

#### `file.normalizePath(path)`

规整路径：

- 去掉首尾空白
- 将 `\` 转成 `/`

```js
file.normalizePath(" T\\a\\b.css ");
// => "T/a/b.css"
```

---

#### `file.exists(path)`

判断文件是否存在：

```js
const ok = file.exists("TesseraScript/styles/card.css");
```

---

#### `await file.read(path)`

读取文本文件内容：

```js
const text = await file.read("TesseraScript/data/demo.txt");
```

可选关闭缓存读取：

```js
const text = await file.read("TesseraScript/data/demo.txt", { cached: false });
```

---

#### `await file.readText(path)`

和 `read` 一样，只是语义更明确：

```js
const text = await file.readText("TesseraScript/data/demo.txt");
```

---

#### `await file.readCss(path)`

读取 CSS 文件：

```js
const cssText = await file.readCss("TesseraScript/styles/card.css");
```

---

#### `await file.readJson(path)`

读取并解析 JSON：

```js
const data = await file.readJson("TesseraScript/data/config.json");
```

如果 JSON 非法，会直接抛出解析错误。

---

## 2. `core/css.js`

### 作用

`css.js` 是一个页面样式控制器，负责：

- 注入 CSS 文本
- 从 vault 中读取 `.css` 文件并注入
- 按 `id` 去重
- 无 `id` 时自动编号
- 更新样式
- 追加样式
- 删除样式
- 清空样式
- 查询当前样式记录

它内部已经复用了 `file.js` 的文件读取能力。

---

### 导出方式

```js
const createCSSController = require("./css");
```

---

### 创建控制器

```js
const createCSSController = require("./css");

const css = createCSSController({ app });
```

也可以指定 DOM id 前缀：

```js
const css = createCSSController({
  app,
  prefix: "ts-card-css"
});
```

---

### 常用方法

#### `await css.add({ ... })`

添加一个样式。

支持两种来源：

1. 直接传 `text`
2. 传 `path` 从 vault 读取

```js
await css.add({
  id: "card-style",
  text: ".card { padding: 12px; }"
});
```

```js
await css.add({
  id: "heatmap-style",
  path: "TesseraScript/styles/heatmap.css"
});
```

规则：

- 有 `id` 时按 `id` 去重
- 若 `id` 已存在，默认直接返回已有记录，不覆盖
- 无 `id` 时会自动生成 `css-1`、`css-2` 等编号

返回值示例：

```js
{
  id: "card-style",
  domId: "ts-css-card-style",
  sourceType: "text",
  source: null,
  content: ".card { padding: 12px; }",
  createdAt: 1710000000000,
  updatedAt: 1710000000000,
  mounted: true,
  exists: false,
  replaced: false
}
```

---

#### `await css.addText(text, options)`

文本快捷入口：

```js
await css.addText(".card { color: red; }", {
  id: "card-style"
});
```

---

#### `await css.addFile(path, options)`

文件快捷入口：

```js
await css.addFile("TesseraScript/styles/card.css", {
  id: "card-style"
});
```

---

#### `await css.update(id, { text | path })`

更新已存在样式：

```js
await css.update("card-style", {
  text: ".card { color: blue; }"
});
```

或：

```js
await css.update("card-style", {
  path: "TesseraScript/styles/card-v2.css"
});
```

---

#### `css.append(id, text)`

在已有样式后追加文本：

```js
css.append("card-style", ".card:hover { opacity: 0.8; }");
```

---

#### `css.remove(id)`

删除样式：

```js
css.remove("card-style");
```

返回值为 `true / false`。

---

#### `css.clear()`

清空当前 prefix 下控制器记录的全部样式：

```js
css.clear();
```

返回删除数量。

---

#### `css.has(id)`

判断样式是否存在：

```js
css.has("card-style");
```

---

#### `css.get(id)`

获取单条样式记录：

```js
const record = css.get("card-style");
```

---

#### `css.list()`

列出当前 prefix 下全部样式记录：

```js
const all = css.list();
```

---

#### `await css.ensure({ ... })`

确保样式存在：

- 已存在则直接返回已有
- 不存在则自动创建

```js
await css.ensure({
  id: "base-style",
  path: "TesseraScript/styles/base.css"
});
```

---

## 3. Dataview 中的典型用法

下面是一个偏实际的调用示例：

```js
const createCSSController = require("TesseraScript/core/css");

const css = createCSSController({ app });

await css.ensure({
  id: "demo-style",
  path: "TesseraScript/styles/demo.css"
});

await css.addText(`
  .demo-box {
    padding: 12px;
    border-radius: 10px;
  }
`, {
  id: "demo-inline-style"
});
```

---

## 4. 建议

### 推荐做法

1. 固定给常驻样式一个明确 `id`
2. 临时样式可不传 `id`，让控制器自动编号
3. 文件样式统一放在某个固定目录下，后续更好维护
4. 长期复用的逻辑优先走 `file.js` 和 `css.js`，避免每个组件重复写底层代码

---

## 5. 当前模块关系

```text
core/file.js  -> 提供 vault 文件读取能力
core/css.js   -> 复用 file.js，负责样式注入与管理
core/config.js -> 复用 file.js，负责默认配置读取与合并
```

---

## 6. `core/config.js`

### 作用

`config.js` 是一个配置控制器，负责：

- 读取组件对应的 JSON 配置文件
- 将 JSON 配置与内置 fallback 默认值合并
- 将默认配置与用户传参做深层合并
- 缓存已读取的配置结果

---

### 导出方式

```js
const createConfigController = require("./config");
```

---

### 创建控制器

```js
const createConfigController = require("./config");

const config = createConfigController({ app });
```

如果不传 `app`，模块会尝试使用全局的 `app`。

---

### 常用方法

#### `config.merge(baseConfig, overrideConfig)`

深层合并两个对象；数组默认按整体替换处理：

```js
const merged = config.merge(
  { layout: { width: 320 }, flags: { enabled: true } },
  { layout: { width: 480 } }
);
```

---

#### `await config.load(path, options)`

从指定路径读取 JSON，并和 `options.fallback` 合并：

```js
const defaults = await config.load("TesseraScript/components/card/config.json", {
  fallback: {
    title: "Card",
    flags: { showHeader: true },
  },
});
```

默认读取失败时回退到当前缓存值；若希望抛错，可传：

```js
await config.load(path, { silent: false });
```

---

#### `config.createScope({ path, fallback })`

为单个组件创建固定作用域：

```js
const cardConfig = config.createScope({
  path: "TesseraScript/components/card/config.json",
  fallback: {
    title: "Card",
    colors: {
      value: "var(--text-accent)",
    },
  },
});
```

作用域对象包含：

- `await scope.load()`
- `scope.get()`
- `scope.merge(userOptions)`
