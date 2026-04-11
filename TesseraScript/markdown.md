# TesseraScript 配置系统说明

`core/config.js` 提供了一套通用配置控制器，用来让组件从对应的 `config.json` 读取默认配置，并与用户传参做结构化合并。

## 适用场景

- 每个组件有自己的 `config.json`
- JSON 中维护默认颜色、宽度、开关项等结构化配置
- 运行时允许用户继续传参覆盖局部字段

## 核心能力

- 深层合并对象配置
- 按路径读取 JSON 文件
- 读取结果缓存
- 支持 fallback 内置默认值
- 组件可先用 fallback 渲染，再异步加载 JSON

## 基础用法

先加载核心模块：

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/config");
```

在组件中使用：

```js
const createConfigController = require("../core/config");
const config = createConfigController();

const componentConfig = config.createScope({
  path: "TesseraScript/components/demo/config.json",
  fallback: {
    title: "Demo",
    flags: {
      enabled: true,
    },
    colors: {
      accent: "#8b5cf6",
    },
  },
});
```

## 常见 API

### `config.merge(base, override)`

深层合并两个配置对象：

```js
const result = config.merge(
  { colors: { accent: "#000" }, flags: { enabled: true } },
  { colors: { accent: "#f00" } }
);
```

结果：

```js
{
  colors: { accent: "#f00" },
  flags: { enabled: true }
}
```

### `await scope.load()`

从 JSON 文件加载默认配置，并与 `fallback` 合并。

```js
await componentConfig.load();
```

如果文件不存在或解析失败：

- 默认回退到 `fallback`
- 若你希望把错误抛出来，使用 `await componentConfig.load({ silent: false })`

### `scope.get()`

获取当前缓存中的默认配置：

```js
const defaults = componentConfig.get();
```

### `scope.merge(userOptions)`

将当前默认配置与用户配置合并，得到最终渲染配置：

```js
const resolved = componentConfig.merge({
  title: "Custom Title",
  colors: {
    accent: "#22c55e",
  },
});
```

## card 组件示例

`components/card/index.js` 已接入这套机制，对应配置文件为：

`TesseraScript/components/card/config.json`

使用方式：

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
    title: "Runtime Title",
    value: 128,
    colors: {
      value: "#7c3aed",
    },
    flags: {
      showMeta: false,
    },
  })
);
```

## 推荐约定

- 每个组件目录放一个 `config.json`
- JS 中保留一份 `fallback`，避免文件缺失时组件完全不可用
- 可配置项尽量按语义分组，例如：`flags`、`layout`、`colors`
- 数组默认按“整体替换”处理，不做逐项深合并
