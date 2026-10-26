// 接口基址：优先读 .env 的 VITE_API_BASE（见 .env.example），未配置则走本地后端。
// 小程序真机预览必须换成 https 域名，并在小程序后台配置 request 合法域名。
const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'

export function request(options) {
    return new Promise((resolve, reject) => {
        uni.request({
            url: BASE_URL + options.url,
            method: options.method || 'GET',
            data: options.data || {},
            timeout: 10000,
            success: (res) => {
                if (res.data.code === 0) {
                    resolve(res.data.data)
                } else {
                    uni.showToast({ title: res.data.message || '请求失败', icon: 'none' })
                    reject(res.data)
                }
            },
            fail: (err) => {
                uni.showToast({ title: '网络错误', icon: 'none' })
                reject(err)
            }
        })
    })
}