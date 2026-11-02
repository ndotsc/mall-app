// 接口基址：优先读 .env 的 VITE_API_BASE（见 .env.example），未配置则走本地后端。
// 小程序真机预览必须换成 https 域名，并在小程序后台配置 request 合法域名。
const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'

const TOKEN_KEY = 'mall_token'
const REFRESH_KEY = 'mall_refresh_token'

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}
export function setToken(token) {
  if (token) uni.setStorageSync(TOKEN_KEY, token)
  else uni.removeStorageSync(TOKEN_KEY)
}
export function getRefreshToken() {
  return uni.getStorageSync(REFRESH_KEY) || ''
}
export function setRefreshToken(token) {
  if (token) uni.setStorageSync(REFRESH_KEY, token)
  else uni.removeStorageSync(REFRESH_KEY)
}

// 直接打 refresh 接口（不经由下面带刷新的 request，避免递归 / 循环依赖）
function callRefresh(refreshToken) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + '/auth/refresh',
      method: 'POST',
      data: { refreshToken },
      header: { 'Content-Type': 'application/json' },
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 0) resolve(res.data.data)
        else reject(new Error((res.data && res.data.message) || 'refresh 失败'))
      },
      fail: () => reject(new Error('网络错误')),
    })
  })
}

// 统一请求层：
// 1) 自动从本地存储读取 token，写入 Authorization: Bearer <token>
// 2) 业务约定：HTTP 200 且 body.code === 0 才算成功，resolve(data)
// 3) 401：access 过期。若本地还有 refreshToken，则静默换新令牌并重试一次；
//    无 refresh 或刷新失败 / 已重试过，才清登录态跳登录页
export function request(options) {
  return new Promise((resolve, reject) => {
    const hadToken = !!getToken()
    const header = Object.assign({ 'Content-Type': 'application/json' }, options.header || {})
    const token = getToken()
    if (token) header.Authorization = `Bearer ${token}`

    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      timeout: options.timeout || 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          resolve(res.data.data)
          return
        }
        if (res.statusCode === 401) {
          // access 过期且本地还有 refreshToken：静默换发后重试一次（_retry 防递归）
          if (!options._retry && hadToken && getRefreshToken()) {
            callRefresh(getRefreshToken())
              .then((data) => {
                setToken(data.token)
                setRefreshToken(data.refreshToken)
                uni.$emit('auth:token-refreshed', data) // 通知 auth store 同步内存态
                return request(Object.assign({}, options, { _retry: true }))
              })
              .then(resolve, reject)
            return
          }
          // 无 refresh 或已重试过 -> 清登录态跳登录
          if (hadToken) {
            setToken('')
            setRefreshToken('')
            uni.removeStorageSync('mall_user')
            uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
            uni.navigateTo({ url: '/pages/login/login' })
          } else if (res.data && res.data.message) {
            uni.showToast({ title: res.data.message, icon: 'none' })
          }
          reject(res.data || { message: '未登录' })
          return
        }
        const msg = (res.data && res.data.message) || `请求失败(${res.statusCode})`
        uni.showToast({ title: msg, icon: 'none' })
        reject(res.data || { message: msg })
      },
      fail: (err) => {
        uni.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      },
    })
  })
}
