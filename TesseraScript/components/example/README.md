# components/example

`components/example` 是新组件开发模板。它不是一个追求功能完整的业务组件，而是一个可直接复制、重命名、扩展的标准脚手架。

这个模板覆盖了当前仓库里一个完整组件应具备的关键部分：

1. `index.js`：模块定义、样式加载、配置加载、DOM 创建、导出接口
2. `config.json`：组件默认配置
3. `style.css`：组件公共样式与日间/夜间主题切换
4. `demo.md`：完整示例，方便开发时对照和回归测试
5. `README.md`：完整 API 和开发说明

## 当前仓库结构理解

### 1. `TesseraScript/core/`

当前核心能力主要来自以下文件：

1. `core/config.js`
   负责读取 JSON 配置、提供 fallback、做深度合并、生成 `scope`
2. `core/css.js`
   负责把 CSS 文件或 CSS 文本注入页面，并按 `id` 去重
3. `core/dom.js`
   负责创建 DOM、挂 class、挂 style、挂 attrs、追加 children
4. `core/file.js`
   负责通过 Obsidian 的 `app.vault` 读取文件

### 2. `TesseraScript/components/`

这里是面向用户直接使用的组件目录。组件最终应直接返回一个 HTML 元素，能被：

```js
dv.container.appendChild(component(options));
```

直接挂到 DataviewJS 渲染区域中。

### 3. `TesseraScript/shared/` 与 `TesseraScript/views/`

当前仓库里这两部分还没有形成稳定实现，因此新组件开发暂时不要依赖它们的能力。

### 4. 入口文件

由于 Dataview 的模块加载限制，新模块通常需要在两个入口注册：

1. `TesseraScript/tessera.bootstrap.js`
   负责建立 `Tessera` 运行时，以及给组件设置 alias
2. `TesseraScript/index.js`
   负责聚合导出，让用户可以统一加载

这意味着开发一个正式组件后，通常不止是新增 `components/foo/`，还要补上入口注册。

## 新组件开发流程

下面是推荐给开发者的完整流程。这个流程尽量细，把从创建目录到文档补齐的每一步都写清楚。

### 1. 复制模板目录

先复制：

```text
TesseraScript/components/example/
```

到你的新目录，例如：

```text
TesseraScript/components/stat-card/
```

然后把以下文件名保留不变，只修改内容：

1. `index.js`
2. `config.json`
3. `style.css`
4. `demo.md`
5. `README.md`

### 2. 修改模块 id 和路径

在 `index.js` 里最先要改的是模块名和文件路径。

例如把：

```js
Tessera.define("components/example", ...)
```

改成：

```js
Tessera.define("components/stat-card", ...)
```

同时把 `config.json` 和 `style.css` 的路径一起改掉：

```js
path: "TesseraScript/components/stat-card/config.json"
path: "TesseraScript/components/stat-card/style.css"
```

这里必须保持一致，否则样式或配置会读错文件。

### 3. 先定义组件的默认配置

开发时不要一上来就写死视觉或业务值，先确定组件对外开放哪些配置。

建议至少分成这几类：

1. 数据字段
   比如 `title`、`value`、`text`、`items`
2. 显示开关
   比如 `flags.showHeader`
3. 布局参数
   比如 `layout.padding`、`layout.radius`
4. 颜色参数
   比如 `colors.light` / `colors.dark`
5. 单卡内联样式入口
   比如 `styles.root`、`styles.title`

组件要把这些默认值同时写到两处：

1. `index.js` 里的 fallback 对象
2. `config.json` 文件

这样做的目的：

1. 没有加载配置文件时仍然可用
2. 加载配置文件后可以统一覆盖默认风格

### 4. 使用 `core/config` 创建配置作用域

标准写法是：

```js
const createConfigController = require("../core/config");
const config = createConfigController();

const widgetConfig = config.createScope({
  path: "TesseraScript/components/your-component/config.json",
  fallback: defaultWidgetConfig,
});
```

然后提供两个辅助导出：

```js
module.exports.loadConfig = loadWidgetConfig;
module.exports.getDefaultConfig = widgetConfig.get;
```

这样用户可以主动预加载配置，也可以查看默认配置。

### 5. 使用 `core/css` 管理样式

组件自己的 CSS 应放在当前组件目录下，并通过 `css.ensure(...)` 加载：

```js
const createCSSController = require("../core/css");
const css = createCSSController();
let stylePromise = null;
```

再写一个固定的 `ensureStyles()`：

1. 首次调用时注入样式
2. 后续重复调用不重复插入
3. 加载失败时打印 warning

这样做的原因是 Dataview 页面里很可能会多次调用同一个组件，但样式只应注入一次。

### 6. 使用 `core/dom` 创建元素

不要在组件里手写大量 `document.createElement(...)` + `classList.add(...)` + `style.xxx = ...` 的样板代码。

优先使用：

```js
dom.createElement(tagName, {
  className,
  attrs,
  style,
  text,
  html,
  children,
})
```

这能让组件结构更稳定，也和现有组件风格一致。

### 7. 组件必须直接返回 HTML 元素

组件的主导出应该是一个函数，例如：

```js
function statCard(options = {}) {
  return dom.createElement("section", ...);
}
```

并直接导出：

```js
module.exports = statCard;
module.exports.statCard = statCard;
```

用户才能直接：

```js
dv.container.appendChild(statCard({...}));
```

### 8. 暴露可访问的子节点

如果组件内部有多个结构块，例如：

1. 根节点
2. title
3. body
4. content
5. footer

建议在返回节点前把关键节点挂到根元素上，例如：

```js
root.parts = {
  title,
  body,
  footer,
};
```

这样调用方可以在拿到组件后继续做轻量调整：

```js
const node = statCard({...});
node.parts.title.textContent = "Updated";
```

这是 DataviewJS 场景下非常实用的一种扩展方式。

### 9. 区分公共样式和单实例样式

组件开发时要明确两个层次：

1. 公共结构样式写进 `style.css`
2. 单个实例可能变化的样式，通过内联 style 或 CSS 变量挂到根元素

原因是一个页面里可能同时出现很多个同类组件，但每个组件视觉又可能不同。

例如：

1. `padding`、`radius`、主题变量入口，适合写成根节点 CSS 变量
2. `display`、子元素布局规则、默认字号、默认交互，适合写进 `style.css`

此外，还需要注意css的明明格式，需要以 ts-<组件名> 的形式开头，用于样式的变量也需要以 --ts-<组件名> 来开头

### 10. 兼容 Obsidian 日间和夜间模式

Obsidian 会在 `body` 上挂：

1. `theme-light`
2. `theme-dark`

因此组件至少应提供两套默认颜色：

```js
colors: {
  light: { ... },
  dark: { ... },
}
```

CSS 中再根据主题切换当前变量：

```css
body.theme-light .your-component { ... }
body.theme-dark .your-component { ... }
```

推荐保留共享颜色覆盖能力，也就是继续支持扁平颜色字段同时覆盖两套主题。这样开发者在单卡上动态算颜色时会更方便。

### 11. 让配置和传参都能覆盖默认值

标准调用顺序通常是：

1. 内置 fallback 默认值
2. `config.json` 里的默认配置
3. 用户调用组件时传入的 `options`

因此在组件函数里通常这样写：

```js
const resolved = widgetConfig.merge(options);
```

这样单次调用就可以覆盖全局默认配置。

### 12. 给正式组件补入口注册

当一个新组件完成后，除了组件目录本身，还要同步处理两个入口文件。

#### `TesseraScript/tessera.bootstrap.js`

在 alias 里注册，例如：

```js
alias({
  "stat-card": "components/stat-card",
});
```

如果想和现有风格统一，也可以用组件短名作为 alias。

#### `TesseraScript/index.js`

在聚合导出里加入：

```js
const statCard = require("components/stat-card");

module.exports = {
  ...,
  statCard: statCard.statCard || statCard,
};
```

这样用户既可以单独加载组件，也可以统一加载组件集合。

### 13. 写 `demo.md`

每个组件都应有完整示例。至少要包含：

1. 加载顺序
2. 最小示例
3. 常见配置示例
4. 单实例颜色覆盖示例
5. 多实例并排示例
6. 日/夜主题相关示例

`demo.md` 的作用不是只证明“能跑”，而是帮助未来开发者快速知道组件怎么用、怎么测、怎么观察视觉变化。

### 14. 写 `README.md`

`README.md` 不是简单介绍，而应该是 API 参考。

建议至少包含：

1. 组件用途
2. 核心特点
3. 加载方式
4. 基础字段说明
5. `flags`、`layout`、`colors`、`styles` 的字段说明
6. 返回值说明
7. 示例片段
8. 配置加载方式

### 15. 做最小验证

开发完成后，至少做下面这些检查：

1. `index.js` 语法正确
2. `config.json` 是合法 JSON
3. `demo.md` 里的示例字段与真实 API 一致
4. 在 Obsidian 的 light/dark 模式下都能看清内容
5. 同一页面放多个实例时，单卡内联样式不会互相污染

## 模板本身提供了什么

当前模板已经内置了以下能力：

1. `ensureStyles()` 样式按 id 注入一次
2. `loadExampleConfig()` 配置加载
3. `exampleConfig.merge(options)` 配置合并
4. `colors.light` / `colors.dark` 双主题默认色
5. 旧式扁平颜色字段兼容
6. `root.parts` 子节点暴露
7. `styles.*` 单实例内联覆盖入口

## 最小使用示例

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/core/config");
await dv.view("TesseraScript/components/example/index");

const example = Tessera.use("example");

const node = example({
  eyebrow: "Template",
  title: "New Component Scaffold",
  text: "This component already includes config, CSS, theme, and parts exposure.",
  content: "Replace this content with your real structure.",
});

node.parts.title.textContent = "Title Updated After Render";

dv.container.appendChild(node);
```

## 正式开发时需要改掉的地方

复制模板后，至少需要替换这些内容：

1. 模块 id：`components/example`
2. CSS id：`components-example`
3. 配置路径：`TesseraScript/components/example/config.json`
4. 样式路径：`TesseraScript/components/example/style.css`
5. 类名前缀：`.ts-example`
6. 导出函数名：`example`
7. README、demo 中的组件说明

这些名字如果漏改，未来复制第二个组件时很容易冲突。
