import { defineStore } from 'pinia'

const KEY = 'mall_orders'
export const ORDER_STATUS = { 1: '待付款', 2: '待发货', 3: '待收货', 4: '已完成', 5: '已取消' }

export const useOrderStore = defineStore('order', {
    state: () => ({ orders: uni.getStorageSync(KEY) || [] }),
    getters: {
        // 用 orderNo 查单个订单
        orderByNo: (s) => (no) => s.orders.find((o) => o.orderNo === no) || null,
    },
    actions: {
        persist() { uni.setStorageSync(KEY, this.orders) },
        // 创建订单：items 每项 { productId, name, price(分), cover, number }
        createOrder({ items, info, payType, remark }) {
            const totalAmount = items.reduce((sum, i) => sum + i.price * i.number, 0)
            const order = {
                orderNo: 'NO' + Date.now() + Math.floor(Math.random() * 1000),
                totalAmount,            // 单位：分
                payType: payType || 'wechat',
                status: 1,              // 1 待付款
                info,                   // { name, phone, address }
                remark: remark || '',
                items,
                createdAt: Date.now(),
            }
            this.orders.unshift(order)
            this.persist()
            return order.orderNo
        },
        setStatus(orderNo, status) {
            const o = this.orders.find((x) => x.orderNo === orderNo)
            if (o) { o.status = status; this.persist() }
        },
        pay(orderNo) { this.setStatus(orderNo, 2) },                  // 去支付：1→2
        ship(orderNo) { this.setStatus(orderNo, 3) },                  // 模拟商家发货（无商家后台，仅演示）：2→3
        receive(orderNo) { this.setStatus(orderNo, 4) },               // 确认收货：3→4
        cancel(orderNo) { this.setStatus(orderNo, 5) },                // 取消：→5
    },
})
