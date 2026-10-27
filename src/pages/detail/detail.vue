<script>
import { getProduct } from '@/api/goods'
import { resolveImg } from '@/utils/image'
import { useCartStore } from '@/stores/cart'

export default {
    data() {
        return {
            id: '',
            product: null,
            loaded: false,
            qty: 1,
        }
    },
    computed: {
        // 后端目前只返回一张 cover；以后加 product.images 数组时改这里即可
        images() {
            return [resolveImg(this.product?.cover)]
        },
        priceYuan() {
            return ((this.product?.price || 0) / 100).toFixed(2)
        },
        descHtml() {
            const text = this.product?.desc || '暂无更多描述'
            return `<p style="font-size: 14px; color: #4b5563; line-height: 1.8; margin: 0;">${text}</p>`
        },
    },
    onLoad(options) {
        this.id = options.id
        this.loadDetail()
    },
    methods: {
        async loadDetail() {
            if (!this.id) {
                this.loaded = true
                return
            }
            try {
                this.product = await getProduct(this.id)
            } catch (e) {
                console.error(e)
                this.product = null
            } finally {
                this.loaded = true
            }
        },
        openSku() {
            this.$refs.skuPopup.open()
        },
        closeSku() {
            this.$refs.skuPopup.close()
        },
        changeQty(step) {
            const next = this.qty + step
            if (next < 1 || next > 99) return
            this.qty = next
        },
        addCart() {
            useCartStore().addItem(this.product, this.qty)
            uni.showToast({ title: '已加入购物车', icon: 'none' })
            this.closeSku()
        },
        buyNow() {
            uni.showToast({ title: '下单将在 D19 接入', icon: 'none' })
            this.closeSku()
        },
        goHome() {
            uni.reLaunch({ url: '/pages/index/index' })
        },
    },
}
</script>

<template>
    <view class="page">
        <!-- 加载中 / 商品不存在：两种异常状态先兜住，避免白屏 -->
        <view v-if="!loaded" class="state">
            <text class="state-desc">加载中...</text>
        </view>
        <view v-else-if="!product" class="state">
            <text class="state-title">商品不存在</text>
            <text class="state-desc">可能已下架，或链接有误</text>
            <view class="state-btn" @tap="goHome">返回首页</view>
        </view>

        <template v-else>
            <!-- 轮播：后端目前只有 cover 一张图，多图时 images 会自动变长 -->
            <swiper class="gallery" :indicator-dots="images.length > 1" :autoplay="images.length > 1"
                :circular="images.length > 1" indicator-active-color="#ffffff">
                <swiper-item v-for="(img, i) in images" :key="i">
                    <image class="gallery-img" :src="img" mode="aspectFill" />
                </swiper-item>
            </swiper>

            <!-- 价格 + 名称 + 简介 -->
            <view class="panel">
                <view class="price-row">
                    <text class="price">¥{{ priceYuan }}</text>
                    <text class="tag">包邮</text>
                </view>
                <text class="name">{{ product.name }}</text>
                <text class="desc">{{ product.desc || '暂无商品描述' }}</text>
            </view>

            <!-- 图文详情：后端 desc 目前是纯文本，包一层 HTML 后由 rich-text 渲染 -->
            <view class="panel">
                <text class="panel-title">商品详情</text>
                <rich-text class="rich" :nodes="descHtml" />
            </view>

            <view class="panel">
                <text class="panel-title">服务保障</text>
                <text class="meta-line">· 7 天无理由退换</text>
                <text class="meta-line">· 48 小时内发货</text>
                <text class="meta-line">· 全国联保</text>
            </view>

            <!-- 底部操作栏：固定在底部，iOS 安全区留白 -->
            <view class="bar">
                <view class="bar-icon" @tap="goHome">
                    <text class="bar-icon-text">首页</text>
                </view>
                <view class="bar-btn ghost" @tap="openSku">加入购物车</view>
                <view class="bar-btn" @tap="openSku">立即购买</view>
            </view>

            <!-- 规格/数量选择弹窗 -->
            <uni-popup ref="skuPopup" type="bottom" background-color="#ffffff">
                <view class="sku">
                    <view class="sku-head">
                        <image class="sku-thumb" :src="images[0]" mode="aspectFill" />
                        <view class="sku-info">
                            <text class="sku-price">¥{{ priceYuan }}</text>
                            <text class="sku-stock">库存充足</text>
                        </view>
                        <text class="sku-close" @tap="closeSku">×</text>
                    </view>

                    <view class="sku-body">
                        <text class="sku-label">数量</text>
                        <view class="qty">
                            <view class="qty-btn" :class="{ disabled: qty <= 1 }" @tap="changeQty(-1)">−</view>
                            <text class="qty-num">{{ qty }}</text>
                            <view class="qty-btn" @tap="changeQty(1)">+</view>
                        </view>
                    </view>

                    <view class="sku-actions">
                        <view class="sku-btn ghost" @tap="addCart">加入购物车</view>
                        <view class="sku-btn" @tap="buyNow">立即购买</view>
                    </view>
                </view>
            </uni-popup>
        </template>
    </view>
</template>
<style>
.page {
    min-height: 100vh;
    background: #f6f7f9;
    padding-bottom: 140rpx;
    /* 给固定底栏留出空间 */
}

/* ---------- 状态兜底 ---------- */
.state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 200rpx;
}

.state-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1f2328;
}

.state-desc {
    margin-top: 12rpx;
    font-size: 26rpx;
    color: #6b7280;
}

.state-btn {
    margin-top: 40rpx;
    padding: 18rpx 48rpx;
    border-radius: 999rpx;
    background: #2563eb;
    color: #fff;
    font-size: 28rpx;
}

/* ---------- 轮播 ---------- */
.gallery {
    width: 750rpx;
    height: 750rpx;
    background: #fff;
}

.gallery-img {
    width: 750rpx;
    height: 750rpx;
}

/* ---------- 信息面板 ---------- */
.panel {
    margin: 20rpx 24rpx 0;
    padding: 28rpx;
    background: #fff;
    border: 2rpx solid #e6e8eb;
    border-radius: 24rpx;
}

.panel-title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #1f2328;
    margin-bottom: 16rpx;
}

.price-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.price {
    font-size: 44rpx;
    font-weight: 700;
    color: #e5484d;
}

.tag {
    padding: 4rpx 14rpx;
    border-radius: 999rpx;
    background: #eef4ff;
    color: #2563eb;
    font-size: 22rpx;
}

.name {
    display: block;
    margin-top: 16rpx;
    font-size: 34rpx;
    font-weight: 600;
    color: #1f2328;
    line-height: 1.45;
}

.desc {
    display: block;
    margin-top: 12rpx;
    font-size: 26rpx;
    color: #6b7280;
    line-height: 1.6;
}

.meta-line {
    display: block;
    font-size: 26rpx;
    color: #6b7280;
    line-height: 1.9;
}

/* ---------- 底部操作栏 ---------- */
.bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 16rpx 24rpx;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
    background: #fff;
    border-top: 2rpx solid #e6e8eb;
}

.bar-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 88rpx;
    height: 76rpx;
    border-radius: 16rpx;
    background: #f6f7f9;
}

.bar-icon-text {
    font-size: 24rpx;
    color: #6b7280;
}

.bar-btn {
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

.bar-btn.ghost {
    background: #eef4ff;
    color: #2563eb;
}

/* ---------- SKU 弹窗 ---------- */
.sku {
    padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
}

.sku-head {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding-bottom: 28rpx;
    border-bottom: 2rpx solid #e6e8eb;
}

.sku-thumb {
    width: 140rpx;
    height: 140rpx;
    border-radius: 16rpx;
    background: #f6f7f9;
}

.sku-info {
    flex: 1;
}

.sku-price {
    display: block;
    font-size: 36rpx;
    font-weight: 700;
    color: #e5484d;
}

.sku-stock {
    display: block;
    margin-top: 8rpx;
    font-size: 24rpx;
    color: #6b7280;
}

.sku-close {
    font-size: 44rpx;
    color: #9ca3af;
    line-height: 1;
    padding: 0 8rpx;
}

.sku-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 0;
}

.sku-label {
    font-size: 28rpx;
    color: #1f2328;
}

.qty {
    display: flex;
    align-items: center;
}

.qty-btn {
    width: 64rpx;
    height: 56rpx;
    line-height: 56rpx;
    text-align: center;
    border: 2rpx solid #e6e8eb;
    border-radius: 12rpx;
    font-size: 32rpx;
    color: #1f2328;
}

.qty-btn.disabled {
    color: #d1d5db;
}

.qty-num {
    width: 88rpx;
    text-align: center;
    font-size: 28rpx;
    color: #1f2328;
}

.sku-actions {
    display: flex;
    gap: 16rpx;
}

.sku-btn {
    flex: 1;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999rpx;
    background: #2563eb;
    color: #fff;
    font-size: 28rpx;
}

.sku-btn.ghost {
    background: #eef4ff;
    color: #2563eb;
}

/* ---------- 富文本 ---------- */
.rich {
    display: block;
    font-size: 26rpx;
    color: #4b5563;
}
</style>