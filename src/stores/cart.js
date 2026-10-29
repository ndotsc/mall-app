import { defineStore } from 'pinia'
import * as cartApi from '@/api/cart'

// 购物车：数据以「真后端」为准（src/api/cart → 后端 /api/cart）。
// 后端不存「勾选」状态，checked 仅作为本地 UI 态，默认全选。
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],        // 后端购物车项，结构：{ id, productId, title, price, image, quantity, checked }
    buyNow: null,     // 「立即购买」单品暂存（不进购物车，与购物车互斥）
    loading: false,
  }),
  getters: {
    totalCount: (s) => s.items.reduce((sum, i) => sum + i.quantity, 0),            // 角标用
    checkedItems: (s) => s.items.filter((i) => i.checked),
    checkedCount: (s) => s.items.filter((i) => i.checked).reduce((sum, i) => sum + i.quantity, 0),
    checkedAmount: (s) => s.items.filter((i) => i.checked).reduce((sum, i) => sum + i.price * i.quantity, 0), // 分
    allChecked: (s) => s.items.length > 0 && s.items.every((i) => i.checked),
    // 立即购买的单品，整理成与购物车勾选项同构的下单结构
    buyNowItems: (s) => s.buyNow ? [{
      productId: s.buyNow.productId, name: s.buyNow.title, price: s.buyNow.price,
      cover: s.buyNow.image, number: s.buyNow.quantity,
    }] : [],
  },
  actions: {
    // 拉取后端购物车，并映射成前端结构（checked 默认 true）
    async load() {
      this.loading = true
      try {
        const list = await cartApi.getCart()
        this.items = (list || []).map((it) => ({
          id: it.id,
          productId: it.productId,
          title: it.product?.name || '',
          price: it.product?.price || 0,
          image: it.product?.cover || '',
          quantity: it.number,
          checked: true,
        }))
      } catch {
        this.items = []
      } finally {
        this.loading = false
      }
    },
    async addItem(product, qty = 1) {
      await cartApi.addCart({ productId: product.id, number: qty })
      await this.load()
    },
    async updateQty(productId, qty) {
      const it = this.items.find((i) => i.productId === productId)
      if (!it) return
      await cartApi.updateCart(it.id, { number: qty })
      await this.load()
    },
    async removeItem(productId) {
      const it = this.items.find((i) => i.productId === productId)
      if (!it) return
      await cartApi.deleteCart(it.id)
      await this.load()
    },
    async removeChecked() {
      const ids = this.checkedItems.map((i) => i.id)
      await Promise.all(ids.map((id) => cartApi.deleteCart(id)))
      await this.load()
    },
    async clear() {
      await cartApi.clearCart()
      await this.load()
    },
    toggleCheck(productId) { const i = this.items.find((x) => x.productId === productId); if (i) i.checked = !i.checked },
    toggleAll(checked) { this.items.forEach((i) => (i.checked = checked)) },
    // 立即购买：暂存单品（不进购物车），进入确认订单页后由 confirm 读取
    setBuyNow(product, qty = 1) {
      this.buyNow = { productId: product.id, title: product.name, price: product.price, image: product.cover, quantity: qty }
    },
    clearBuyNow() { this.buyNow = null },
  },
})
