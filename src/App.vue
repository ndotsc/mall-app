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
}
</script>

<style>
/*每个页面公共css */
</style>
