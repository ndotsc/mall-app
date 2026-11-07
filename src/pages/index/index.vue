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

    <!-- Banner 轮播：用「精选推荐」商品封面做轮播图，点按进详情（无独立 Banner 表，真实数据驱动） -->
    <swiper v-if="banners.length" class="banner" :indicator-dots="true" :autoplay="true" :interval="3500" :circular="true" indicator-active-color="#2563eb">
      <swiper-item v-for="b in banners" :key="b.id" @tap="goDetail(b)">
        <image class="banner-img" :src="resolveImg(b.cover)" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <!-- 筛选 / 排序工具条：分类宫格 + 价格区间 + 排序 -->
    <view class="filter-bar">
      <!-- 分类：宫格（含「全部」清空筛选），点按即按该分类筛选 -->
      <view class="cat-grid">
        <view class="cat-cell" :class="{ active: categoryId === '' }" @tap="onCategoryTap('')">
          <view class="cat-icon">全</view>
          <text class="cat-name">全部</text>
        </view>
        <view
          v-for="cat in categories"
          :key="cat.id"
          class="cat-cell"
          :class="{ active: categoryId === cat.id }"
          @tap="onCategoryTap(cat.id)"
        >
          <view class="cat-icon">{{ cat.name.slice(0, 1) }}</view>
          <text class="cat-name">{{ cat.name }}</text>
        </view>
      </view>

      <!-- 价格区间：输入单位为「元」，传给后端前 ×100 转「分」 -->
      <view class="price-row">
        <input
          class="price-input"
          type="digit"
          placeholder="最低价"
          :value="minPrice"
          @input="onPriceInput('min', $event)"
          @confirm="onPriceConfirm"
        />
        <text class="price-sep">—</text>
        <input
          class="price-input"
          type="digit"
          placeholder="最高价"
          :value="maxPrice"
          @input="onPriceInput('max', $event)"
          @confirm="onPriceConfirm"
        />
        <view class="price-btn" @tap="onPriceConfirm">确定</view>
      </view>

      <!-- 排序：综合 / 价格升 / 价格降 / 最新 -->
      <view class="sort-row">
        <view
          v-for="opt in sortOptions"
          :key="opt.value"
          class="sort-item"
          :class="{ active: sort === opt.value }"
          @tap="onSortTap(opt.value)"
        >{{ opt.label }}</view>
      </view>
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
import { getProducts, getCategories } from '@/api/goods'
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
      // ---- 筛选 / 排序（新增）----
      categories: [],      // 分类列表（onLoad 拉取）
      categoryId: '',      // 选中的分类 id，'' 表示「全部」
      banners: [],         // 首页 Banner 轮播：精选推荐商品封面（真实数据驱动）
      minPrice: '',        // 最低价（元，原始输入字符串）
      maxPrice: '',        // 最高价（元，原始输入字符串）
      sort: 'created_desc',// 当前排序，默认「综合」= created_desc
      sortOptions: [
        { label: '综合', value: 'created_desc' },
        { label: '价格升', value: 'price_asc' },
        { label: '价格降', value: 'price_desc' },
        { label: '最新', value: 'created_asc' },
      ],
    }
  },
  onLoad() {
    this.fetchCategories()
    this.fetchBanners()
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
        // 分类筛选：选了具体分类才传（'' 表示全部，不传）
        if (this.categoryId !== '' && this.categoryId != null) {
          params.categoryId = this.categoryId
        }
        // 价格区间：前端输入是「元」，转「分」后传给后端（minPrice/maxPrice 后端按分比较）
        const minCents = this.yuanToCents(this.minPrice)
        const maxCents = this.yuanToCents(this.maxPrice)
        if (minCents != null) params.minPrice = minCents
        if (maxCents != null) params.maxPrice = maxCents
        // 排序：默认 created_desc 不必传，仅传非默认值
        if (this.sort && this.sort !== 'created_desc') {
          params.sort = this.sort
        }
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
    // 拉取分类列表并渲染宫格（全部 / 各分类）
    async fetchCategories() {
      try {
        const res = await getCategories()
        this.categories = res?.data || []
      } catch (e) {
        console.error(e)
        this.categories = []
      }
    },
    // 拉取首页 Banner：取前 4 件「精选推荐」商品封面做轮播（真实数据，无需独立 Banner 表）
    async fetchBanners() {
      try {
        const data = await getProducts({ page: 1, pageSize: 4 })
        this.banners = (data?.list || []).map((p) => ({ id: p.id, cover: p.cover }))
      } catch (e) {
        console.error(e)
        this.banners = []
      }
    },
    // 点选分类：设置选中项并重置到第 1 页重载（'' = 全部）
    onCategoryTap(id) {
      this.categoryId = id
      this.loadProducts(true)
    },
    // 价格输入实时记录（uni 的 input 事件 detail.value 才是输入值）
    onPriceInput(field, e) {
      const val = e?.detail?.value ?? e?.target?.value ?? ''
      if (field === 'min') this.minPrice = val
      else this.maxPrice = val
    },
    // 价格「确定」/键盘「完成」：触发筛选
    onPriceConfirm() {
      this.loadProducts(true)
    },
    // 点选排序：切换并重置重载（同值不重复请求）
    onSortTap(value) {
      if (this.sort === value) return
      this.sort = value
      this.loadProducts(true)
    },
    // 「元」→「分」：非法 / 负数 / 空 返回 null（不传该参数）
    yuanToCents(val) {
      if (val === '' || val == null) return null
      const n = Number(val)
      if (!Number.isFinite(n) || n < 0) return null
      return Math.round(n * 100)
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

/* ---------- Banner 轮播 ---------- */
.banner {
  margin: 20rpx 24rpx 0;
  width: calc(100% - 48rpx);
  height: 280rpx;
  border-radius: 24rpx;
  overflow: hidden;
  background: #fff;
}
.banner-img {
  width: 100%;
  height: 280rpx;
}

/* ---------- 筛选 / 排序工具条 ---------- */
.filter-bar {
  padding: 20rpx 24rpx 16rpx;
}
/* 分类宫格：用 CSS Grid 自适应列数（每列等宽），比横向滚动更贴合「官网感」 */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx 16rpx;
}
.cat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx 0;
  border-radius: 20rpx;
  background: #fff;
  border: 2rpx solid #e6e8eb;
}
.cat-cell.active {
  background: #eef4ff;
  border-color: #2563eb;
}
.cat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
}
.cat-cell.active .cat-icon {
  background: #2563eb;
}
.cat-name {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #6b7280;
}
.cat-cell.active .cat-name {
  color: #2563eb;
}
.price-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 16rpx;
}
.price-input {
  flex: 1;
  height: 64rpx;
  padding: 0 20rpx;
  background: #fff;
  border: 2rpx solid #e6e8eb;
  border-radius: 16rpx;
  font-size: 26rpx;
  color: #1f2328;
}
.price-sep {
  margin: 0 16rpx;
  color: #9ca3af;
  font-size: 26rpx;
}
.price-btn {
  flex: 0 0 auto;
  margin-left: 16rpx;
  padding: 0 28rpx;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 16rpx;
  background: #2563eb;
  color: #fff;
  font-size: 26rpx;
}
.sort-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 16rpx;
}
.sort-item {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  margin-right: 12rpx;
  border-radius: 16rpx;
  background: #fff;
  border: 2rpx solid #e6e8eb;
  color: #6b7280;
  font-size: 26rpx;
}
.sort-item:last-child {
  margin-right: 0;
}
.sort-item.active {
  background: #eef4ff;
  border-color: #2563eb;
  color: #2563eb;
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
