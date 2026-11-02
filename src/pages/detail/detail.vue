<script>
import { getProduct } from '@/api/goods'
import { getReviews, createReview } from '@/api/review'
import { resolveImg } from '@/utils/image'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

export default {
    data() {
        return {
            id: '',
            product: null,
            loaded: false,
            qty: 1,
            reviews: { list: [], total: 0, averageRating: 0 },
            reviewPopup: false,
            myRating: 5,
            myContent: '',
            submitting: false,
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
        this.loadReviews()
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
        async loadReviews() {
            if (!this.id) return
            try {
                const data = await getReviews({ productId: this.id, page: 1, pageSize: 10 })
                this.reviews = {
                    list: data.list || [],
                    total: data.total || 0,
                    averageRating: data.stats?.averageRating || 0,
                }
            } catch (e) {
                console.error(e)
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
            if (!useAuthStore().isLoggedIn) {
                uni.showToast({ title: '请先登录', icon: 'none' })
                this.closeSku()
                return uni.navigateTo({ url: '/pages/login/login' })
            }
            // 立即购买：把当前商品+数量放进 cart store 的「单买」暂存，再进确认订单页
            // 与购物车结算走的是两条互斥入口，互不污染
            useCartStore().setBuyNow(this.product, this.qty)
            this.closeSku()
            uni.navigateTo({ url: '/pages/confirm/confirm?mode=buy' })
        },
        goHome() {
            uni.reLaunch({ url: '/pages/index/index' })
        },
        openReview() {
            this.myRating = 5
            this.myContent = ''
            this.reviewPopup = true
            this.$refs.reviewPopup.open()
        },
        closeReview() {
            this.reviewPopup = false
            this.$refs.reviewPopup.close()
        },
        async submitReview() {
            if (!useAuthStore().isLoggedIn) {
                uni.showToast({ title: '请先登录', icon: 'none' })
                this.closeReview()
                return uni.navigateTo({ url: '/pages/login/login' })
            }
            if (!this.myRating) {
                uni.showToast({ title: '请先评分', icon: 'none' })
                return
            }
            this.submitting = true
            try {
                await createReview({ productId: Number(this.id), rating: this.myRating, content: this.myContent || undefined })
                uni.showToast({ title: '评价成功', icon: 'none' })
                this.closeReview()
                this.loadReviews()
            } catch (e) {
                uni.showToast({ title: e?.message || '评价失败', icon: 'none' })
            } finally {
                this.submitting = false
            }
        },
        maskName(name) {
            if (!name) return '匿名'
            if (name.length <= 2) return name[0] + '***'
            return name.slice(0, 2) + '***' + name.slice(-1)
        },
        formatDate(ts) {
            if (!ts) return ''
            const d = new Date(ts)
            const p = (n) => (n < 10 ? '0' + n : '' + n)
            return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
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

            <!-- 商品评价：公开列表 + 写评价入口 -->
            <view class="panel">
                <view class="review-head">
                    <text class="panel-title">商品评价</text>
                    <text class="review-stat">{{ reviews.total }} 条 · 平均 {{ reviews.averageRating || 0 }} 分</text>
                    <text class="review-write" @tap="openReview">写评价</text>
                </view>
                <view v-if="reviews.list.length === 0" class="review-empty">暂无评价，快来抢沙发~</view>
                <view v-for="r in reviews.list" :key="r.id" class="review-item">
                    <view class="review-top">
                        <text class="review-name">{{ maskName(r.reviewerName) }}</text>
                        <text class="review-stars">{{ '★★★★★'.slice(0, r.rating) }}{{ '☆☆☆☆☆'.slice(0, 5 - r.rating) }}</text>
                    </view>
                    <text class="review-content">{{ r.content || '该用户未填写评价内容' }}</text>
                    <text class="review-date">{{ formatDate(r.createdAt) }}</text>
                </view>
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

            <!-- 写评价弹窗 -->
            <uni-popup ref="reviewPopup" type="bottom" background-color="#ffffff">
                <view class="review-form">
                    <view class="review-form-head">
                        <text class="sku-close" @tap="closeReview">×</text>
                        <text class="review-form-title">发表评价</text>
                    </view>
                    <view class="review-form-body">
                        <text class="sku-label">评分</text>
                        <view class="stars">
                            <text v-for="n in 5" :key="n" class="star" :class="{ active: n <= myRating }" @tap="myRating = n">{{ n <= myRating ? '★' : '☆' }}</text>
                        </view>
                        <textarea class="review-textarea" v-model="myContent" maxlength="500" placeholder="说说你的使用感受（选填，最多 500 字）" />
                    </view>
                    <view class="review-form-actions">
                        <view class="sku-btn" @tap="submitReview">{{ submitting ? '提交中...' : '提交评价' }}</view>
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

/* ---------- 商品评价 ---------- */
.review-head {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
}

.review-stat {
    flex: 1;
    margin-left: 16rpx;
    font-size: 24rpx;
    color: #6b7280;
}

.review-write {
    font-size: 26rpx;
    color: #2563eb;
}

.review-empty {
    font-size: 26rpx;
    color: #9ca3af;
    padding: 20rpx 0;
    text-align: center;
}

.review-item {
    padding: 20rpx 0;
    border-top: 2rpx solid #f0f1f3;
}

.review-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.review-name {
    font-size: 26rpx;
    color: #1f2328;
}

.review-stars {
    font-size: 24rpx;
    color: #f59e0b;
}

.review-content {
    display: block;
    margin-top: 8rpx;
    font-size: 26rpx;
    color: #4b5563;
    line-height: 1.6;
}

.review-date {
    display: block;
    margin-top: 8rpx;
    font-size: 22rpx;
    color: #9ca3af;
}

/* ---------- 写评价弹窗 ---------- */
.review-form {
    padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
}

.review-form-head {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 24rpx;
    border-bottom: 2rpx solid #e6e8eb;
}

.review-form-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1f2328;
}

.review-form-body {
    padding: 32rpx 0;
}

.stars {
    display: flex;
    gap: 16rpx;
    margin-top: 16rpx;
}

.star {
    font-size: 48rpx;
    color: #d1d5db;
}

.star.active {
    color: #f59e0b;
}

.review-textarea {
    width: 100%;
    height: 200rpx;
    margin-top: 24rpx;
    padding: 20rpx;
    box-sizing: border-box;
    border: 2rpx solid #e6e8eb;
    border-radius: 16rpx;
    font-size: 26rpx;
    color: #1f2328;
}

.review-form-actions {
    margin-top: 16rpx;
}
</style>
