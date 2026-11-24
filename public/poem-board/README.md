# 黑板诗笺

把一首古诗，排成木框黑板字，并导出可以发朋友圈、发给朋友的图片。

- **纯本地生成**：不调用 AI 接口、不需要 API Key、没有后端，诗句不会上传。
- **免费**：个人使用不产生任何费用。
- **字不会错**：用 Canvas + 开源中文手写字体排版，不存在 AI 画错汉字的问题。
- **可分享**：把当前诗句编码进链接，朋友打开就能看到同一幅字，也可以自己改。

![预览](preview.jpg)

---

## 一、本地打开

### 最简单

双击 `index.html`，用 Chrome / Safari 打开即可。

### 推荐：本地服务器

在 `poem-board` 文件夹里双击 **`启动本地预览.command`**，会自动打开：

```
http://127.0.0.1:8765/
```

也可以手动运行：

```bash
cd poem-board
python3 -m http.server 8765
```

然后浏览器访问 `http://127.0.0.1:8765/`。

> 直接双击 `index.html` 也能出图；但「复制分享链接」得到的是 `file://...` 本机路径，发给朋友打不开。想分享链接，请用本地服务器或部署到网上。

---

## 二、免费分享到网上（推荐 Netlify Drop）

整个 `poem-board` 文件夹就是成品，**不需要构建、不需要安装依赖**。

### 方案 A：Netlify Drop（最省事）

1. 打开 <https://app.netlify.com/drop>。
2. 用邮箱或 GitHub 注册/登录一个免费账号（不需要信用卡）。
3. 把整个 `poem-board` 文件夹拖进网页。
4. 等几秒，会得到一个 `https://xxxx.netlify.app` 网址。
5. 把这个网址发给朋友即可。免费额度对个人使用完全够用。

以后想更新：重新把文件夹拖进 Netlify 的 Deploys 页面即可。

### 方案 B：Cloudflare Pages

1. 登录 <https://dash.cloudflare.com/>。
2. 进入 **Workers & Pages → Create → Pages → Upload assets**。
3. 项目名随便取，把 `poem-board` 文件夹拖进去，Deploy。
4. 得到 `https://项目名.pages.dev`。

### 方案 C：GitHub Pages

1. 新建一个公开仓库。
2. 把 `poem-board` 里的文件按原目录结构上传（`index.html` 必须在仓库根目录）。
3. 仓库 **Settings → Pages → Deploy from a branch → main / (root)**。
4. 得到 `https://用户名.github.io/仓库名/`。

### 方案 D：Vercel

安装 Node 后，在 `poem-board` 目录运行：

```bash
npx vercel
```

按提示登录，一路回车即可。免费个人套餐足够。

---

## 三、使用说明

1. 在左侧（手机上是下方）改诗题、作者、诗句。
2. 点「智能分行」，会把一段连着的诗按句意分成两行一组；也可以自己手动换行。
3. 用 `**诗句**` 标出想用彩色粉笔写的重点，例如：

   ```
   床前明月光，疑是地上霜。
   **举头望明月，低头思故乡。**
   ```

4. 选黑板色、木框色、画幅、行距、角落小画、印章等。
5. 点「下载图片」得到高清图：
   - 默认 **JPG · 2×（3600 × 2400）**，约 1 MB，发微信更快；
   - 需要最高画质可选 **PNG**，约 13 MB。
6. 点「复制图片」可以直接粘贴到微信 / 文档里。
7. 点「复制分享链接」会生成带当前诗句的链接；朋友打开就能看到同一幅字。

### 小提示

- 发送图片前建议选 JPG，微信压缩后仍然清楚。
- 分享链接里的诗是编码在 `#p=...` 里的，不会经过服务器；链接较长是正常的。
- 如果微信打开后是旧页面，下拉刷新或清除缓存即可。
- 手机上点一下预览图，可以全屏查看。

---

## 四、想改点什么

所有文件都是普通的 HTML / CSS / JS，没有框架、没有编译步骤。

| 想改 | 改哪里 |
| --- | --- |
| 首页示例诗 | `js/app.js` 顶部的 `PRESETS` |
| 默认诗、默认颜色 | `js/app.js` 顶部的 `DEFAULTS` |
| 黑板 / 木框 / 粉笔配色 | `js/render.js` 顶部的 `BOARD_COLORS`、`WOOD_COLORS`、`CHALK_COLORS`、`ACCENT_COLORS` |
| 字体 | `css/style.css` 的 `@font-face` 和 `js/render.js` 的 `FONT_FAMILY` |
| 界面文案 | `index.html` |

字体是开源的 **马善政毛笔楷书（Ma Shan Zheng）**，SIL Open Font License 1.1，许可证在 `assets/fonts/OFL.txt`。字体约 3.1 MB，第一次打开会稍慢，之后浏览器会缓存。

---

## 五、说明

- 本项目**仅供个人自用**：自己写诗、做图、发给朋友；请不要拿去售卖或做成付费服务。
- 线上托管用的是 Netlify / Cloudflare / GitHub 等平台的免费额度，平台政策和额度以其官网为准。
- 代码和字体可以自由修改；字体请保留 `OFL.txt`。
- 没有账号系统、没有数据库、没有埋点，诗句只存在你的浏览器和分享链接里。
