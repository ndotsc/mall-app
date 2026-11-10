import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

export function createApp() {
	const app = createSSRApp(App);
	app.use(createPinia());

	// D26 错误兜底：组件内部抛错以前只会白屏，这里统一记日志并给一个轻提示。
	// 页面级「加载失败 + 重试」由 <error-state> 组件负责，两者不重复弹窗。
	app.config.errorHandler = (err, _instance, info) => {
		console.error('[vue error]', info, err);
		uni.showToast({ title: '页面出了点问题', icon: 'none' });
	};

	return {
		app,
	};
}
