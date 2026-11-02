<template>
  <view class="page">
    <view class="tabs">
      <view class="tab" :class="{ active: tab === 'unused' }" @tap="switchTab('unused')">未使用</view>
      <view class="tab" :class="{ active: tab === 'used' }" @tap="switchTab('used')">已使用</view>
      <view class="tab" :class="{ active: tab === 'expired' }" @tap="switchTab('expired')">已过期</view>
    </view>

    <view v-if="!loaded" class="tip">加载中...</view>
    <view v-else-if="!list.length" class="tip">{{ emptyText }}</view>

    <view v-else class="list">
      <view class="coupon" :class="tab" v-for="u in list" :key="u.id">
        <view class="left">
          <text class="label">{{ u.coupon.label }}</text>
          <text class="name">{{ u.coupon.name }}</text>
          <text class="date">有效期至 {{ fmt(u.coupon.validTo) }}</text>
        </view>
        <view class="right">
          <text class="status">{{ statusText(u.status) }}</text>
          <view v-if="u.status === 'unused'" class="use" @tap="goUse">去使用</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onShow } from 'vue'
import { getMyCoupons } from '@/api/coupon'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const tab = ref('unused')
const list = ref([])
const loaded = ref(false)

const emptyTextMap = {
  unused: '暂无未使用的优惠券',
  used: '暂无已使用的优惠券',
  expired: '暂无已过期的优惠券',
}
const emptyText = ref(emptyTextMap.unused)

function statusText(s) {
  return { unused: '未使用', used: '已使用', expired: '已过期' }[s] || s
}
function fmt(t) {
  if (!t) return ''
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
function goUse() {
  uni.switchTab({ url: '/pages/cart/cart' })
}

async function load() {
  if (!auth.isLoggedIn) {
    list.value = []
    loaded.value = true
    return
  }
  emptyText.value = emptyTextMap[tab.value]
  try {
    const data = await getMyCoupons({ status: tab.value })
    list.value = data.list || []
  } catch (e) {
    console.error(e)
  } finally {
    loaded.value = true
  }
}

function switchTab(t) {
  tab.value = t
  loaded.value = false
  load()
}

onShow(() => load())
</script>

<style>
.page { min-height: 100vh; background: #f6f7f9; }
.tabs { display: flex; background: #fff; position: sticky; top: 0; }
.tab { flex: 1; text-align: center; padding: 28rpx 0; font-size: 28rpx; color: #6b7280; }
.tab.active { color: #e5484d; font-weight: 700; border-bottom: 4rpx solid #e5484d; }
.tip { padding: 120rpx 0; text-align: center; font-size: 28rpx; color: #9ca3af; }
.list { padding: 16rpx 24rpx; }
.coupon {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border-radius: 20rpx; padding: 28rpx 24rpx; margin-bottom: 20rpx;
  border-left: 10rpx solid #e5484d;
}
.coupon.used, .coupon.expired { border-left-color: #cbd2d9; opacity: 0.7; }
.left { display: flex; flex-direction: column; gap: 8rpx; }
.label { font-size: 36rpx; font-weight: 700; color: #e5484d; }
.coupon.used .label, .coupon.expired .label { color: #9ca3af; }
.name { font-size: 28rpx; color: #1f2328; }
.date { font-size: 22rpx; color: #9ca3af; }
.right { display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.status { font-size: 26rpx; color: #6b7280; }
.use { padding: 12rpx 28rpx; border-radius: 999rpx; background: #e5484d; color: #fff; font-size: 24rpx; }
</style>
