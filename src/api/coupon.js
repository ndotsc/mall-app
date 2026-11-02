import { request } from '@/utils/request'

// 优惠券
export const getCoupons = () => request({ url: '/coupons' }) // 领券中心
export const claimCoupon = (id) => request({ url: `/coupons/${id}/claim`, method: 'POST' })
export const getMyCoupons = (params) => request({ url: '/coupons/mine', data: params })
