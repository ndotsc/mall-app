import { defineStore } from 'pinia'
import * as orderApi from '@/api/order'

export const ORDER_STATUS = { 1: '待付款', 2: '待发货', 3: '待收货', 4: '已完成', 5: '已取消' }

// 后端订单 → 前端结构（后端字段是 receiverName/receiverPhone，这里归一化成 info 结构，页面无需改动）
function normalize(o) {
  return {
    orderNo: o.orderNo,
    totalAmount: o.totalAmount,
    status: o.status,
    remark: o.remark || '',
    info: { name: o.receiverName, phone: o.receiverPhone, address: o.address },
    items: (o.items || []).map((it) => ({
      productId: it.productId, name: it.name, price: it.price, cover: it.cover, number: it.number,
    })),
    createdAt: o.createdAt,
  }
}

// 订单：数据以「真后端」为准（src/api/order → 后端 /api/orders）。
export const useOrderStore = defineStore('order', {
  state: () => ({ orders: [], loading: false }),
  getters: {
    // 用 orderNo 查单个订单（命中本地缓存，未命中时由 fetchDetail 拉取）
    orderByNo: (s) => (no) => s.orders.find((o) => o.orderNo === no) || null,
  },
  actions: {
    async load(params) {
      this.loading = true
      try {
        const r = await orderApi.getOrders(params || {})
        this.orders = (r.list || []).map(normalize)
      } catch {
        this.orders = []
      } finally {
        this.loading = false
      }
    },
    async fetchDetail(orderNo) {
      try {
        const o = await orderApi.getOrder(orderNo)
        const norm = normalize(o)
        const idx = this.orders.findIndex((x) => x.orderNo === orderNo)
        if (idx >= 0) this.orders.splice(idx, 1, norm)
        else this.orders.unshift(norm)
        return norm
      } catch {
        return null
      }
    },
    async createOrder({ items, info, payType, remark }) {
      const r = await orderApi.createOrder({ items, info, payType, remark })
      return r.orderNo
    },
    async setStatus(orderNo, status) {
      const o = await orderApi.updateOrderStatus(orderNo, status)
      const norm = normalize(o)
      const idx = this.orders.findIndex((x) => x.orderNo === orderNo)
      if (idx >= 0) this.orders.splice(idx, 1, norm)
      else this.orders.unshift(norm)
    },
    pay(orderNo) { return this.setStatus(orderNo, 2) },      // 去支付：1→2
    ship(orderNo) { return this.setStatus(orderNo, 3) },      // 模拟商家发货：2→3
    receive(orderNo) { return this.setStatus(orderNo, 4) },   // 确认收货：3→4
    cancel(orderNo) { return this.setStatus(orderNo, 5) },    // 取消：→5
  },
})
