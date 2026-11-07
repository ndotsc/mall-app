<template>
  <view class="page">
    <view class="head">
      <text class="title">我的收藏</text>
    </view>

    <view v-if="!loaded" class="tip">加载中...</view>
    <view v-else-if="!list.length" class="tip">还没有收藏任何商品，去首页逛逛吧~</view>

    <view v-else class="grid">
      <view class="card" v-for="item in list" :key="item.id" @tap="goDetail(item)">
        <view class="thumb-wrap">
          <image class="thumb" :src="resolveImg(item.product?.cover)" mode="aspectFill" />
          <view class="remove" @tap.stop="remove(item)">取消收藏</view>
        </view>
        <view class="info">
          <text class="name">{{ item.product?.name || '商品已下架' }}</text>
          <text class="price" v-if="item.product">¥{{ (item.product.price / 100).toFixed(2) }}</text>
          <text class="price off" v-else>已下架</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { getFavorites, removeFavorite } from '@/api/favorite'
import { resolveImg } from '@/utils/image'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const list = ref([])
const loaded = ref(false)

async function load() {
  if (!auth.isLoggedIn) {
    list.value = []
    loaded.value = true
    return
  }
  try {
    const data = await getFavorites({ page: 1, pageSize: 50 })
    list.value = data.list || []
  } catch (e) {
    console.error(e)
  } finally {
    loaded.value = true
  }
}

function goDetail(item) {
  if (!item.product) {
    uni.showToast({ title: '商品已下架', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/detail/detail?id=${item.productId}` })
}

async function remove(item) {
  try {
    await removeFavorite(item.productId)
    uni.showToast({ title: '已取消收藏', icon: 'none' })
    list.value = list.value.filter((f) => f.id !== item.id)
  } catch (e) {
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' })
  }
}

onShow(() => load())
onPullDownRefresh(async () => {
  await load()
  uni.stopPullDownRefresh()
})
</script>

<style>
.page {
  min-height: 100vh;
  background: #f6f7f9;
  padding-bottom: 40rpx;
}
.head {
  padding: 32rpx 24rpx 8rpx;
}
.title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2328;
}
.tip {
  padding: 120rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #9ca3af;
}
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
.remove {
  position: absolute;
  right: 12rpx;
  bottom: 12rpx;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 22rpx;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 28rpx;
}
.name {
  font-size: 30rpx;
  color: #1f2328;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.price {
  margin-top: 8rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #e5484d;
}
.price.off {
  color: #9ca3af;
  font-weight: 400;
}
</style>
