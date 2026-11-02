import { request } from '@/utils/request'

// 收藏/心愿单
export const getFavorites = (params) => request({ url: '/favorites', data: params })
export const checkFavorite = (productId) => request({ url: '/favorites/check', data: { productId } })
export const addFavorite = (productId) => request({ url: '/favorites', method: 'POST', data: { productId } })
export const removeFavorite = (productId) => request({ url: `/favorites/${productId}`, method: 'DELETE' })
