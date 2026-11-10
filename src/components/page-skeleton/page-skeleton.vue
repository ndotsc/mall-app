<template>
  <!-- D26 骨架屏：加载时先撑住位置，内容回来不会整块跳一下 -->
  <view class="skeleton" :class="'skeleton--' + type">
    <view v-for="n in rows" :key="n" class="sk-card">
      <view class="sk-media shimmer"></view>
      <view class="sk-lines">
        <view class="sk-line shimmer w80"></view>
        <view class="sk-line shimmer w50"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * type: list（纵向列表，默认）/ grid（两列商品网格）
 * rows: 占位条数
 * 单位用 rpx，多端自适应；动画是纯 CSS，小程序端支持。
 */
defineProps({
  type: { type: String, default: 'list' },
  rows: { type: Number, default: 4 },
})
</script>

<style scoped>
.skeleton {
  padding: 16rpx 24rpx;
}
.shimmer {
  background: linear-gradient(90deg, #eef0f3 25%, #f8f9fb 50%, #eef0f3 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.3s ease-in-out infinite;
}
@keyframes sk-shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}

.skeleton--list .sk-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 20rpx;
  background: #fff;
  border-radius: 16rpx;
}
.skeleton--list .sk-media {
  width: 120rpx;
  height: 120rpx;
  flex: none;
  border-radius: 12rpx;
  margin-right: 24rpx;
}
.skeleton--list .sk-lines {
  flex: 1;
}

.skeleton--grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.skeleton--grid .sk-card {
  width: 48%;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}
.skeleton--grid .sk-media {
  width: 100%;
  height: 330rpx;
}
.skeleton--grid .sk-lines {
  padding: 16rpx;
}

.sk-lines {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.sk-line {
  height: 20rpx;
  border-radius: 10rpx;
}
.w80 { width: 80%; }
.w50 { width: 50%; }
</style>
