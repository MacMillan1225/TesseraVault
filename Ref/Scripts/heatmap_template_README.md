# Heatmap Template 模块说明

这个模块位于：`Scripts/heatmap_template.js`

目标：

- 外观和自适应逻辑与主页热力图保持一致
- 允许你为不同项目复用同一套热力图组件
- 可自定义：
  - 数据来源
  - 颜色选择函数
  - tooltip 渲染内容
  - 展示范围与标签
  - 图例字符串
- 默认只输出：
  - 热力图主体
  - 可选图例
- **不带标题、不带卡片壳、不加外围 margin，方便嵌入任意布局**

---

## 一、最推荐的调用方式

在任意 `dataviewjs` 中直接这样调用：

```dataviewjs
const wrap = document.createElement("div");
dv.container.appendChild(wrap);

await dv.view("Scripts/heatmap_template", {
  container: wrap,
  getData: async ({ start, end, utils }) => {
    const map = new Map();
    let cur = utils.normalizeDate(start);
    while (cur <= end) {
      const key = utils.toDateKey(cur);
      map.set(key, {
        total: 4,
        completed: Math.floor(Math.random() * 5)
      });
      cur = utils.addDays(cur, 1);
    }
    return map;
  }
});
```

如果不传 `container`，模块会默认直接渲染到 `dv.container`。

---

## 二、`config` 是什么？

`config` 不是内置变量，它只是一个**可选配置对象**，通常来自 `dashboard_config.json`。

它主要用于继承：

- `fonts`
- `theme`

如果你没定义 `config`，就不要写：

```js
config,
```

否则会报：

```js
ReferenceError: config is not defined
```

### 最简单写法

不用 `config`，直接调用即可。

### 如果你要加载 `config`

推荐统一通过共享运行时加载：

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
```

然后再传给热力图模块。

> 说明：`dashboard_runtime` 内部会按需加载 `dashboard_config_loader` 和 `font_manager`，因此页面脚本通常不需要再手动调用这两个底层模块。

### 如果你需要某个配置分区

例如 Gym 看板使用 `dashboard_config.json` 里的 `gymDashboard`：

```dataviewjs
const config = await window.DashboardRuntime.loadConfig(defaultConfig, {
  sectionKey: "gymDashboard"
});
```

---

## 三、模块支持的主要参数

```js
await dv.view("Scripts/heatmap_template", {
  container,          // 可选，挂载容器
  config,             // 可选，继承 dashboard_config.json 中的字体/主题
  theme,              // 可选，覆盖热力图主题颜色
  settings,           // 可选，控制布局/范围/标签
  data,               // 可选，直接传 Map 或对象
  getData,            // 可选，异步/同步数据函数
  getCellStyle,       // 可选，单格颜色/等级函数
  renderTooltip,      // 可选，悬浮提示内容函数
  showLegend,         // 可选，是否显示图例
  legend              // 可选，图例字符串；空字符串/null/false 表示关闭
});
```

---

## 四、settings 可用字段

```js
settings: {
  showWeekLabels: true,     // 是否显示左侧星期标签
  showMonthLabels: true,    // 是否显示顶部月份标签
  minWeeks: 5,              // adaptive 模式下最少展示周数
  cellSize: 11,             // 单元格尺寸
  cellGap: 2,               // 单元格间距
  mondayFirst: true,        // 是否按周一对齐
  rangeMode: "adaptive",   // adaptive | fixed-days | fixed-range
  fixedDays: 84,            // fixed-days 模式下生效
  tooltipId: "my-tooltip", // tooltip DOM id
  locale: "zh-CN",         // 日期本地化
  weekLabels: ["一", "", "三", "", "五", "", "日"],
  monthNames: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  legend: "Less $#f1f5f9$$#bbf7d0$$#4ade80$$#15803d$ More"
}
```

---

## 五、范围模式说明

### 1）`adaptive`
- 默认模式
- 完全仿照主页热力图
- 根据容器宽度自动决定展示多少周

### 2）`fixed-days`
- 按固定天数展示，比如最近 84 天

### 3）`fixed-range`
- 手动传 `startDate` 和 `endDate`

---

## 六、图例字符串怎么写

现在图例支持直接传一个字符串，示例：

```js
legend: "less $#e2e8f0$$#93c5fd$$#22c55e$$#15803d$ more"
```

规则：

- 普通文字按文本显示
- `$#xxxxxx$` 会被识别为一个颜色方块

比如：

```js
legend: "少 $#e2e8f0$$#93c5fd$$#22c55e$$#15803d$ 多"
```

会渲染成：

- `少`
- 4 个颜色块
- `多`

### 关闭图例

以下任一写法都会完全关闭图例，且 **不占空间**：

```js
legend: ""
legend: null
legend: false
showLegend: false
```

---

## 七、主题颜色如何改

```dataviewjs
await dv.view("Scripts/heatmap_template", {
  theme: {
    light: {
      dayBg: "#f8fafc",
      tooltip: "#ffffff",
      tooltipBg: "#111827",
      levels: [
        "#f8fafc",
        "#dbeafe",
        "#bfdbfe",
        "#93c5fd",
        "#60a5fa",
        "#3b82f6",
        "#2563eb",
        "#1d4ed8",
        "#1e3a8a"
      ]
    },
    dark: {
      dayBg: "#334155",
      tooltip: "#0f172a",
      tooltipBg: "#f8fafc",
      levels: [
        "#334155",
        "#172554",
        "#1e3a8a",
        "#1d4ed8",
        "#2563eb",
        "#3b82f6",
        "#60a5fa",
        "#93c5fd",
        "#bfdbfe"
      ]
    }
  },
  legend: "Less $#f8fafc$$#93c5fd$$#3b82f6$$#1e3a8a$ More"
});
```

---

## 八、如何自定义“颜色函数”

你可以通过 `getCellStyle` 决定每个格子的颜色。

它支持返回：

- 数字：`4` → 使用 `level 4`
- 字符串：`"#22c55e"` → 直接使用该颜色
- 对象：`{ level: 4 }`、`{ color: "#22c55e" }`、`{ level: 4, className: "xxx" }`

### 示例 1：按数值比例映射颜色

```dataviewjs
await dv.view("Scripts/heatmap_template", {
  legend: "弱 $#e2e8f0$$#bfdbfe$$#60a5fa$$#1d4ed8$ 强",
  settings: {
    rangeMode: "adaptive",
    fixedDays: 84,
    locale: "zh-CN",
  },
  getData: async ({ start, end, utils }) => {
    const map = new Map();
    let cur = utils.normalizeDate(start);
    while (cur <= end) {
      map.set(utils.toDateKey(cur), { value: Math.random() * 100 });
      cur = utils.addDays(cur, 1);
    }
    return map;
  },
  getCellStyle: ({ entry, theme, utils }) => {
    const color = utils.pickScaleColor(entry?.value, theme.light.levels, { min: 0, max: 100 });
    return { color };
  }
});
```

### 示例 2：按枚举类别映射颜色

```dataviewjs
await dv.view("Scripts/heatmap_template", {
  legend: "状态 $#e2e8f0$$#93c5fd$$#fbbf24$$#22c55e$$#f87171$ 强",
  getData: async ({ start, end, utils }) => {
    const statuses = ["none", "planned", "doing", "done", "skipped"];
    const map = new Map();
    let cur = utils.normalizeDate(start);
    while (cur <= end) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      map.set(utils.toDateKey(cur), { status });
      cur = utils.addDays(cur, 1);
    }
    return map;
  },
  getCellStyle: ({ entry, utils }) => ({
    color: utils.pickEnumColor(entry?.status, {
      none: "#e2e8f0",
      planned: "#93c5fd",
      doing: "#fbbf24",
      done: "#22c55e",
      skipped: "#f87171"
    }, "#e2e8f0")
  })
});
```

---

## 九、如何自定义数据函数

`getData` 的职责是返回一个 `Map` 或普通对象，键必须是日期字符串：

- `YYYY-MM-DD`

例如：

```js
return new Map([
  ["2026-03-01", { total: 5, completed: 3 }],
  ["2026-03-02", { total: 4, completed: 4 }]
]);
```

或者：

```js
return {
  "2026-03-01": { status: "done", sets: 18 },
  "2026-03-02": { status: "planned", sets: 12 }
};
```

模块不会限制 entry 的结构，你可以自由放字段。

---

## 十、如何自定义 tooltip

```dataviewjs
await dv.view("Scripts/heatmap_template", {
  legend: "",
  getData: async () => ({
    "2026-03-01": { status: "done", sets: 18, focus: "胸部" }
  }),
  getCellStyle: ({ entry, utils }) => ({
    color: utils.pickEnumColor(entry?.status, {
      done: "#22c55e",
      planned: "#60a5fa",
      skipped: "#f87171"
    }, "#e2e8f0")
  }),
  renderTooltip: ({ entry, dateKey }) => `
    <span class="hmtpl-tooltip-main">${entry?.focus || "未设置部位"}</span>
    <span class="hmtpl-tooltip-main">状态：${entry?.status || "无记录"}</span>
    <span class="hmtpl-tooltip-main">总组数：${entry?.sets || 0}</span>
    <span class="hmtpl-tooltip-date">${dateKey}</span>
  `
});
```

---

## 十一、一个适合 Gym 的实例

```dataviewjs
const gymWrap = document.createElement("div");
dv.container.appendChild(gymWrap);

await dv.view("Scripts/heatmap_template", {
  container: gymWrap,
  settings: {
    rangeMode: "fixed-days",
    fixedDays: 84,
    locale: "zh-CN",
    weekLabels: ["一", "", "三", "", "五", "", "日"],
    monthNames: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
  },
  legend: "少 $#e2e8f0$$#93c5fd$$#fbbf24$$#22c55e$$#f87171$ 多",
  getData: async ({ utils }) => {
    const pages = dv.pages('"Gym/01-Daily-Plans"')
      .where(p => p.type === "workout-plan" && p.date)
      .array();

    const map = new Map();
    pages.forEach(p => {
      map.set(utils.toDateKey(p.date), {
        status: p.status,
        focus: p.primary_focus,
        sets: p.total_sets || 0
      });
    });
    return map;
  },
  getCellStyle: ({ entry, utils }) => ({
    color: utils.pickEnumColor(entry?.status, {
      planned: "#93c5fd",
      doing: "#fbbf24",
      done: "#22c55e",
      skipped: "#f87171"
    }, "#e2e8f0")
  }),
  renderTooltip: ({ entry, dateKey }) => `
    <span class="hmtpl-tooltip-main">${entry?.focus || "未设置部位"}</span>
    <span class="hmtpl-tooltip-main">状态：${entry?.status || "无记录"}</span>
    <span class="hmtpl-tooltip-main">总组数：${entry?.sets || 0}</span>
    <span class="hmtpl-tooltip-date">${dateKey}</span>
  `
});
```

---

## 十二、补充说明

1. 该模块默认会挂到全局：`window.HeatmapTemplate`
2. 你也可以先加载脚本，再手动调用：

```js
await dv.view("Scripts/heatmap_template", { autorender: false });
await window.HeatmapTemplate.render({ ... });
```

3. 一般情况下，直接 `await dv.view("Scripts/heatmap_template", {...})` 就够用。
