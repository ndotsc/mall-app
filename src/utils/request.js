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

// ---------------- D26 接口缓存 ----------------
// 只缓存「与登录态无关的公开 GET」：分类字典、商品列表、商品详情，TTL 60 秒。
// 三条边界：
//   1) key 必须包含 data（GET 的 query 参数），别把第 1 页和第 2 页、不同筛选条件混在一起
//   2) 写操作发出时清空缓存，后台改完商品列表不能还是旧数据
//   3) 缓存只在内存里，不落 Storage，避免重启后拿到脏数据
// 白名单之外的接口（购物车 / 订单 / 收藏 / 优惠券 / 用户信息）一律不缓存。
const CACHE_TTL = 60 * 1000
const CACHEABLE_GET = [
  /^\/categories$/,
  /^\/products$/,
  /^\/products\/\d+$/,
]
const responseCache = new Map()
const inflight = new Map()

/** 手动清空缓存；prefix 可只清某类接口 */
export function clearApiCache(prefix = '') {
  for (const key of responseCache.keys()) {
    if (!prefix || key.startsWith(prefix)) responseCache.delete(key)
  }
}

function stableKey(options) {
  const method = (options.method || 'GET').toUpperCase()
  const data = options.data || {}
  const qs = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k] == null ? '' : data[k]}`)
    .join('&')
  return `${method} ${options.url || ''}?${qs}`
}

function isCacheable(options, method) {
  // 单次跳过：request({ url: '/products', cache: false })
  if (options.cache === false || options._retry) return false
  if (method !== 'GET') return false
  return CACHEABLE_GET.some((re) => re.test(options.url || ''))
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

/**
 * 统一请求层（对外入口）：
 * 1) 命中未过期缓存直接返回；同 key 的并发请求复用同一个 Promise
 * 2) 未命中走 rawRequest，成功后写缓存
 * 3) 写操作自动清缓存
 */
export function request(options) {
  const method = (options.method || 'GET').toUpperCase()
  if (method !== 'GET') clearApiCache()
  if (!isCacheable(options, method)) return rawRequest(options)

  const key = stableKey(options)
  const hit = responseCache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL) return Promise.resolve(hit.data)

  const pending = inflight.get(key)
  if (pending) return pending

  const p = rawRequest(options)
    .then((data) => {
      responseCache.set(key, { at: Date.now(), data })
      return data
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}

// 真正发请求的部分：
// 1) 自动从本地存储读取 token，写入 Authorization: Bearer <token>
// 2) 业务约定：HTTP 200 且 body.code === 0 才算成功，resolve(data)
// 3) 401：access 过期。若本地还有 refreshToken，则静默换新令牌并重试一次；
//    无 refresh 或刷新失败 / 已重试过，才清登录态跳登录页
function rawRequest(options) {
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
