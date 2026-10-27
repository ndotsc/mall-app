import { defineStore } from 'pinia'

const STORAGE_KEY = 'mall_cart'

export const useCartStore = defineStore('cart', {
    state: () => ({
        items: uni.getStorageSync(STORAGE_KEY) || [],
    }),
    getters: {
        totalCount: (s) => s.items.reduce((sum, i) => sum + i.quantity, 0),       // 角标用
        checkedItems: (s) => s.items.filter((i) => i.checked),
        checkedCount: (s) => s.items.filter((i) => i.checked).reduce((sum, i) => sum + i.quantity, 0),
        checkedAmount: (s) => s.items.filter((i) => i.checked).reduce((sum, i) => sum + i.price * i.quantity, 0), // 分
        allChecked: (s) => s.items.length > 0 && s.items.every((i) => i.checked),
    },
    actions: {
        persist() { uni.setStorageSync(STORAGE_KEY, this.items) },
        addItem(product, qty = 1) {
            const exist = this.items.find((i) => i.productId === product.id)
            if (exist) exist.quantity = Math.min(exist.quantity + qty, product.stock || 999)
            else this.items.push({
                productId: product.id, title: product.name, price: product.price,
                image: product.cover, quantity: qty, checked: true, stock: product.stock || 999,
            })
            this.persist()
        },
        removeItem(productId) { this.items = this.items.filter((i) => i.productId !== productId); this.persist() },
        updateQty(productId, qty) {
            const item = this.items.find((i) => i.productId === productId)
            if (item) item.quantity = Math.max(1, Math.min(qty, item.stock))
            this.persist()
        },
        toggleCheck(productId) { const i = this.items.find((x) => x.productId === productId); if (i) i.checked = !i.checked; this.persist() },
        toggleAll(checked) { this.items.forEach((i) => (i.checked = checked)); this.persist() },
        removeChecked() { this.items = this.items.filter((i) => !i.checked); this.persist() },
        clear() { this.items = []; this.persist() },
    },
})
