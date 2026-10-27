const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

export function resolveImg(url) {
    if (!url) return '/static/logo.png'
    if (/^https?:\/\//.test(url)) return url

    return API_ORIGIN + (url.startsWith('/') ? url : `/${url}`)
}
