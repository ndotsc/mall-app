<script>
import { useAuthStore } from '@/stores/auth'

export default {
  onLaunch: function () {
    // App 冷启动：若有本地 token 则刷新用户信息，失效则自动清登录态
    useAuthStore().bootstrap()
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },

  // ---------------- D26 全局异常兜底 ----------------
  // 小程序端的 JS 异常、未处理的 Promise 拒绝、找不到的页面，分别由这三个 App 生命周期接住。
  onError: function (err) {
    console.error('[app onError]', err)
    uni.showToast({ title: '页面异常，请重试', icon: 'none' })
  },
  onUnhandledRejection: function ({ reason }) {
    console.error('[unhandled rejection]', reason)
  },
  onPageNotFound: function () {
    // 不额外新增 404 页（会增加主包体积），直接回首页并提示
    uni.showToast({ title: '页面不存在，已回到首页', icon: 'none' })
    uni.switchTab({ url: '/pages/index/index' })
  },
}
</script>

<style>
/*每个页面公共css */
</style>
