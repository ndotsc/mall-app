<template>
    <view class="page">
        <view v-if="cart.items.length === 0" class="empty">
            <text class="empty-title">购物车还是空的</text>
            <view class="empty-btn" @tap="goShop">去逛逛</view>
        </view>

        <template v-else>
            <view class="top-bar">
                <view class="checkbox" :class="{ on: cart.allChecked }" @tap="cart.toggleAll(!cart.allChecked)">
                    <text v-if="cart.allChecked" class="tick">✓</text>
                </view>
                <text class="top-text">全选</text>
                <text class="my-order" @tap="goOrders">我的订单</text>
                <text class="my-order mine" @tap="goMine">我的</text>
                <text class="clear" @tap="removeChecked">删除选中</text>
            </view>

            <view class="list">
                <view class="row" v-for="item in cart.items" :key="item.productId">
                    <view class="checkbox" :class="{ on: item.checked }" @tap="cart.toggleCheck(item.productId)">
                        <text v-if="item.checked" class="tick">✓</text>
                    </view>
                    <image class="pic" :src="resolveImg(item.image)" mode="aspectFill" />
                    <view class="info">
                        <text class="name">{{ item.title }}</text>
                        <text class="price">¥{{ (item.price / 100).toFixed(2) }}</text>
                        <view class="stepper">
                            <view class="step" :class="{ disabled: item.quantity <= 1 }"
                                @tap="cart.updateQty(item.productId, item.quantity - 1)">−</view>
                            <text class="num">{{ item.quantity }}</text>
                            <view class="step" @tap="cart.updateQty(item.productId, item.quantity + 1)">＋</view>
                        </view>
                    </view>
                    <text class="del" @tap="cart.removeItem(item.productId)">×</text>
                </view>
            </view>
        </template>

        <view v-if="cart.items.length" class="bar">
            <view class="bar-left">
                <text class="bar-label">合计</text>
                <text class="bar-amount">¥{{ (cart.checkedAmount / 100).toFixed(2) }}</text>
            </view>
            <view class="bar-btn" @tap="checkout">结算（{{ cart.checkedCount }}）</view>
        </view>
    </view>
</template>

<script>
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { resolveImg } from '@/utils/image'

export default {
    computed: { cart() { return useCartStore() } },
    onShow() { this.cart.load() },   // 每次进入购物车都从后端拉最新（下单后回来能刷新）
    methods: {
        resolveImg,
        removeChecked() {
            if (!this.cart.checkedCount) return
            uni.showModal({ title: '提示', content: '删除选中的商品？', success: (r) => { if (r.confirm) this.cart.removeChecked() } })
        },
        goShop() { uni.switchTab({ url: '/pages/index/index' }) },
        checkout() {
            if (!this.cart.checkedCount) return uni.showToast({ title: '请先勾选商品', icon: 'none' })
            // 结算前必须登录（下单接口需要 Authorization）
            if (!useAuthStore().isLoggedIn) {
                uni.showToast({ title: '请先登录', icon: 'none' })
                return uni.navigateTo({ url: '/pages/login/login' })
            }
            uni.navigateTo({ url: '/pages/confirm/confirm' })
        },
        goOrders() {
            if (!useAuthStore().isLoggedIn) {
                uni.showToast({ title: '请先登录', icon: 'none' })
                return uni.navigateTo({ url: '/pages/login/login' })
            }
            uni.navigateTo({ url: '/pages/order/order' })
        },
        goMine() {
            if (!useAuthStore().isLoggedIn) return uni.navigateTo({ url: '/pages/login/login' })
            uni.navigateTo({ url: '/pages/mine/mine' })
        },
    },
}
</script>

<style>
.page {
    min-height: 100vh;
    background: #f6f7f9;
    /* 底部留白：保证商品列表滚动时不被固定结算栏(.bar, 约 100rpx)遮挡。
       注意这只是滚动余量，与「结算栏定位」无关——定位靠 .bar 的 bottom:0。 */
    padding-bottom: calc(220rpx + env(safe-area-inset-bottom));
}

.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 240rpx;
}

.empty-title {
    font-size: 28rpx;
    color: #9ca3af;
}

.empty-btn {
    margin-top: 32rpx;
    padding: 18rpx 48rpx;
    border-radius: 999rpx;
    background: #2563eb;
    color: #fff;
    font-size: 28rpx;
}

.top-bar {
    display: flex;
    align-items: center;
    padding: 24rpx;
    gap: 16rpx;
}

.top-text {
    font-size: 28rpx;
    color: #1f2328;
}

.clear {
    font-size: 26rpx;
    color: #e5484d;
}

.checkbox {
    width: 40rpx;
    height: 40rpx;
    border: 2rpx solid #d1d5db;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.checkbox.on {
    background: #2563eb;
    border-color: #2563eb;
}

.tick {
    color: #fff;
    font-size: 24rpx;
}

.list {
    padding: 0 24rpx;
}

.row {
    display: flex;
    align-items: center;
    gap: 20rpx;
    background: #fff;
    border: 2rpx solid #e6e8eb;
    border-radius: 24rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;
}

.pic {
    width: 140rpx;
    height: 140rpx;
    border-radius: 16rpx;
    background: #f6f7f9;
}

.info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
}

.name {
    font-size: 28rpx;
    color: #1f2328;
}

.price {
    font-size: 30rpx;
    font-weight: 600;
    color: #e5484d;
}

.stepper {
    display: flex;
    align-items: center;
    gap: 4rpx;
    margin-top: 4rpx;
}

.step {
    width: 52rpx;
    height: 52rpx;
    line-height: 52rpx;
    text-align: center;
    border: 2rpx solid #e6e8eb;
    border-radius: 12rpx;
    font-size: 30rpx;
    color: #1f2328;
}

.step.disabled {
    color: #d1d5db;
}

.num {
    width: 72rpx;
    text-align: center;
    font-size: 28rpx;
}

.del {
    font-size: 40rpx;
    color: #9ca3af;
    padding: 0 8rpx;
}

.bar {
    position: fixed;
    left: 0;
    right: 0;
    /* 结算栏「吸附」原生 tabBar：
       购物车是 tabBar 页，uni-app 会为原生 tabBar 预留空间，
       webview 的 bottom:0 已经是「tabBar 顶边」。所以固定栏必须 bottom:0 才严丝合缝；
       之前写 100rpx（或再叠 env 安全区）会把栏往上抬、在栏与 tabBar 间留出空隙。
       底部安全区（小白条）由原生 tabBar 自己处理，这里不要再叠 env()，
       否则反而多出一段空隙。 */
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 24rpx;
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

.my-order {
    margin-left: auto;
    font-size: 26rpx;
    color: #2563eb;
}

.mine {
    margin-left: 0;
}
</style>