import { request } from '@/utils/request'

// 鉴权相关接口（对应后端 src/routes/auth.js）
export const register = (data) => request({ url: '/auth/register', method: 'POST', data })
export const login = (data) => request({ url: '/auth/login', method: 'POST', data })
export const wxLogin = (data) => request({ url: '/auth/wx-login', method: 'POST', data })
export const wxOauth = (data) => request({ url: '/auth/wx-oauth', method: 'POST', data })
export const getMe = () => request({ url: '/auth/me' })
export const logout = () => request({ url: '/auth/logout', method: 'POST' })
// 用 refresh token 换新的访问令牌对（access 过期后由请求层自动调用）
export const refresh = (refreshToken) => request({ url: '/auth/refresh', method: 'POST', data: { refreshToken } })
