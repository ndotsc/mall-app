import { defineStore } from 'pinia'
const KEY = 'mall_address'
export const useAddressStore = defineStore('address', {
    state: () => ({ list: uni.getStorageSync(KEY) || [] }),
    getters: { defaultAddress: (s) => s.list.find((a) => a.isDefault) || null },
    actions: {
        persist() { uni.setStorageSync(KEY, this.list) },
        add(addr) {
            const item = { id: Date.now(), ...addr }
            this.list.push(item)
            // 勾了默认 → 设为唯一默认；否则若还没有默认则把第一条设为默认
            if (addr.isDefault) this.setDefault(item.id)
            else if (!this.list.some((a) => a.isDefault)) item.isDefault = true
            this.persist()
        },
        update(id, patch) {
            const i = this.list.find((a) => a.id === id)
            if (!i) return
            Object.assign(i, patch)
            if (patch.isDefault) this.list.forEach((a) => { if (a.id !== id) a.isDefault = false })
            // 兜底：若取消默认导致没有默认地址，则把第一条设为默认
            if (!this.list.some((a) => a.isDefault) && this.list.length) this.list[0].isDefault = true
            this.persist()
        },
        remove(id) {
            this.list = this.list.filter((a) => a.id !== id)
            if (!this.list.find((a) => a.isDefault) && this.list.length) this.list[0].isDefault = true
            this.persist()
        },
        setDefault(id) { this.list.forEach((a) => (a.isDefault = a.id === id)); this.persist() },
    },
})
