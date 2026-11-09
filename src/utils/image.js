const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

export function resolveImg(url) {
    if (!url) return '/static/logo.png'
    // 后端接口已统一返回图片「完整 URL」，直接透传即可（跨域部署也能显示）。
    // 下面这行前缀补齐只作兜底：兼容库里历史数据仍是 /uploads/xxx.png 的情况。
    if (/^https?:\/\//.test(url)) return url

    return API_ORIGIN + (url.startsWith('/') ? url : `/${url}`)
}
