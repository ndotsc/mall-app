import { defineStore } from 'pinia'
import * as addrApi from '@/api/address'

// 收货地址：数据以「真后端」为准（src/api/address → 后端 /api/addresses）。
// pickedId 仅用于「确认订单页点选地址」的本次下单上下文，不持久化到后端。
export const useAddressStore = defineStore('address', {
  state: () => ({ list: [], pickedId: null, loading: false }),
  getters: {
    defaultAddress: (s) => s.list.find((a) => a.isDefault) || null,
    // 确认订单页使用的地址：优先用用户刚「点选」的；没点选则用默认地址
    chosenAddress: (s) => {
      if (s.pickedId) {
        const picked = s.list.find((a) => a.id === s.pickedId)
        if (picked) return picked
      }
      return s.list.find((a) => a.isDefault) || null
    },
  },
  actions: {
    async load() {
      this.loading = true
      try { this.list = (await addrApi.getAddresses()) || [] } catch { this.list = [] } finally { this.loading = false }
    },
    async add(addr) { await addrApi.addAddress(addr); await this.load() },
    async update(id, patch) { await addrApi.updateAddress(id, patch); await this.load() },
    async remove(id) {
      await addrApi.deleteAddress(id)
      if (this.pickedId === id) this.pickedId = null
      await this.load()
    },
    async setDefault(id) { await addrApi.updateAddress(id, { isDefault: true }); await this.load() },
    setPicked(id) { this.pickedId = id },
    clearPicked() { this.pickedId = null },
  },
})
