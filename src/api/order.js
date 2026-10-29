import { request } from '@/utils/request'

// 订单接口（对应后端 src/routes/order.js，全部需要 Authorization）
export const createOrder = (data) => request({ url: '/orders', method: 'POST', data })
export const getOrders = (params) => request({ url: '/orders', data: params })
export const getOrder = (orderNo) => request({ url: `/orders/${orderNo}` })
export const updateOrderStatus = (orderNo, status) =>
  request({ url: `/orders/${orderNo}/status`, method: 'PATCH', data: { status } })
