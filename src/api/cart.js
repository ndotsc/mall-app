import { request } from '@/utils/request'

// 购物车接口（对应后端 src/routes/cart.js，全部需要 Authorization）
export const getCart = () => request({ url: '/cart' })
export const addCart = (data) => request({ url: '/cart', method: 'POST', data })
export const updateCart = (id, data) => request({ url: `/cart/${id}`, method: 'PUT', data })
export const deleteCart = (id) => request({ url: `/cart/${id}`, method: 'DELETE' })
export const clearCart = () => request({ url: '/cart', method: 'DELETE' })
