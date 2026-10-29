import { request } from '@/utils/request'

// 收货地址接口（对应后端 src/routes/address.js，全部需要 Authorization）
export const getAddresses = () => request({ url: '/addresses' })
export const addAddress = (data) => request({ url: '/addresses', method: 'POST', data })
export const updateAddress = (id, data) => request({ url: `/addresses/${id}`, method: 'PUT', data })
export const deleteAddress = (id) => request({ url: `/addresses/${id}`, method: 'DELETE' })
