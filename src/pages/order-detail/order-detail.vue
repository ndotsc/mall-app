<template>
    <view class="page">
        <view v-if="!o" class="empty">订单不存在</view>

        <template v-else>
            <view class="status-bar">
                <text class="big">{{ statusText(o.status) }}</text>
            </view>

            <view class="block">
                <text class="b-title">收货信息</text>
                <text class="b-line">{{ o.info.name }} {{ o.info.phone }}</text>
                <text class="b-line">{{ o.info.address }}</text>
            </view>

            <view class="block">
                <text class="b-title">商品清单</text>
                <view class="g-row" v-for="it in o.items" :key="it.productId">
                    <image class="g-pic" :src="resolveImg(it.cover)" mode="aspectFill" />
                    <view class="g-info">
                        <text class="g-name">{{ it.name }}</text>
                        <text class="g-price">¥{{ (it.price / 100).toFixed(2) }}</text>
                    </view>
                    <text class="g-num">×{{ it.number }}</text>
                </view>
            </view>

            <view class="block">
                <text class="b-title">订单信息</text>
                <text class="b-line">订单号：{{ o.orderNo }}</text>
                <text class="b-line" v-if="o.remark">备注：{{ o.remark }}</text>
                <text class="b-line">实付款：¥{{ (o.totalAmount / 100).toFixed(2) }}</text>
            </view>

            <!-- 状态流转按钮 -->
            <view class="actions">
                <template v-if="o.status === 1">
                    <view class="a-btn ghost" @tap="cancel">取消订单</view>
                    <view class="a-btn" @tap="pay">去支付</view>
                </template>
                <view v-else-if="o.status === 2" class="a-tip">商家发货中（演示：点下方模拟发货）</view>
                <view v-else-if="o.status === 3" class="a-btn" @tap="receive">确认收货</view>
                <view v-else-if="o.status === 4" class="a-tip">交易已完成</view>
                <view v-else class="a-tip">订单已取消</view>
                <view v-if="o.status === 2" class="a-btn ghost" @tap="ship">模拟发货</view>
            </view>
        </template>
    </view>
</template>

<script>
import { useOrderStore, ORDER_STATUS } from '@/stores/order'
import { resolveImg } from '@/utils/image'
export default {
    data() { return { orderNo: '' } },
    computed: {
        order() { return useOrderStore() },
        o() { return this.order.orderByNo(this.orderNo) },
    },
    onLoad(opt) { this.orderNo = opt.orderNo },
    methods: {
        resolveImg,
        statusText(s) { return ORDER_STATUS[s] || '未知' },
        pay() { this.order.pay(this.orderNo); uni.showToast({ title: '已支付', icon: 'success' }) },
        ship() { this.order.ship(this.orderNo); uni.showToast({ title: '已发货', icon: 'success' }) },
        receive() { this.order.receive(this.orderNo); uni.showToast({ title: '已收货', icon: 'success' }) },
        cancel() {
            uni.showModal({ title: '提示', content: '取消该订单？', success: (r) => { if (r.confirm) { this.order.cancel(this.orderNo); uni.showToast({ title: '已取消', icon: 'none' }) } } })
        },
    },
}
</script>

<style>
.page {
    padding: 24rpx;
    min-height: 100vh;
    background: #f6f7f9;
    padding-bottom: 160rpx;
}

.empty {
    text-align: center;
    color: #9ca3af;
    padding-top: 200rpx;
    font-size: 28rpx;
}

.status-bar {
    background: #2563eb;
    border-radius: 24rpx;
    padding: 36rpx;
    margin-bottom: 20rpx;
}

.big {
    font-size: 36rpx;
    font-weight: 700;
    color: #fff;
}

.block {
    background: #fff;
    border: 2rpx solid #e6e8eb;
    border-radius: 24rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
}

.b-title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #1f2328;
    margin-bottom: 12rpx;
}

.b-line {
    display: block;
    font-size: 26rpx;
    color: #4b5563;
    line-height: 1.7;
}

.g-row {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 12rpx 0;
    border-bottom: 2rpx solid #f0f1f3;
}

.g-row:last-child {
    border-bottom: none;
}

.g-pic {
    width: 96rpx;
    height: 96rpx;
    border-radius: 12rpx;
    background: #f6f7f9;
}

.g-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.g-name {
    font-size: 28rpx;
    color: #1f2328;
}

.g-price {
    font-size: 28rpx;
    font-weight: 600;
    color: #e5484d;
}

.g-num {
    font-size: 26rpx;
    color: #6b7280;
}

.actions {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16rpx;
    padding: 16rpx 24rpx;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
    background: #fff;
    border-top: 2rpx solid #e6e8eb;
}

.a-btn {
    padding: 18rpx 44rpx;
    border-radius: 999rpx;
    background: #2563eb;
    color: #fff;
    font-size: 28rpx;
}

.a-btn.ghost {
    background: #eef4ff;
    color: #2563eb;
}

.a-tip {
    font-size: 26rpx;
    color: #9ca3af;
}
</style>