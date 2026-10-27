<template>
  <view class="page">
    <!-- Hero 首屏：与 web 版 Home.vue 同款渐变背景 + 同款文案 -->
    <view class="hero">
      <text class="hero-title">用 Vue3 搭一个</text>
      <text class="hero-title">属于你自己的商城</text>
      <text class="hero-desc">从组件化到路由，从状态管理到多端发布，一步一步把想法做出来。</text>
      <view class="hero-btn" @tap="scrollToGoods">立即逛逛</view>
    </view>

    <!-- 搜索栏：web 版没有此功能，移动端商城标配故保留（想 100% 对齐删掉这段即可） -->
    <view class="search-wrap">
      <uni-search-bar placeholder="搜索商品" cancelButton="none" @confirm="onSearch" />
    </view>

    <view id="goods" class="section">
      <text class="section-title">全部商品</text>
      <text class="section-sub">共 {{ total }} 件</text>
    </view>

    <!-- 商品网格：对齐 web 版 Products.vue 的卡片（方形图 + 名称两行 + 简介两行 + 价格） -->
    <view class="grid">
      <view class="card" v-for="item in list" :key="item.id" @tap="goDetail(item)">
        <view class="thumb-wrap">
          <image class="thumb" :src="resolveImg(item.cover)" mode="aspectFill" />
        </view>
        <view class="info">
          <text class="name">{{ item.name }}</text>
          <text class="desc">{{ item.desc }}</text>
          <text class="price">¥{{ (item.price / 100).toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <view v-if="loading || !loaded" class="loading">加载中...</view>
    <!-- loaded 用来区分「还没加载过」和「加载完确实是空的」，避免首帧闪一下"暂无商品" -->
    <view v-else-if="!list.length" class="loading">
      {{ keyword ? `没有找到与「${keyword}」相关的商品` : '暂无商品' }}
    </view>

    <!-- 触底提示：滚动到底部时自动加载下一页，加载完显示"没有更多了" -->
    <view v-if="list.length" class="footer-tip">
      <text v-if="loadingMore">加载中...</text>
      <text v-else-if="!hasMore">— 没有更多了 —</text>
    </view>
  </view>
</template>

<script>
import { getProducts } from '@/api/goods'
import { resolveImg } from '@/utils/image'

// 小程序端用"滚动到底部自动加载更多"，每页 6 件（2 列 × 3 行一屏，触底再加一屏）；
// 库里 10 件商品，正好能看到 6 + 4 的追加效果
const PAGE_SIZE = 6

export default {
  data() {
    return {
      keyword: '',
      list: [],
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
      seq: 0,              // 请求序号，用来丢弃过期响应
      loading: false,      // 首屏/搜索加载（整块 loading）
      loaded: false,       // 是否已完成过一次请求
      loadingMore: false,  // 触底加载下一页（只显示底部提示）
      hasMore: true,       // 还有没有下一页
    }
  },
  onLoad() {
    this.loadProducts(true)
  },
  // uni-app 页面生命周期：页面滚动到底部时触发（H5 与小程序都支持）
  onReachBottom() {
    if (!this.hasMore || this.loading || this.loadingMore) return
    this.page += 1
    this.loadProducts()
  },
  async onPullDownRefresh() {
    await this.loadProducts(true)
    uni.stopPullDownRefresh()
  },
  methods: {
    // reset=true 表示重新从第 1 页开始（首次进入、搜索时）
    async loadProducts(reset = false) {
      // 触底加载中不允许再并发加载；但"重新加载"（搜索）要能打断当前请求
      if (!reset && (this.loading || this.loadingMore)) return
      if (reset) this.page = 1
      const isFirstPage = this.page === 1
      // 请求序号：请求返回时若已有更新的请求发出，就丢弃这次结果（防旧数据追加到新列表）
      this.seq += 1
      const mySeq = this.seq
      // 第一页用整块 loading，后续页只用底部提示，避免列表闪一下消失
      if (isFirstPage) this.loading = true
      else this.loadingMore = true
      try {
        const params = { page: this.page, pageSize: this.pageSize }
        if (this.keyword) params.keyword = this.keyword
        const data = await getProducts(params)
        if (mySeq !== this.seq) return   // 过期响应，直接丢掉
        const pageList = data?.list || []
        // 第一页替换、后续页追加
        this.list = isFirstPage ? pageList : [...this.list, ...pageList]
        this.total = data?.total || 0
        // 后端 total 是"筛选后的总条数"，已加载满就说明到底了
        this.hasMore = this.list.length < this.total && pageList.length > 0
      } catch (e) {
        console.error(e)
        if (!isFirstPage) this.page -= 1   // 加载失败回退页码，下次触底能重试同一页
      } finally {
        // 只有最新一次请求才收尾，否则会把新请求的 loading 提前关掉
        if (mySeq === this.seq) {
          this.loading = false
          this.loadingMore = false
          this.loaded = true
        }
      }
    },
    onSearch(e) {
      this.keyword = e.value || ''
      this.loadProducts(true)
    },
    // Hero 按钮：滚动到商品区（对齐 web 版"立即逛逛"跳列表页的行为）
    scrollToGoods() {
      uni.pageScrollTo({ selector: '#goods', duration: 300 })
    },
    goDetail(item) {
      // D17 替换为：uni.navigateTo({ url: `/pages/detail/detail?id=${item.id}` })
      // uni.showToast({ title: '详情页将在 D17 实现', icon: 'none' })
      uni.navigateTo({ url: `/pages/detail/detail?id=${item.id}` })
    },
    resolveImg,
  },
}
</script>

<style>
/* 色板与 web 版 style.css 设计令牌一一对应：
   bg #f6f7f9 / surface #fff / text #1f2328 / weak #6b7280
   border #e6e8eb / brand #2563eb / danger #e5484d */
.page {
  min-height: 100vh;
  background: #f6f7f9;
  padding-bottom: 40rpx;
}

/* ---------- Hero（对应 web .hero / .hero-text）---------- */
.hero {
  background: linear-gradient(135deg, #eef4ff 0%, #f6f7f9 60%);
  border-bottom: 2rpx solid #e6e8eb;
  padding: 96rpx 40rpx 64rpx;
}
.hero-title {
  display: block;
  font-size: 56rpx;
  font-weight: 700;
  color: #1f2328;
  line-height: 1.35;
}
.hero-desc {
  display: block;
  margin-top: 24rpx;
  font-size: 28rpx;
  color: #6b7280;
  line-height: 1.6;
}
.hero-btn {
  display: inline-flex;
  align-items: center;
  margin-top: 40rpx;
  padding: 20rpx 44rpx;
  border-radius: 999rpx;
  background: #2563eb;
  color: #fff;
  font-size: 28rpx;
}

/* ---------- 搜索 ---------- */
.search-wrap {
  padding: 20rpx 24rpx 0;
}

/* ---------- 区块标题（对应 web .page-title / .page-sub）---------- */
.section {
  padding: 40rpx 24rpx 8rpx;
}
.section-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2328;
}
.section-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #6b7280;
}

/* ---------- 商品卡片（对应 web .card / .product-card）---------- */
/* 用 CSS Grid 固定 2 列：网格自动从左排齐，最后一行不满也不会像
   flex + space-between 那样被撑开留大空洞（9 件 = 6+3 的散排问题） */
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  padding: 16rpx 24rpx;
}
.card {
  background: #fff;
  border: 2rpx solid #e6e8eb;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 40rpx rgba(16, 24, 40, 0.09);
}
/* 正方形图框：padding-bottom:100% 让高度始终等于自身宽度，
   屏幕再宽也是 1:1，配 aspectFill 只裁不拉伸（等价 web 的 aspect-ratio: 1/1） */
.thumb-wrap {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  background: #f6f7f9;
}
.thumb {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 28rpx;
}
.name {
  font-size: 32rpx;
  color: #1f2328;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.desc {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.price {
  margin-top: 8rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #e5484d;
}

.loading {
  padding: 60rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #9ca3af;
}

/* 触底提示：加载中 / 没有更多了 */
.footer-tip {
  padding: 24rpx 0 48rpx;
  text-align: center;
  font-size: 24rpx;
  color: #9ca3af;
}
</style>
