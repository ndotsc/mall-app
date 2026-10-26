# mall-app

![CI](https://github.com/ndotsc/mall-app/actions/workflows/ci.yml/badge.svg)

uni-app 多端商城客户端：一套 Vue 3 代码同时产出 **H5** 与 **微信小程序**（App 端后续用同一套代码打包）。配合后端 [mall-api](https://github.com/ndotsc/mall-api) 运行。

## 环境要求

- Node 20+，pnpm 12
- 后端 mall-api 已启动（默认 `http://localhost:3000`）
- 微信小程序预览需要「微信开发者工具」（H5 端不需要）

## 安装与运行

```bash
pnpm install          # 安装依赖
pnpm dev:h5           # H5 开发服务器，浏览器直接调试
pnpm dev:mp-weixin    # 编译到 dist/dev/mp-weixin，用微信开发者工具导入
pnpm build:h5         # 产出 dist/build/h5（可静态托管）
pnpm build:mp-weixin  # 产出 dist/build/mp-weixin（上传小程序用）
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
├── pages/index/        # 首页（Hero + 搜索 + 商品网格 + 触底加载）
├── utils/request.js    # uni.request 封装（统一取 data、错误提示、超时）
├── pages.json          # 页面路由 + 全局窗口样式 + easycom
└── manifest.json       # 应用配置（AppID、名称、各端差异）
```

## 关键约定

- **请求必须用 `uni.request`**：小程序环境没有 `XMLHttpRequest`，axios 在端上跑不起来。
- **统一响应**：后端返回 `{ code, message, data }`，`code === 0` 才取 `data`，其余统一 toast。
- **金额**：接口给的是「分」，展示时 `/100` 转元，不在前端做运算。
- **分页**：首页用 `onReachBottom` 触底加载（每页 6 件），`hasMore` 依据 `list.length < total` 判断。
- **样式**：尺寸用 `rpx`（750rpx = 屏宽），图片容器用 `padding-bottom: 100%` 撑正方形 + `mode="aspectFill"` 裁切不拉伸。

## 与 mall-web 的关系

`mall-web` 是桌面/移动浏览器版（Vue 3 + Element Plus），`mall-app` 是多端版（uni-app）。两者共用同一个 `mall-api`，登录接口早期一致（账号密码），后续小程序端会补 `wx.login` + openid 登录。
