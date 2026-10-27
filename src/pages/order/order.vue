<template>
    <view class="page">
        <view v-if="order.orders.length === 0" class="empty">
            <text class="empty-t">还没有订单</text>
            <view class="btn" @tap="goShop">去逛逛</view>
        </view>

        <view class="card" v-for="o in order.orders" :key="o.orderNo" @tap="goDetail(o.orderNo)">
            <view class="card-top">
                <text class="no">订单号 {{ o.orderNo }}</text>
                <text class="status" :class="'s' + o.status">{{ statusText(o.status) }}</text>
            </view>
            <view class="items">
                <text class="line" v-for="it in o.items" :key="it.productId">{{ it.name }} ×{{ it.number }}</text>
            </view>
            <view class="card-bottom">
                <text class="total">合计 ¥{{ (o.totalAmount / 100).toFixed(2) }}</text>
            </view>
        </view>
    </view>
</template>

<script>
import { useOrderStore, ORDER_STATUS } from '@/stores/order'
export default {
    computed: { order() { return useOrderStore() } },
    methods: {
        statusText(s) { return ORDER_STATUS[s] || '未知' },
        goDetail(no) { uni.navigateTo({ url: `/pages/order-detail/order-detail?orderNo=${no}` }) },
        goShop() { uni.switchTab({ url: '/pages/index/index' }) },
    },
}
</script>

<style>
.page {
    padding: 24rpx;
    min-height: 100vh;
    background: #f6f7f9;
}

.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 240rpx;
}

.empty-t {
    font-size: 28rpx;
    color: #9ca3af;
}

.btn {
    margin-top: 32rpx;
    padding: 18rpx 48rpx;
    border-radius: 999rpx;
    background: #2563eb;
    color: #fff;
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
    justify-content: space-between;
}

.no {
    font-size: 24rpx;
    color: #9ca3af;
}

.status {
    font-size: 26rpx;
    color: #e5484d;
}

.status.s2,
.status.s3 {
    color: #2563eb;
}

.status.s4 {
    color: #16a34a;
}

.status.s5 {
    color: #9ca3af;
}

.items {
    margin-top: 12rpx;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
}

.line {
    font-size: 26rpx;
    color: #4b5563;
}

.card-bottom {
    margin-top: 12rpx;
    text-align: right;
}

.total {
    font-size: 30rpx;
    font-weight: 600;
    color: #e5484d;
}
</style>