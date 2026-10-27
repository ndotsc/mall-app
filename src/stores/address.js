import { defineStore } from 'pinia'
const KEY = 'mall_address'
export const useAddressStore = defineStore('address', {
    state: () => ({ list: uni.getStorageSync(KEY) || [] }),
    getters: { defaultAddress: (s) => s.list.find((a) => a.isDefault) || null },
    actions: {
        persist() { uni.setStorageSync(KEY, this.list) },
        add(addr) {
            const item = { id: Date.now(), isDefault: this.list.length === 0, ...addr }
            this.list.push(item); this.persist()
        },
        update(id, patch) { const i = this.list.find((a) => a.id === id); if (i) Object.assign(i, patch); this.persist() },
        remove(id) {
            this.list = this.list.filter((a) => a.id !== id)
            if (!this.list.find((a) => a.isDefault) && this.list.length) this.list[0].isDefault = true
            this.persist()
        },
        setDefault(id) { this.list.forEach((a) => (a.isDefault = a.id === id)); this.persist() },
    },
})
