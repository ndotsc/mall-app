<template>
  <view class="mine">
    <view class="header">
      <image v-if="auth.user && auth.user.avatar" :src="resolveImg(auth.user.avatar)" class="avatar" />
      <view v-else class="avatar placeholder">👤</view>
      <view class="name">{{ auth.isLoggedIn ? auth.nickname : '未登录' }}</view>
      <button v-if="!auth.isLoggedIn" class="login-btn" size="mini" @tap="goLogin">登录 / 注册</button>
    </view>

    <view class="menu">
      <view class="item" @tap="go('/pages/order/order')">
        <text>我的订单</text>
        <text class="arrow">›</text>
      </view>
      <view class="item" @tap="go('/pages/address/address')">
        <text>收货地址</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <button v-if="auth.isLoggedIn" class="logout" @tap="onLogout">退出登录</button>
  </view>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { resolveImg } from '@/utils/image'
import { onShow } from '@dcloudio/uni-app'

const auth = useAuthStore()

// 每次进入「我的」刷新一下用户信息（昵称/头像可能被改）
onShow(() => {
  if (auth.isLoggedIn) auth.fetchMe().catch(() => {})
})

function go(url) {
  if (!auth.isLoggedIn) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }
  uni.navigateTo({ url })
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/login' })
}

async function onLogout() {
  uni.showModal({
    title: '提示',
    content: '确定退出登录？',
    success: async (r) => {
      if (r.confirm) {
        await auth.logout()
        uni.reLaunch({ url: '/pages/index/index' })
      }
    },
  })
}
</script>

<style>
.mine {
  min-height: 100vh;
  background: #f6f7f9;
}
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0 56rpx;
  background: #fff;
}
.avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background: #eef2ff;
}
.avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64rpx;
}
.name {
  margin-top: 20rpx;
  font-size: 34rpx;
  font-weight: 600;
  color: #1f2328;
}
.login-btn {
  margin-top: 24rpx;
  background: #2563eb;
  color: #fff;
  font-size: 26rpx;
}
.menu {
  margin-top: 24rpx;
  background: #fff;
}
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 28rpx;
  font-size: 30rpx;
  color: #1f2328;
  border-bottom: 2rpx solid #f1f2f4;
}
.arrow {
  color: #c4c8ce;
  font-size: 36rpx;
}
.logout {
  margin: 48rpx 28rpx 0;
  background: #fff;
  color: #e5484d;
  border-radius: 16rpx;
  font-size: 30rpx;
}
</style>
