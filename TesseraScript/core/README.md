# TesseraScript Core 使用说明

本文档记录 `core/file.js`、`core/css.js` 与 `core/font.js` 的用途和常见调用方式，供后续查询。

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
- 生成 vault 资源对应的浏览器 URL

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

#### `file.getFile(path)`

返回 vault 中对应路径的文件对象：

```js
const fileRef = file.getFile("Assets/Fonts/MapleMono-Regular.woff2");
```

---

#### `file.getResourceUrl(path)`

将 vault 文件路径转换为浏览器可访问的资源 URL，适合字体、图片等资源：

```js
const url = file.getResourceUrl("Assets/Fonts/MapleMono-Regular.woff2");
```

这个能力主要供 `core/font.js` 这类资源型模块复用。

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

## 4. `core/font.js`

### 作用

`font.js` 是一个轻量字体管理器，负责：

- 提供默认字体别名
- 注册本地 vault 字体文件
- 注册远程字体文件
- 注册远程字体样式表
- 将字体别名输出成 CSS 变量
- 复用 `core/css.js` 注入 `@font-face` 和别名字体变量

第一版默认只内置字体别名，不强绑定外部字体 CDN。

---

### 默认别名

默认会准备这四组别名：

- `ui`
- `body`
- `display`
- `title`
- `mono`

默认会注入对应变量：

- `--ts-font-ui`
- `--ts-font-body`
- `--ts-font-display`
- `--ts-font-title`
- `--ts-font-mono`

其中默认会额外注册两组字体来源：

- `YOUSHE HaoShenTi`：来自 `TesseraScript/assets/fonts/YOUSHEhaoshenti.woff2`
- `JetBrains Mono`：默认按本机已安装字体注册为 `local("JetBrains Mono")`

推荐约定：

- `display`：展示型中文标题字体
- `title`：组件标题，默认回退到 `display`
- `mono`：数字、标签、代码、统计值

---

### 加载方式

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/font");

const font = Tessera.use("font");
```

---

### 使用默认字体别名

```js
const font = Tessera.use("font");
await font.ensureDefaults();
```

之后就可以在 CSS 中直接写：

```css
.some-card {
  font-family: var(--ts-font-body);
}

.some-card__title {
  font-family: var(--ts-font-title);
}
```

---

### 注册 vault 本地字体

```js
await font.register({
  family: "Maple Mono",
  weight: 400,
  style: "normal",
  source: {
    type: "vault-file",
    path: "Assets/Fonts/MapleMono-Regular.woff2",
    format: "woff2",
  },
});

await font.defineAlias("mono", ['"Maple Mono"', '"JetBrains Mono"', 'monospace']);
```

---

### 注册远程字体

#### 远程字体文件

```js
await font.register({
  family: "Maple Mono",
  source: {
    type: "remote-file",
    url: "https://example.com/fonts/maple-mono.woff2",
    format: "woff2",
  },
});
```

#### 远程字体样式表

```js
await font.register({
  family: "LXGW WenKai",
  source: {
    type: "remote-css",
    url: "https://cdn.example.com/fonts/lxgw-wenkai.css",
  },
});
```

---

### 常用方法

#### `await font.ensureDefaults()`

注入默认字体别名变量。

#### `await font.register(definition)`

注册一个字体定义并同步输出 `@font-face` 或 `@import`。

#### `await font.registerMany(definitions)`

批量注册多个字体。

#### `await font.defineAlias(name, families)`

定义或覆盖一个字体别名，并自动刷新变量样式。

#### `font.getAlias(name)`

读取当前别名。

#### `font.listAliases()`

列出全部字体别名。

#### `font.listFonts()`

列出全部已注册字体。

#### `await font.applyVars(options)`

重新输出字体变量。可选：

- `selector`，默认 `:root`
- `varPrefix`，默认 `--ts-font-`

例如：

```js
await font.applyVars({
  selector: ".my-scope",
  varPrefix: "--my-font-",
});
```

---

## 5. 建议

### 推荐做法

1. 固定给常驻样式一个明确 `id`
2. 临时样式可不传 `id`，让控制器自动编号
3. 文件样式统一放在某个固定目录下，后续更好维护
4. 长期复用的逻辑优先走 `file.js` 和 `css.js`，避免每个组件重复写底层代码

---

## 6. 当前模块关系

```text
core/file.js  -> 提供 vault 文件读取与资源 URL 能力
core/css.js   -> 复用 file.js，负责样式注入与管理
core/font.js  -> 复用 file.js + css.js，负责字体注册与字体变量输出
```
