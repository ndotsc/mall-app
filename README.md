# mall-app

![CI](https://github.com/ndotsc/mall-app/actions/workflows/ci.yml/badge.svg)

uni-app 多端商城客户端：一套 Vue 3 代码同时产出 **H5** 与 **微信小程序**（App 端后续用同一套代码打包）。配合后端 [mall-api](https://github.com/ndotsc/mall-api) 运行。

## 环境要求

- Node 20+，**npm**（本仓库是 `package-lock.json`；`mall-web` 才是 pnpm）
- 后端 mall-api 已启动（默认 `http://localhost:3000`）
- 微信小程序预览需要「微信开发者工具」（H5 端不需要）

## 安装与运行

```bash
npm install           # 安装依赖
npm run dev:h5        # H5 开发服务器，浏览器直接调试
npm run dev:mp-weixin # 编译到 dist/dev/mp-weixin，用微信开发者工具导入
npm run build:h5      # 产出 dist/build/h5（可静态托管）
npm run build:mp-weixin # 产出 dist/build/mp-weixin（上传小程序用）
```

小程序端首次导入：微信开发者工具 →「导入项目」→ 目录选 `dist/dev/mp-weixin`，个人主体可用**测试号**（无需 AppID）。本地调试需在「设置 → 项目设置」勾选**不校验合法域名**，否则 `localhost` 请求会被拦截。

## 接口配置

`src/utils/request.js` 的基址可配：复制 `.env.example` 为 `.env`，改 `VITE_API_BASE` 即可，默认 `http://localhost:3000/api`。

```bash
cp .env.example .env
```

- H5 本地联调：保持默认（后端跨域白名单默认放行 `http://localhost:5173`）。
- 小程序真机 / 线上 H5：必须改成 https 域名，并在小程序后台把它配成 request 合法域名。

## 目录结构

```
src/
├── api/goods.js        # 商品/分类接口封装
├── components/         # D26 自研组件（easycom 自动引入，页面无需 import）
│   ├── smart-image/    # 图片懒加载 + 加载失败兜底
│   ├── page-skeleton/  # 骨架屏
│   └── error-state/    # 错误态 + 重试按钮
├── pages/index/        # 首页（Hero + 搜索 + 商品网格 + 触底加载）
├── utils/request.js    # uni.request 封装（统一取 data、错误提示、超时 + GET 缓存）
├── utils/image.js      # 图片 URL 归一 + CDN 接入点
├── pages.json          # 页面路由 + 全局窗口样式 + easycom
└── manifest.json       # 应用配置（AppID、名称、各端差异）
```

## 关键约定

- **请求必须用 `uni.request`**：小程序环境没有 `XMLHttpRequest`，axios 在端上跑不起来。
- **统一响应**：后端返回 `{ code, message, data }`，`code === 0` 才取 `data`，其余统一 toast。
- **金额**：接口给的是「分」，展示时 `/100` 转元，不在前端做运算。
- **分页**：首页用 `onReachBottom` 触底加载（每页 6 件），`hasMore` 依据 `list.length < total` 判断。
- **样式**：尺寸用 `rpx`（750rpx = 屏宽），图片容器用 `padding-bottom: 100%` 撑正方形 + `mode="aspectFill"` 裁切不拉伸。

## D26 体验优化

对应学习计划第 4 周 D26「图片压缩/懒加载、骨架屏、接口缓存、错误兜底、H5 的 SEO 与 meta」，零新增依赖。

| 项 | 实现位置 | 做法 |
| --- | --- | --- |
| 图片懒加载 / 失败兜底 | `src/components/smart-image/smart-image.vue`，9 处 `<image>` 全部替换 | 组件根节点就是 `<image>`，父级的 class / style 自动透传，原有 `.thumb` / `.pic` / `.g-pic` 样式照常生效。小程序端用 `lazy-load` / `webp`，H5 端属性被忽略但不报错；首屏 Banner 与详情主图传 `:lazy="false"` 保证 LCP。加载失败切到本地 `/static/logo.png`，不出破图 |
| 图片 URL 统一出口 | `src/utils/image.js` 的 `imageUrl()` | 后端已返回完整 URL，现在透传；接 CDN / OSS 后只改这一处，全站图片自动带尺寸 / 格式参数（注意让加工参数幂等）。本项目小程序端没有上传入口，所以「上传前压缩」放在 `mall-web` 的后台里做 |
| 骨架屏 | `src/components/page-skeleton/page-skeleton.vue` | `list` / `grid` 两种形状，替换首页、详情、收藏、领券中心、我的券的「加载中...」文字；纯 CSS 微光动画，单位用 rpx |
| 接口缓存 | `src/utils/request.js` | 白名单只放 `/categories`、`/products`、`/products/:id` 这类与登录态无关的公开 GET，TTL 60s；同 key 并发复用一个 Promise；任何写操作发出时清空缓存。缓存只在内存，不落 Storage。单次跳过 `request({ url: '/x', cache: false })`，手动清空 `clearApiCache()` |
| 错误兜底 | `src/main.js`、`src/App.vue`、`src/components/error-state/error-state.vue` | `app.config.errorHandler` + App 级 `onError` / `onUnhandledRejection` / `onPageNotFound`（回首页）；首页区分「请求失败」与「暂无商品」并给重新加载按钮，同时保留 `seq` 防竞态与触底失败回退页码的逻辑 |
| H5 SEO / meta | `index.html`、`src/manifest.json`、`public/robots.txt`、`public/sitemap.xml` | 补 `lang="zh-CN"`、title / description / keywords / OG / theme-color；`manifest.json` 显式声明 `h5.router.mode = hash`（**不要改成 history**，否则公众号回调里拼的 `#/pages/login/login` 会断）；顺手给收藏页补上 `enablePullDownRefresh`，页面里早就写了 `onPullDownRefresh` 但之前配置里没开启 |

**待办（属于进阶路线，不在 D26 范围内）**：

1. `index.html` / `robots.txt` / `sitemap.xml` 里的 `https://example.com` 是占位，部署拿到真实域名后替换（D27 补部署地址时一起做）。
2. H5 是 hash 路由的 SPA，爬虫只能拿到静态 meta 和空容器；商品详情等内页要进 sitemap 需要 SSR / 预渲染（进阶路线里的 Nuxt 3）。
3. 小程序端还没做 `subPackages` 分包与 CDN 图片域名，主包目前约 412K，图片靠后端返回完整 URL，真机仍依赖「不校验合法域名」。

## 与 mall-web 的关系

`mall-web` 是桌面/移动浏览器版（Vue 3 + Element Plus），`mall-app` 是多端版（uni-app）。两者共用同一个 `mall-api`，登录接口早期一致（账号密码），后续小程序端会补 `wx.login` + openid 登录。
