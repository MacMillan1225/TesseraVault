# example

`example` 是一个模板组件，用来作为未来新组件开发的起点。

## 用途

- 演示标准的 `Tessera.define(...)` 写法
- 演示自动样式注入的固定写法
- 演示最小 DOM 结构与 CSS 类名前缀

## 加载顺序

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/example/index");
```

## 使用方式

```dataviewjs
const example = Tessera.require("components/example");

dv.container.appendChild(
  example({
    eyebrow: "Scaffold",
    title: "My New Component",
    text: "Duplicate this component and rename it for real use.",
  })
);
```

## 导出形式

```js
module.exports = example;
module.exports.example = example;
```
