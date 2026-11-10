<template>
  <!-- D26：把「接口失败」和「真的没有数据」分开，失败时给明确提示 + 重试入口 -->
  <view class="err">
    <view class="err-icon"><text class="err-mark">!</text></view>
    <text class="err-title">{{ title }}</text>
    <text class="err-desc">{{ description }}</text>
    <view v-if="showRetry" class="retry" @tap="$emit('retry')">
      <text>{{ retryText }}</text>
    </view>
    <slot />
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, default: '加载失败' },
  description: { type: String, default: '网络好像开小差了，稍后再试一次吧。' },
  retryText: { type: String, default: '重新加载' },
  showRetry: { type: Boolean, default: true },
})
defineEmits(['retry'])
</script>

<style scoped>
.err {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 40rpx;
  margin: 24rpx;
  background: #fff;
  border-radius: 20rpx;
}
.err-icon {
  width: 88rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: 50%;
  background: #fdecec;
  margin-bottom: 24rpx;
}
.err-mark {
  color: #e5484d;
  font-size: 44rpx;
  font-weight: 700;
}
.err-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2328;
  margin-bottom: 8rpx;
}
.err-desc {
  font-size: 26rpx;
  color: #9ca3af;
  text-align: center;
  margin-bottom: 32rpx;
}
.retry {
  padding: 16rpx 48rpx;
  border-radius: 999rpx;
  background: #2563eb;
  color: #fff;
  font-size: 28rpx;
}
</style>
