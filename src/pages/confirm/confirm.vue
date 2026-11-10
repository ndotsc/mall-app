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
                    <smart-image class="g-pic" :src="resolveImg(it.cover)" mode="aspectFill" />
                    <view class="g-info">
                        <text class="g-name">{{ it.name }}</text>
                        <text class="g-price">¥{{ (it.price / 100).toFixed(2) }}</text>
                    </view>
                    <text class="g-num">×{{ it.number }}</text>
                </view>
            </view>

            <!-- 优惠券选择 -->
            <view class="coupon-row" @tap="openCoupon">
                <text class="cr-label">优惠券</text>
                <text class="cr-value" v-if="!selectedCoupon">请选择优惠券 ＞</text>
                <text class="cr-value on" v-else>-¥{{ (discount / 100).toFixed(2) }}（{{ selectedCoupon.coupon.label }}）</text>
            </view>

            <input class="remark" v-model="remark" placeholder="订单备注（选填）" />

            <!-- 提交栏（整页，bottom:0 安全） -->
            <view class="bar">
                <view class="bar-left">
                    <text class="bar-label">合计</text>
                    <text class="bar-amount">¥{{ (payAmount / 100).toFixed(2) }}</text>
                    <text v-if="discount > 0" class="bar-discount">已优惠¥{{ (discount / 100).toFixed(2) }}</text>
                </view>
                <view class="bar-btn" @tap="submit">提交订单</view>
            </view>
        </template>

        <!-- 优惠券选择弹层 -->
        <view v-if="showCoupon" class="mask" @tap="showCoupon = false">
            <view class="sheet" @tap.stop>
                <view class="sheet-title">选择优惠券</view>
                <view v-if="!coupons.length" class="sheet-empty">暂无可用优惠券</view>
                <view
                    v-for="c in coupons"
                    :key="c.id"
                    class="c-item"
                    :class="{ disabled: computeDiscount(c.coupon, total) === 0 }"
                    @tap="pickCoupon(c)"
                >
                    <view class="c-left">
                        <text class="c-label">{{ c.coupon.label }}</text>
                        <text class="c-name">{{ c.coupon.name }}</text>
                    </view>
                    <view class="c-right">
                        <text v-if="computeDiscount(c.coupon, total) === 0" class="c-tip">不可用</text>
                        <text v-else class="c-check" :class="{ on: selectedCoupon && selectedCoupon.id === c.id }">✓</text>
                    </view>
                </view>
                <view class="sheet-cancel" @tap="showCoupon = false">取消</view>
            </view>
        </view>
    </view>
</template>

<script>
import { useCartStore } from '@/stores/cart'
import { useAddressStore } from '@/stores/address'
import { useOrderStore } from '@/stores/order'
import { getMyCoupons } from '@/api/coupon'
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
        total() { return this.items.reduce((s, i) => s + i.price * i.number, 0) }, // 小计（分）
        discount() {
            return this.selectedCoupon ? this.computeDiscount(this.selectedCoupon.coupon, this.total) : 0
        },
        payAmount() { return Math.max(0, this.total - this.discount) }, // 应付（分）
    },
    data() {
        return {
            remark: '',
            mode: 'cart',
            coupons: [],          // 我的未使用券
            selectedCoupon: null, // 当前选中的用户券（含 coupon 快照）
            showCoupon: false,
        }
    },
    onLoad(opt) {
        this.mode = opt.mode === 'buy' ? 'buy' : 'cart'
        this.addr.load()   // 拉取地址（含默认地址），供下单页展示
        this.loadCoupons()
    },
    methods: {
        resolveImg,
        fullAddress(a) { return `${a.province || ''}${a.city || ''}${a.district || ''} ${a.detail}`.trim() },
        // 与后端一致的优惠计算规则（单位：分）
        computeDiscount(coupon, subtotal) {
            let d = 0
            if (coupon.type === 'full_reduction') {
                if (subtotal >= coupon.threshold) d = coupon.value
            } else if (coupon.type === 'instant') {
                d = coupon.value
            } else if (coupon.type === 'discount') {
                d = Math.floor((subtotal * (100 - coupon.value)) / 100)
                if (coupon.maxDiscount != null) d = Math.min(d, coupon.maxDiscount)
            }
            if (d < 0) d = 0
            if (d > subtotal) d = subtotal
            return d
        },
        async loadCoupons() {
            try {
                const data = await getMyCoupons({ status: 'unused' })
                this.coupons = data.list || []
            } catch {
                this.coupons = []
            }
        },
        openCoupon() { this.showCoupon = true },
        pickCoupon(c) {
            if (this.computeDiscount(c.coupon, this.total) === 0) {
                uni.showToast({ title: '该券不满足使用条件', icon: 'none' })
                return
            }
            this.selectedCoupon = c
            this.showCoupon = false
        },
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
                    couponId: this.selectedCoupon ? this.selectedCoupon.id : undefined,
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

.coupon-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 24rpx;
    background: #fff;
    border: 2rpx solid #e6e8eb;
    border-radius: 24rpx;
    padding: 28rpx 24rpx;
}

.cr-label {
    font-size: 28rpx;
    color: #1f2328;
}

.cr-value {
    font-size: 26rpx;
    color: #9ca3af;
}

.cr-value.on {
    color: #e5484d;
    font-weight: 600;
}

.remark {
    margin: 0 24rpx;
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

.bar-left {
    display: flex;
    flex-direction: column;
}

.bar-label {
    font-size: 22rpx;
    color: #6b7280;
}

.bar-amount {
    font-size: 38rpx;
    font-weight: 700;
    color: #e5484d;
    margin-top: 2rpx;
}

.bar-discount {
    font-size: 22rpx;
    color: #16a34a;
}

.bar-btn {
    padding: 20rpx 56rpx;
    border-radius: 999rpx;
    background: #2563eb;
    color: #fff;
    font-size: 28rpx;
}

.mask {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: flex-end;
    z-index: 99;
}

.sheet {
    width: 100%;
    background: #fff;
    border-radius: 24rpx 24rpx 0 0;
    padding: 24rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
    max-height: 70vh;
    overflow-y: auto;
}

.sheet-title {
    text-align: center;
    font-size: 30rpx;
    font-weight: 600;
    color: #1f2328;
    padding: 12rpx 0 24rpx;
}

.sheet-empty {
    text-align: center;
    color: #9ca3af;
    font-size: 28rpx;
    padding: 60rpx 0;
}

.c-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 20rpx;
    background: #fff;
    border: 2rpx solid #e6e8eb;
    border-radius: 16rpx;
    margin-bottom: 16rpx;
}

.c-item.disabled {
    opacity: 0.5;
}

.c-left {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.c-label {
    font-size: 32rpx;
    font-weight: 700;
    color: #e5484d;
}

.c-name {
    font-size: 26rpx;
    color: #6b7280;
}

.c-right {
    flex-shrink: 0;
}

.c-tip {
    font-size: 24rpx;
    color: #9ca3af;
}

.c-check {
    font-size: 36rpx;
    color: #cbd2d9;
}

.c-check.on {
    color: #2563eb;
}

.sheet-cancel {
    margin-top: 12rpx;
    text-align: center;
    padding: 24rpx;
    font-size: 30rpx;
    color: #6b7280;
    background: #f6f7f9;
    border-radius: 16rpx;
}
</style>
