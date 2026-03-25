# example demo

```dataviewjs
await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/example/index");

const example = Tessera.require("components/example");

dv.container.appendChild(
  example({
    eyebrow: "Demo",
    title: "Example Component",
    text: "If you can see styled content here, the scaffold works.",
  })
);
```
