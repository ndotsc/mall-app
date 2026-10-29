<template>
    <view class="page">
        <view v-if="!items.length" class="empty">
            <text class="empty-t">没有可结算的商品</text>
            <view class="btn" @tap="goCart">返回购物车</view>
        </view>

        <template v-else>
            <!-- 收货地址：点击进入地址页点选；默认用默认地址，也可选其它 -->
            <view class="addr" @tap="goAddress">
                <block v-if="addr.chosenAddress">
                    <view class="addr-top">
                        <text class="name">{{ addr.chosenAddress.name }}</text>
                        <text class="phone">{{ addr.chosenAddress.phone }}</text>
                    </view>
                    <text class="addr-detail">{{ fullAddress(addr.chosenAddress) }}</text>
                </block>
                <text v-else class="addr-add">请选择收货地址 ＞</text>
            </view>

            <!-- 商品清单（来自购物车勾选项） -->
            <view class="goods">
                <view class="g-row" v-for="it in items" :key="it.productId">
                    <image class="g-pic" :src="resolveImg(it.cover)" mode="aspectFill" />
                    <view class="g-info">
                        <text class="g-name">{{ it.name }}</text>
                        <text class="g-price">¥{{ (it.price / 100).toFixed(2) }}</text>
                    </view>
                    <text class="g-num">×{{ it.number }}</text>
                </view>
            </view>

            <input class="remark" v-model="remark" placeholder="订单备注（选填）" />

            <!-- 提交栏（整页，bottom:0 安全） -->
            <view class="bar">
                <view class="bar-left">
                    <text class="bar-label">合计</text>
                    <text class="bar-amount">¥{{ (total / 100).toFixed(2) }}</text>
                </view>
                <view class="bar-btn" @tap="submit">提交订单</view>
            </view>
        </template>
    </view>
</template>

<script>
import { useCartStore } from '@/stores/cart'
import { useAddressStore } from '@/stores/address'
import { useOrderStore } from '@/stores/order'
import { resolveImg } from '@/utils/image'

export default {
    computed: {
        cart() { return useCartStore() },
        addr() { return useAddressStore() },
        // 根据入口区分：立即购买用 buyNow 单品；购物车结算用勾选项
        items() {
            if (this.mode === 'buy') {
                return this.cart.buyNowItems
            }
            return this.cart.checkedItems.map((i) => ({
                productId: i.productId, name: i.title, price: i.price, cover: i.image, number: i.quantity,
            }))
        },
        total() { return this.items.reduce((s, i) => s + i.price * i.number, 0) },
    },
    data() { return { remark: '', mode: 'cart' } },
    onLoad(opt) {
        this.mode = opt.mode === 'buy' ? 'buy' : 'cart'
        this.addr.load()   // 拉取地址（含默认地址），供下单页展示
    },
    methods: {
        resolveImg,
        fullAddress(a) { return `${a.province || ''}${a.city || ''}${a.district || ''} ${a.detail}`.trim() },
        goAddress() {
            // 进入地址页并带上 select=1，让地址页处于「点选」模式
            uni.navigateTo({ url: '/pages/address/address?select=1' })
        },
        goCart() { uni.switchTab({ url: '/pages/cart/cart' }) },
        async submit() {
            const d = this.addr.chosenAddress
            if (!d) return uni.showToast({ title: '请先选择收货地址', icon: 'none' })
            try {
                const orderNo = await useOrderStore().createOrder({
                    items: this.items,
                    info: { name: d.name, phone: d.phone, address: this.fullAddress(d) },
                    remark: this.remark,
                })
                // 立即购买清空单品暂存；购物车结算清空已勾选
                if (this.mode === 'buy') this.cart.clearBuyNow()
                else this.cart.removeChecked()
                uni.navigateTo({ url: `/pages/order-detail/order-detail?orderNo=${orderNo}` })
            } catch {
                // 下单失败（如登录失效）：request 已弹 toast，这里不重复提示
            }
        },
    },
}
</script>

<style>
.page {
    min-height: 100vh;
    background: #f6f7f9;
    padding-bottom: 140rpx;
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

.addr {
    background: #fff;
    border: 2rpx solid #e6e8eb;
    border-radius: 24rpx;
    padding: 24rpx;
    margin: 24rpx;
}

.addr-top {
    display: flex;
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

.addr-detail {
    display: block;
    margin-top: 10rpx;
    font-size: 26rpx;
    color: #4b5563;
    line-height: 1.6;
}

.addr-add {
    font-size: 28rpx;
    color: #2563eb;
}

.goods {
    margin: 0 24rpx;
    background: #fff;
    border: 2rpx solid #e6e8eb;
    border-radius: 24rpx;
    padding: 8rpx 20rpx;
}

.g-row {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 16rpx 0;
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

.remark {
    margin: 24rpx;
    height: 80rpx;
    border: 2rpx solid #e6e8eb;
    border-radius: 12rpx;
    padding: 0 20rpx;
    font-size: 28rpx;
    background: #fff;
}

.bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 24rpx;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
    background: #fff;
    border-top: 2rpx solid #e6e8eb;
}

.bar-label {
    font-size: 26rpx;
    color: #6b7280;
}

.bar-amount {
    font-size: 38rpx;
    font-weight: 700;
    color: #e5484d;
    margin-left: 8rpx;
}

.bar-btn {
    padding: 20rpx 56rpx;
    border-radius: 999rpx;
    background: #2563eb;
    color: #fff;
    font-size: 28rpx;
}
</style>