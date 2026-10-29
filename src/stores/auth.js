import { defineStore } from 'pinia'
import { register, login, wxLogin, wxOauth, getMe, logout } from '@/api/auth'
import { setToken, getToken } from '@/utils/request'

const USER_KEY = 'mall_user'

// 登录态：token 与 user 都持久化到本地存储，App 冷启动由 bootstrap() 恢复
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    user: uni.getStorageSync(USER_KEY) || null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token && !!s.user,
    nickname: (s) => (s.user && (s.user.nickname || s.user.username)) || '未登录',
  },
  actions: {
    // 登录成功后统一落库：写 token、写 user、两者都进 storage
    _persist(token, user) {
      setToken(token)
      this.token = token
      this.user = user
      uni.setStorageSync(USER_KEY, user)
    },

    // 账号密码注册（后端自动建号，role=1 普通用户）
    async register(data) {
      const res = await register(data)
      this._persist(res.token, res.user)
      return res
    },

    // 账号密码登录
    async loginByPassword(username, password) {
      const res = await login({ username, password })
      this._persist(res.token, res.user)
      return res
    },

    // 小程序 / App 微信登录：uni.login 拿 code -> 后端 wx-login 换 token
    async loginByWeixin() {
      const { code } = await uni.login({ provider: 'weixin' })
      if (!code) throw new Error('获取微信 code 失败')
      const res = await wxLogin({ code })
      this._persist(res.token, res.user)
      return res
    },

    // H5 微信内「一键登录」：前端先拿微信回调的 code -> 后端 wx-oauth 换 token
    async loginByOauth(code) {
      const res = await wxOauth({ code })
      this._persist(res.token, res.user)
      return res
    },

    // 拉取最新用户信息（/auth/me）
    async fetchMe() {
      const user = await getMe()
      this.user = user
      uni.setStorageSync(USER_KEY, user)
      return user
    },

    // 退出登录：先通知后端把当前 token 拉黑（主动失效），再清本地 token + user
    async logout() {
      try { await logout() } catch { /* 网络/401 都无所谓，本地照清 */ }
      setToken('')
      this.token = ''
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
