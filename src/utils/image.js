const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

/** 本地占位图：图片加载失败时不依赖网络，也不会出现破图 */
export const PLACEHOLDER = '/static/logo.png'

/**
 * D26：图片 URL 的统一出口。
 * 后端已按「图片 URL 契约」返回完整 URL，现在原样透传。
 * 将来接 CDN / OSS，只改这一个函数就能给全站图片加尺寸与格式参数，例如：
 *   return `${url}?x-oss-process=image/resize,w_${width}/format,webp`
 * 页面一行都不用动（记得让加工参数幂等：已带参数的 URL 不再追加）。
 */
export function imageUrl(url, _opts = {}) {
  return url || PLACEHOLDER
}

/**
 * 兼容三种值：完整 URL（后端当前返回）、历史 /uploads/xxx 相对路径、空值。
 * 页面里仍像以前一样用 resolveImg(...)，行为保持不变。
 */
export function resolveImg(url) {
    if (!url) return PLACEHOLDER
    if (/^https?:\/\//.test(url)) return imageUrl(url)
    return imageUrl(API_ORIGIN + (url.startsWith('/') ? url : `/${url}`))
}
