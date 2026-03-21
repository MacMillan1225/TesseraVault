# Dashboard Common CSS 说明

文件：`Scripts/dashboard_common_css.js`

用途：

- 抽离面板里可复用的通用卡片样式
- 统一 `card` / `card-header` / `card-title` / `card-subtitle` 这些命名
- 让主页、Gym、其他看板都能共享相同外层容器结构

---

## 提供的通用类

### 1. 外层卡片

```html
<div class="card">
  ...
</div>
```

也兼容旧类名：

```html
<div class="dash_card">
  ...
</div>
```

推荐新写法直接使用：

```html
<div class="card dash_card">
  ...
</div>
```

---

### 2. 标题区

```html
<div class="card-header">
  <div class="card-title">标题</div>
  <div class="card-subtitle">SUBTITLE</div>
</div>
```

为了兼容旧代码，也保留：

- `card_header`
- `card_title`
- `card_subtitle`

所以你也可以混写：

```html
<div class="card-header card_header">
  <div class="card-title card_title">标题</div>
  <div class="card-subtitle card_subtitle">SUBTITLE</div>
</div>
```

---

### 3. 内容区

```html
<div class="card-body">
  ...
</div>
```

适合你后续继续拆各种面板组件。

---

## 当前已完成的重构

### 主页热力图

主页里的热力图已经：

- 不再手写 month/week/grid/tooltip/legend 渲染逻辑
- 改为调用：`window.HeatmapTemplate.render(...)`
- 外层使用通用 `card` 样式承载

这意味着后续 Gym 页、其他统计页也可以采用同样结构：

1. 外层使用通用 `card`
2. 内部内容模块化调用

---

## 推荐复用模式

```dataviewjs
await dv.view("Scripts/dashboard_runtime", { autorender: false });

const config = await window.DashboardRuntime.loadConfig({
  settings: {},
  fonts: {
    enableWebFonts: false,
    cacheFonts: true,
    cacheDir: ".obsidian/cache/dashboard-fonts",
    families: {}
  },
  theme: { light: {}, dark: {} }
});

await dv.view("Scripts/dashboard_common_css", { config });

const card = document.createElement("div");
card.className = "card";

const header = document.createElement("div");
header.className = "card-header";
header.innerHTML = `
  <div class="card-title">📊 我的模块</div>
  <div class="card-subtitle">MODULE</div>
`;

const body = document.createElement("div");
body.className = "card-body";

card.appendChild(header);
card.appendChild(body);
dv.container.appendChild(card);
```

如果你的页面还有专属样式，建议继续通过独立脚本注入，例如：

```dataviewjs
await dv.view(config.settings.scriptPath, { config });
```

主页目前对应 `Scripts/mainpage_dashboard_css`，Gym 页对应 `Scripts/gym_dashboard_css`。

---

## 建议

后续如果你继续模块化，我建议慢慢统一为这套命名：

- `card`
- `card-header`
- `card-title`
- `card-subtitle`
- `card-body`

旧类名继续兼容即可，这样不会一次性改动太大。
