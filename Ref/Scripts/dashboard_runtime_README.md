# Dashboard Runtime 总说明

文件：`Scripts/dashboard_runtime.js`

这个模块是当前整套 dashboard 脚本的**共享运行时入口**。

它的目标是把原本分散在各页面里的这些重复逻辑统一起来：

- 确保依赖脚本已加载
- 统一读取 `dashboard_config.json`
- 统一处理分区配置覆盖
- 统一注入 / 替换样式
- 让主页、Gym 看板、热力图等模块按同一种方式协作

---

## 一、当前模块关系

### 1. 运行时入口

- `Scripts/dashboard_runtime.js`

提供：

- `ensureView()`
- `ensureConfigLoader()`
- `ensureFontManager()`
- `loadConfig()`
- `replaceStyle()`
- `removeStyle()`

对外统一挂载为：

```js
window.DashboardRuntime
```

---

### 2. 配置读取模块

- `Scripts/dashboard_config_loader.js`

负责：

- 读取 `dashboard_config.json`
- 与页面传入的 `defaultConfig` 合并
- 合并 `settings / fonts / theme`

通常**不建议页面直接调用**，而是通过：

```js
window.DashboardRuntime.loadConfig(...)
```

---

### 3. 字体管理模块

- `Scripts/font_manager.js`

负责：

- 解析字体配置
- 远程字体缓存
- 生成 `@font-face` / CSS 变量上下文

通常也不建议页面手动先加载它，而是通过：

```js
await window.DashboardRuntime.ensureFontManager();
```

---

### 4. 通用样式模块

- `Scripts/dashboard_common_css.js`

负责提供可复用的：

- `card`
- `card-header`
- `card-title`
- `card-subtitle`
- `card-body`

兼容旧类名：

- `dash_card`
- `card_header`
- `card_title`
- `card_subtitle`

---

### 5. 页面专属样式模块

当前主要有：

- `Scripts/mainpage_dashboard_css.js`
- `Scripts/gym_dashboard_css.js`

它们负责各页面自己的布局与视觉细节。

---

### 6. 功能型组件模块

当前典型代表：

- `Scripts/heatmap_template.js`

负责把热力图做成可复用组件，而不是把渲染逻辑散落在页面里。

---

## 二、推荐的调用层次

建议把依赖关系理解成这样：

```text
页面 dataviewjs
  ├─ dashboard_runtime
  │    ├─ dashboard_config_loader
  │    └─ font_manager
  ├─ dashboard_common_css
  ├─ 页面专属 css 脚本
  └─ 功能型组件（如 heatmap_template）
```

也就是说：

- 页面先加载 `dashboard_runtime`
- runtime 再按需拉起配置与字体依赖
- 页面继续加载通用样式 / 页面样式 / 功能组件

---

## 三、页面推荐写法

## 1. 最基础的页面骨架

```dataviewjs
await dv.view("Scripts/dashboard_runtime", { autorender: false });

const defaultConfig = {
  settings: {
    scriptPath: "Scripts/mainpage_dashboard_css"
  },
  fonts: {
    enableWebFonts: false,
    cacheFonts: true,
    cacheDir: ".obsidian/cache/dashboard-fonts",
    families: {}
  },
  theme: {
    light: {},
    dark: {}
  }
};

const config = await window.DashboardRuntime.loadConfig(defaultConfig);

await dv.view("Scripts/dashboard_common_css", { config });
await dv.view(config.settings.scriptPath, { config });
```

这是最推荐的入口方式。

---

## 2. 使用配置分区

如果 `dashboard_config.json` 里有某个页面专属分区，例如：

```json
{
  "gymDashboard": {
    "scriptPath": "Scripts/gym_dashboard_css",
    "pageSize": 8
  }
}
```

那么页面可以这样读取：

```dataviewjs
const config = await window.DashboardRuntime.loadConfig(defaultConfig, {
  sectionKey: "gymDashboard"
});
```

效果是：

- 先得到全局默认配置
- 再把 `gymDashboard` 合并进 `config.settings`

---

## 四、各页面当前推荐模式

### 主页

入口文件：`主页.md`

当前模式：

1. 加载 `dashboard_runtime`
2. 调用 `DashboardRuntime.loadConfig(defaultConfig)`
3. 读取 `config.settings.scriptPath`
4. 加载 `Scripts/mainpage_dashboard_css`
5. 加载 `Scripts/dashboard_common_css`
6. 按需调用 `Scripts/heatmap_template`

---

### Gym 看板

入口文件：`Gym/99-Dashboards/健身计划看板.md`

当前模式：

1. 加载 `dashboard_runtime`
2. 调用 `DashboardRuntime.loadConfig(defaultConfig, { sectionKey: "gymDashboard" })`
3. 加载 `Scripts/dashboard_common_css`
4. 加载 `Scripts/heatmap_template`
5. 通过 `config.settings.scriptPath` 加载 `Scripts/gym_dashboard_css`

---

## 五、样式脚本怎么写

页面样式脚本推荐遵循这套结构：

```js
const config = input.config || {};

if (!window.DashboardRuntime) {
  await dv.view("Scripts/dashboard_runtime", { autorender: false });
}

await window.DashboardRuntime.ensureFontManager();

const fontCtx = await window.DashboardFontManager.prepareFonts(config.fonts || {}, {
  cssVarPrefix: "dash"
});

window.DashboardRuntime.replaceStyle("custom-style-id", `
${fontCtx.fontCSS}
/* your css */
`);
```

关键点：

- 不要每个脚本重复手写配置读取逻辑
- 不要每个脚本都自己散写 style 标签管理
- 优先复用 `DashboardRuntime.replaceStyle()`

---

## 六、什么时候直接用底层模块

一般情况下：

- 页面脚本 → 用 `dashboard_runtime`
- 底层模块 → 可以彼此独立存在

直接使用底层模块只适合这些情况：

- 你在调试 `dashboard_config_loader.js`
- 你在单独测试 `font_manager.js`
- 你想把某个底层能力拿去别的地方复用

正常页面开发时，优先统一走 runtime。

---

## 七、迁移旧脚本时的检查清单

如果你后面还要继续把旧 dashboard 页面迁到这套结构，建议检查：

- [ ] 页面是否先加载了 `Scripts/dashboard_runtime`
- [ ] 是否改为 `window.DashboardRuntime.loadConfig(...)`
- [ ] 是否删除了手写 `dashboard_config.json` 读取逻辑
- [ ] 是否使用 `config.settings.scriptPath`
- [ ] 是否通过 `DashboardRuntime.ensureFontManager()` 处理字体依赖
- [ ] 是否通过 `DashboardRuntime.replaceStyle()` 管理样式
- [ ] 是否能复用 `dashboard_common_css`
- [ ] 是否可以把内部组件抽到独立脚本中

---

## 八、当前这套结构的收益

统一后，主要好处有：

- 页面代码更短
- 配置入口更明确
- 样式脚本职责更单一
- 多个 dashboard 之间更容易复用
- 后续扩展新页面时，只需要沿用同一模式

---

## 九、相关文件索引

- `Scripts/dashboard_runtime.js`：共享运行时入口
- `Scripts/dashboard_config_loader.js`：底层配置读取器
- `Scripts/font_manager.js`：底层字体管理器
- `Scripts/dashboard_common_css.js`：通用卡片样式
- `Scripts/mainpage_dashboard_css.js`：主页样式
- `Scripts/gym_dashboard_css.js`：Gym 看板样式
- `Scripts/heatmap_template.js`：热力图模板组件
- `主页.md`：主页入口页面
- `Gym/99-Dashboards/健身计划看板.md`：Gym 看板入口页面

如果后面还继续拆模块，建议都围绕 `dashboard_runtime` 作为统一入口来组织。
