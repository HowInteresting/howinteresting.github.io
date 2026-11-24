# AGENTS.md

本文件用于约束 AI 助手在本项目（`howinteresting.github.io`）中的开发行为。

## 项目概览

- 技术栈：Vue 3 + Vite + Vue Router + Pinia + Element Plus
- 入口：`src/main.js`（路由注册）、`src/App.vue`
- 页面目录：`src/pages/`
- 静态资源：`public/`
- 开发命令：`npm run dev`；构建：`npm run build`；格式化：`npm run format`

## 现有页面与路由

| 路径 | 路由名称 | 页面文件 |
| --- | --- | --- |
| `/` | 首页 | `src/pages/home.vue` |
| `/firework`、`/yanhua` | 浪漫烟花 | `src/pages/firework.vue` |
| `/poem` | 黑板诗笺 | `src/pages/poem.vue` |
| `/ai` | AI 助手 | `src/pages/ai.vue` |
| 其他 | 页面走丢了 | `src/pages/notFound.vue` |

## 强制规则：页面入口必须同步到 404

**每次新增页面、或对现有页面做功能更新时，必须同步更新以下两个 404 页面中的导航链接，二者缺一不可：**

1. `src/pages/notFound.vue` —— 站内路由未匹配时展示的 Vue 页面
2. `public/404.html` —— 静态托管的 404 兜底页

具体要求：

- 新增页面时，在两个 404 页面的导航区都加上新页面入口，链接文案与路由 `name` 保持一致。
- 页面重命名、删除或路径变更时，同步修改两个 404 页面中的链接与文案，避免出现失效入口。
- 两个 404 页面的入口列表必须保持内容一致，不允许只改其中一个。

## 其他约定

- 新增路由需在 `src/main.js` 中注册，并设置中文路由 `name`（同时用于页面标题）。
- 需要出现在首页「网站列表」的功能页，同步在 `src/assets/siteLinks.json` 中登记。
- 样式继续沿用现有页面风格（深色背景、圆角胶囊按钮、`scoped` SCSS）。
- 不新增无关文件；改动尽量复用现有组件与 `src/api` 中的接口封装。
- 提交前执行 `npm run build` 确认构建通过。
