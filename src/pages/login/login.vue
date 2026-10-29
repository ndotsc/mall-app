<template>
  <view class="login">
    <view class="brand">商城</view>
    <view class="title">登录 / 注册</view>

    <!-- 微信一键登录：小程序 / App 微信 / H5 微信内 才显示 -->
    <button v-if="canWeixin" class="wx" @tap="onWeixin">微信一键登录</button>

    <view class="divider"><text>或</text></view>

    <view class="form">
      <input v-model="username" class="input" placeholder="用户名" />
      <input v-model="password" class="input" type="password" placeholder="密码（注册时自动建号）" />
      <button class="primary" @tap="onLogin">登录</button>
      <button class="ghost" @tap="onRegister">注册并登录</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const username = ref('')
const password = ref('')
const canWeixin = ref(false)

onMounted(() => {
  const info = uni.getSystemInfoSync()
  const platform = info.uniPlatform || info.platform || process.env.UNI_PLATFORM
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
  const inWeixinBrowser = /MicroMessenger/i.test(ua)

  // 小程序 / App 微信 / H5 微信内浏览器 → 显示微信登录
  if (platform === 'mp-weixin' || platform === 'app' || inWeixinBrowser) {
    canWeixin.value = true
  }

  // H5 微信内：微信授权回调会带 ?code=xxx，直接换 token（静默 snsapi_base）
  if (inWeixinBrowser) {
    const code = getQuery('code')
    if (code) auth.loginByOauth(code).then(finish).catch(() => {})
  }
})

function getQuery(name) {
  if (typeof location === 'undefined') return ''
  const m = new RegExp('[?&]' + name + '=([^&]+)').exec(location.search)
  return m ? decodeURIComponent(m[1]) : ''
}

// 构造公众号网页授权链接（H5 微信内一键登录用）。AppID 来自前端构建变量，
// 公众号 AppID 本来就是公开的前端配置，secret 始终留在后端。
function buildOauthUrl() {
  const appid = import.meta.env.VITE_WX_OA_APPID
  if (!appid) {
    uni.showToast({ title: '未配置公众号 AppID', icon: 'none' })
    return ''
  }
  // 回调地址：优先用 VITE_OA_REDIRECT_BASE（部署 H5 的站点根），
  // 否则回退到当前页面 origin + pathname（本地/H5 自托管都适用）。
  const base = import.meta.env.VITE_OA_REDIRECT_BASE
    || (typeof location !== 'undefined' ? location.origin + location.pathname : '')
  const redirectUri = encodeURIComponent(base + '#/pages/login/login')
  const state = Date.now()
  return (
    `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}` +
    `&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`
  )
}

async function onWeixin() {
  const platform = uni.getSystemInfoSync().uniPlatform || process.env.UNI_PLATFORM
  if (platform === 'mp-weixin') {
    await auth.loginByWeixin() // 小程序：uni.login -> 后端 wx-login
  } else {
    const url = buildOauthUrl() // H5 微信内：跳转微信授权，微信带 code 跳回本页
    if (url) location.href = url
  }
  finish()
}

async function onLogin() {
  if (!username.value || !password.value) {
    return uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
  }
  try {
    await auth.loginByPassword(username.value, password.value)
    finish()
  } catch (e) {
    /* 错误已在 request 层 toast */
  }
}

async function onRegister() {
  if (!username.value || !password.value) {
    return uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
  }
  try {
    await auth.register({ username: username.value, password: password.value })
    finish()
  } catch (e) {
    /* 错误已在 request 层 toast */
  }
}

// 登录后返回来源页；若没有可返回的页（如直接进登录页）则回首页
function finish() {
  uni.navigateBack({
    fail: () => uni.switchTab({ url: '/pages/index/index' }),
  })
}
</script>

<style>
.login {
  min-height: 100vh;
  background: #f6f7f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 160rpx 56rpx 0;
  box-sizing: border-box;
}
.brand {
  font-size: 56rpx;
  font-weight: 700;
  color: #2563eb;
}
.title {
  margin: 16rpx 0 64rpx;
  font-size: 32rpx;
  color: #6b7280;
}
.wx {
  width: 100%;
  background: #07c160;
  color: #fff;
  border-radius: 16rpx;
  font-size: 30rpx;
}
.divider {
  width: 100%;
  text-align: center;
  color: #9ca3af;
  font-size: 24rpx;
  margin: 40rpx 0;
  position: relative;
}
.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1rpx;
  background: #e5e7eb;
}
.divider::before {
  left: 0;
}
.divider::after {
  right: 0;
}
.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.input {
  height: 88rpx;
  background: #fff;
  border: 2rpx solid #e6e8eb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}
.primary {
  height: 88rpx;
  background: #2563eb;
  color: #fff;
  border-radius: 16rpx;
  font-size: 30rpx;
  line-height: 88rpx;
}
.ghost {
  height: 88rpx;
  background: #fff;
  color: #2563eb;
  border: 2rpx solid #2563eb;
  border-radius: 16rpx;
  font-size: 30rpx;
  line-height: 88rpx;
}
</style>
