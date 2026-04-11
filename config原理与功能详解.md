---
title: TesseraScript Config 原理与功能详解
tags:
  - tessera
  - config
  - runtime
---

# TesseraScript Config 原理与功能详解

本文档详细说明 `TesseraScript/core/config.js` 的定位、设计目标、内部原理、对组件作者的约束，以及在 DataviewJS 中的推荐使用方式。

它不是一个“用户设置面板”，而是一个运行时配置控制器。
它的职责是把以下三层配置合并为组件真正使用的最终配置：

1. 组件内部写死的 fallback 默认值
2. 组件目录下 `config.json` 中的结构化默认配置
3. 用户在调用组件时传入的 `options`

## 1. 为什么需要 `core/config.js`

在没有统一配置控制器之前，组件默认值通常散落在 `index.js` 里，例如：

- 标题默认文案写在 JS 中
- 默认颜色写在 JS 或 CSS 中
- 是否显示某个区块通过 `options.xxx ?? true` 临时处理

这种写法在组件数量变多之后，会出现几个问题：

1. 默认值不集中
2. 用户无法直接通过修改 JSON 调整默认行为
3. 同一个组件的默认配置、运行时覆盖、文档示例容易分散
4. 每个组件都重复写一套“默认值合并逻辑”

`core/config.js` 的作用，就是把这部分逻辑收敛为一个统一模块。

## 2. 这个模块解决什么问题

它主要解决四类问题：

### 2.1 让每个组件都可以有自己的 `config.json`

例如：

```text
TesseraScript/components/card/config.json
TesseraScript/components/heatmap/config.json
TesseraScript/components/progress/config.json
```

这些 JSON 文件可以承载组件的结构化默认配置，例如：

- 默认标题
- 默认颜色
- 默认宽度
- 默认间距
- 某个功能开关是否启用

### 2.2 让默认值分层合并，而不是互相覆盖混乱

组件最终用到的配置通常不是只来自一个地方，而是：

```text
fallback 默认值
  + config.json
  + 调用时 options
  = 最终渲染配置
```

这样有两个好处：

1. 即使 `config.json` 缺失，组件仍然能靠 fallback 工作
2. 即使 JSON 中只有少数字段，仍然可以在 fallback 基础上局部覆盖

### 2.3 避免每个组件都重复写深层 merge

例如组件配置常常是这样的：

```js
{
  flags: {
    showHeader: true,
    showMeta: true
  },
  layout: {
    padding: "16px",
    radius: "16px"
  },
  colors: {
    background: "#fff",
    value: "#7c3aed"
  }
}
```

如果用户只改：

```js
{
  colors: {
    value: "#22c55e"
  }
}
```

那么正确行为应该是只覆盖 `colors.value`，而不是把整个 `colors` 或整个配置对象粗暴替换掉。

`core/config.js` 统一负责这件事。

### 2.4 缓存读取结果，避免组件反复读取同一个 JSON

在 DataviewJS 里，如果多次调用组件，不应该每次都重新去 vault 读配置文件。

因此 `config.js` 内部做了基于路径的缓存。

## 3. 模块定位

`core/config.js` 是建立在 `core/file.js` 之上的上层能力。

模块关系如下：

```text
core/file.js
  -> 提供文件读取、JSON 解析能力

core/config.js
  -> 复用 file.js
  -> 负责 fallback / JSON / options 的合并与缓存
```

所以：

- `file.js` 解决“怎么读文件”
- `config.js` 解决“读出来后怎么组织为组件配置”

## 4. 工作原理

`core/config.js` 当前内部可以拆成四个关键部分。

### 4.1 `cloneValue(value)`

作用：深拷贝配置值，避免外部修改缓存对象时污染内部状态。

### 4.2 `mergeConfig(baseConfig, overrideConfig)`

这是配置系统的核心。

合并规则是：

1. 如果覆盖值是 `null` 或 `undefined`，保留基础值
2. 如果基础值不存在，直接取覆盖值
3. 如果任意一边是数组，则数组整体替换
4. 如果两边都是普通对象，则递归深层合并
5. 其他情况按覆盖值替换

### 4.3 `createEntry(path, fallback)`

配置系统内部有一个 `cache: Map`。

每个路径对应一个缓存条目，大致结构是：

```js
{
  path,
  fallback,
  value,
  loaded,
  loading,
  error
}
```

### 4.4 `load(path, options)`

这是异步加载入口。

逻辑大致是：

1. 先建立或获取缓存条目
2. 如果已经加载成功且没有 `force`，直接返回缓存值
3. 如果当前正在加载且没有 `force`，复用当前 Promise
4. 调用 `file.readJson()` 读取 JSON
5. 把 `fallback` 和 JSON 做 merge
6. 更新缓存状态

如果读取失败：

- 默认回退到当前缓存值
- 若 `silent: false`，则把错误继续抛出

## 5. 为什么既要 fallback，又要 JSON

### 5.1 fallback 是组件的“保底运行能力”

即使出现这些情况，组件也不应直接崩掉：

- `config.json` 文件不存在
- JSON 语法写错
- 某次读取失败

### 5.2 JSON 是“可编辑默认配置”

JSON 的作用不是替代所有 JS 默认值，而是提供一个对用户更友好的修改入口。

也就是说：

- fallback 偏“组件作者保底”
- JSON 偏“使用者默认行为调整”

## 6. 为什么要设计 `createScope()`

它适合“一个组件对应一个固定配置文件”的模式。

```js
const cardConfig = config.createScope({
  path: "TesseraScript/components/card/config.json",
  fallback: defaultCardConfig,
});
```

之后就可以简化为：

```js
await cardConfig.load();
const defaults = cardConfig.get();
const resolved = cardConfig.merge(options);
```

## 7. `card()` 里触发加载，为什么还要额外导出 `loadConfig()`

假设组件里写了：

```js
function card(options = {}) {
  loadCardConfig();
  const resolved = cardConfig.merge(options);
  ...
}
```

这表示只是“触发异步加载”，但没有等待它完成。

因此导出 `loadConfig()` 的意义是：

```js
await card.loadConfig();
dv.container.appendChild(card(options));
```

这样才能保证第一次渲染就吃到 `config.json` 中的默认值。

结论：

- 不强求首次就使用 JSON 默认值时，可以不先 `await loadConfig()`
- 强求首次渲染就使用 JSON 默认值时，应该先 `await loadConfig()`

## 8. 路径规则

`core/config.js` 当前使用的是 `core/file.js` 的 vault 路径读取能力，而不是 Tessera 模块系统的模块相对路径解析。

因此推荐写法必须是：

```js
path: "TesseraScript/components/card/config.json"
```

而不是：

```js
path: "./config.json"
```

## 9. 推荐放进 JSON 的内容

适合放进 `config.json` 的内容：

- 文案默认值
- 布局参数
- 颜色参数
- 布尔开关
- 数字阈值
- 简单数组数据

不适合放进 `config.json` 的内容：

- DOM 节点
- 函数
- class 实例
- 运行时上下文对象

## 10. 一句话总结

`core/config.js` 的本质不是“读取一个 JSON 文件”，而是把组件默认值变成一个有层次、有缓存、可覆盖、可维护的运行时配置系统。
