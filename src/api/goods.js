import { request } from '@/utils/request'

export const getProducts = (params) => request({ url: '/products', data: params })

export const getCategories = () => request({ url: '/categories' })

export const getProduct = (id) => request({ url: `/products/${id}` })