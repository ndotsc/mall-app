<template>
    <view class="page">
        <view v-if="addr.list.length === 0 && !showForm" class="empty">还没有收货地址</view>

        <view class="card" v-for="a in addr.list" :key="a.id">
            <view class="card-top">
                <text class="name">{{ a.receiver }}</text>
                <text class="phone">{{ a.phone }}</text>
                <text v-if="a.isDefault" class="tag">默认</text>
            </view>
            <text class="region">{{ a.province }}{{ a.city }}{{ a.district }} {{ a.detail }}</text>
            <view class="ops">
                <text v-if="!a.isDefault" class="op" @tap="addr.setDefault(a.id)">设为默认</text>
                <text class="op" @tap="openEdit(a)">编辑</text>
                <text class="op danger" @tap="del(a.id)">删除</text>
            </view>
        </view>

        <view v-if="showForm" class="form">
            <input class="field" v-model="form.receiver" placeholder="收货人" />
            <input class="field" v-model="form.phone" placeholder="手机号" />
            <input class="field" v-model="form.province" placeholder="省" />
            <input class="field" v-model="form.city" placeholder="市" />
            <input class="field" v-model="form.district" placeholder="区/县" />
            <input class="field" v-model="form.detail" placeholder="详细地址" />
            <label class="df">
                <checkbox :checked="form.isDefault" @tap="form.isDefault = !form.isDefault" /> 设为默认地址
            </label>
            <view class="form-btns">
                <view class="btn ghost" @tap="closeForm">取消</view>
                <view class="btn" @tap="save">保存</view>
            </view>
        </view>

        <view class="add-bar" @tap="openAdd">＋ 新增地址</view>
    </view>
</template>

<script>
import { useAddressStore } from '@/stores/address'
export default {
    computed: { addr() { return useAddressStore() } },
    data() {
        return {
            showForm: false, editingId: null,
            form: { receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false },
        }
    },
    methods: {
        reset() { this.form = { receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false }; this.editingId = null },
        openAdd() { this.reset(); this.showForm = true },
        openEdit(a) { this.form = { ...a }; this.editingId = a.id; this.showForm = true },
        closeForm() { this.showForm = false; this.reset() },
        save() {
            if (!this.form.receiver || !this.form.phone || !this.form.detail) return uni.showToast({ title: '请填完整', icon: 'none' })
            if (this.editingId) this.addr.update(this.editingId, this.form)
            else this.addr.add(this.form)
            this.closeForm()
        },
        del(id) { uni.showModal({ title: '提示', content: '删除该地址？', success: (r) => { if (r.confirm) this.addr.remove(id) } }) },
    },
}
</script>

<style>
.page {
    padding: 24rpx;
    min-height: 100vh;
    background: #f6f7f9;
    padding-bottom: 140rpx;
}

.empty {
    text-align: center;
    color: #9ca3af;
    padding-top: 200rpx;
    font-size: 28rpx;
}

.card {
    background: #fff;
    border: 2rpx solid #e6e8eb;
    border-radius: 24rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
}

.card-top {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.name {
    font-size: 30rpx;
    font-weight: 600;
    color: #1f2328;
}

.phone {
    font-size: 26rpx;
    color: #6b7280;
}

.tag {
    font-size: 22rpx;
    color: #2563eb;
    background: #eef4ff;
    padding: 2rpx 12rpx;
    border-radius: 999rpx;
}

.region {
    display: block;
    margin-top: 12rpx;
    font-size: 26rpx;
    color: #4b5563;
    line-height: 1.6;
}

.ops {
    display: flex;
    gap: 32rpx;
    margin-top: 16rpx;
}

.op {
    font-size: 26rpx;
    color: #2563eb;
}

.op.danger {
    color: #e5484d;
}

.form {
    background: #fff;
    border: 2rpx solid #e6e8eb;
    border-radius: 24rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
}

.field {
    height: 80rpx;
    border: 2rpx solid #e6e8eb;
    border-radius: 12rpx;
    padding: 0 20rpx;
    margin-bottom: 16rpx;
    font-size: 28rpx;
}

.df {
    display: flex;
    align-items: center;
    font-size: 26rpx;
    color: #4b5563;
    margin: 8rpx 0 16rpx;
}

.form-btns {
    display: flex;
    gap: 16rpx;
}

.btn {
    flex: 1;
    height: 76rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999rpx;
    background: #2563eb;
    color: #fff;
    font-size: 28rpx;
}

.btn.ghost {
    background: #eef4ff;
    color: #2563eb;
}

.add-bar {
    position: fixed;
    left: 24rpx;
    right: 24rpx;
    bottom: calc(20rpx + env(safe-area-inset-bottom));
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999rpx;
    background: #2563eb;
    color: #fff;
    font-size: 30rpx;
}
</style>