import { defineStore } from 'pinia'
import { register, login, wxLogin, wxOauth, getMe, logout, refresh } from '@/api/auth'
import { setToken, getToken, setRefreshToken, getRefreshToken } from '@/utils/request'

const USER_KEY = 'mall_user'

// 登录态：access token、refresh token 与 user 都持久化到本地存储，App 冷启动由 bootstrap() 恢复
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    refreshToken: getRefreshToken(),
    user: uni.getStorageSync(USER_KEY) || null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token && !!s.user,
    nickname: (s) => (s.user && (s.user.nickname || s.user.username)) || '未登录',
  },
  actions: {
    // 登录成功后统一落库：写 token、refreshToken、user，三者都进 storage
    _persist(token, refreshToken, user) {
      setToken(token)
      setRefreshToken(refreshToken)
      this.token = token
      this.refreshToken = refreshToken
      this.user = user
      uni.setStorageSync(USER_KEY, user)
    },

    // 账号密码注册（后端自动建号，role=1 普通用户）
    async register(data) {
      const res = await register(data)
      this._persist(res.token, res.refreshToken, res.user)
      return res
    },

    // 账号密码登录
    async loginByPassword(username, password) {
      const res = await login({ username, password })
      this._persist(res.token, res.refreshToken, res.user)
      return res
    },

    // 小程序 / App 微信登录：uni.login 拿 code -> 后端 wx-login 换令牌对
    async loginByWeixin() {
      const { code } = await uni.login({ provider: 'weixin' })
      if (!code) throw new Error('获取微信 code 失败')
      const res = await wxLogin({ code })
      this._persist(res.token, res.refreshToken, res.user)
      return res
    },

    // H5 微信内「一键登录」：前端先拿微信回调的 code -> 后端 wx-oauth 换令牌对
    async loginByOauth(code) {
      const res = await wxOauth({ code })
      this._persist(res.token, res.refreshToken, res.user)
      return res
    },

    // 用本地 refreshToken 主动换新令牌对（一般无需手动调用，请求层会自动刷新）
    async refreshToken() {
      const res = await refresh(this.refreshToken)
      this._persist(res.token, res.refreshToken, this.user)
      return res
    },
    // 取 refreshToken 给请求层使用（保持单一来源）
    getRefreshToken() {
      return this.refreshToken
    },

    // 拉取最新用户信息（/auth/me）
    async fetchMe() {
      const user = await getMe()
      this.user = user
      uni.setStorageSync(USER_KEY, user)
      return user
    },

    // 退出登录：先通知后端把当前 access 拉黑 + 吊销家族 refresh（主动失效），再清本地全部登录态
    async logout() {
      try { await logout() } catch { /* 网络/401 都无所谓，本地照清 */ }
      setToken('')
      setRefreshToken('')
      this.token = ''
      this.refreshToken = ''
      this.user = null
      uni.removeStorageSync(USER_KEY)
    },

    // App 启动时调用：有 token 则刷新用户信息；失败（token 过期/用户被删）则清登录态
    async bootstrap() {
      if (this.token) {
        try {
          await this.fetchMe()
        } catch (e) {
          this.logout()
        }
      }
    },
  },
})

// 请求层自动刷新令牌后，通过 uni.$emit 通知此处同步更新 store 内存态（解耦，避免循环依赖）
uni.$on('auth:token-refreshed', (data) => {
  try {
    const store = useAuthStore()
    store.token = data.token
    store.refreshToken = data.refreshToken
  } catch {
    /* pinia 未就绪时忽略 */
  }
})
