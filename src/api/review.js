import { request } from '@/utils/request'

// 商品评价列表（公开）：{ productId, page?, pageSize? }
export const getReviews = (params) => request({ url: '/reviews', data: params })

// 我的评价（需登录）：{ page?, pageSize? }
export const getMyReviews = (params) => request({ url: '/reviews/me', data: params })

// 提交评价（需登录）：{ productId, rating, content? }
export const createReview = (data) => request({ url: '/reviews', method: 'POST', data })
