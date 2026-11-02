<template>
  <view class="page">
    <view class="head">
      <text class="title">领券中心</text>
      <text class="sub">领券下单更划算</text>
    </view>

    <view v-if="!loaded" class="tip">加载中...</view>
    <view v-else-if="!list.length" class="tip">暂无可领取的优惠券</view>

    <view v-else class="list">
      <view class="coupon" v-for="c in list" :key="c.id">
        <view class="left">
          <text class="label">{{ c.label }}</text>
          <text class="name">{{ c.name }}</text>
          <text class="date">有效期至 {{ fmt(c.validTo) }}</text>
        </view>
        <view class="right">
          <view v-if="c.claimed" class="btn done">已领取</view>
          <view v-else-if="c.remaining === 0" class="btn gone">已抢光</view>
          <view v-else class="btn" @tap="claim(c)">立即领取</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onShow } from 'vue'
import { getCoupons, claimCoupon } from '@/api/coupon'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const list = ref([])
const loaded = ref(false)

function fmt(t) {
  if (!t) return ''
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

async function load() {
  if (!auth.isLoggedIn) {
    list.value = []
    loaded.value = true
    return
  }
  try {
    const data = await getCoupons()
    list.value = data.list || []
  } catch (e) {
    console.error(e)
  } finally {
    loaded.value = true
  }
}

async function claim(c) {
  try {
    await claimCoupon(c.id)
    uni.showToast({ title: '领取成功', icon: 'none' })
    c.claimed = true
    if (c.remaining > 0) c.remaining -= 1
  } catch (e) {
    uni.showToast({ title: e?.message || '领取失败', icon: 'none' })
  }
}

onShow(() => load())
</script>

<style>
.page { min-height: 100vh; background: #f6f7f9; }
.head { padding: 32rpx 24rpx 8rpx; }
.title { font-size: 40rpx; font-weight: 700; color: #1f2328; display: block; }
.sub { font-size: 26rpx; color: #9ca3af; margin-top: 6rpx; display: block; }
.tip { padding: 120rpx 0; text-align: center; font-size: 28rpx; color: #9ca3af; }
.list { padding: 16rpx 24rpx; }
.coupon {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border-radius: 20rpx; padding: 28rpx 24rpx;
  margin-bottom: 20rpx; border-left: 10rpx solid #e5484d;
}
.left { display: flex; flex-direction: column; gap: 8rpx; }
.label { font-size: 36rpx; font-weight: 700; color: #e5484d; }
.name { font-size: 28rpx; color: #1f2328; }
.date { font-size: 22rpx; color: #9ca3af; }
.right { flex-shrink: 0; }
.btn {
  padding: 16rpx 32rpx; border-radius: 999rpx; background: #e5484d; color: #fff; font-size: 26rpx;
}
.btn.done { background: #e6e8eb; color: #9ca3af; }
.btn.gone { background: #e6e8eb; color: #9ca3af; }
</style>
