<template>
  <!-- 根节点就是 <image>：父组件传的 class / style 会由 Vue 自动合并到这里，
       所以 .thumb / .pic / .g-pic / .gallery-img 这些原有样式全部照常生效。 -->
  <image
    :src="currentSrc"
    :mode="mode"
    :lazy-load="lazy"
    :webp="webp"
    @error="onError"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import { PLACEHOLDER } from '@/utils/image'

/**
 * D26 图片组件：懒加载 + 加载失败兜底。
 * - lazy-load / webp 是微信小程序 <image> 的属性，H5 / App 端会被忽略但不会报错
 * - 首屏 Banner 传 :lazy="false"，避免轮播第一张图延迟出现（LCP）
 * - src 传的是已经 resolveImg() 处理过的地址，组件不重复拼 origin
 */
const props = defineProps({
  src: { type: String, default: '' },
  mode: { type: String, default: 'aspectFill' },
  lazy: { type: Boolean, default: true },
  webp: { type: Boolean, default: false },
})

const currentSrc = ref(props.src || PLACEHOLDER)
watch(() => props.src, (v) => {
  currentSrc.value = v || PLACEHOLDER
})

function onError() {
  if (currentSrc.value !== PLACEHOLDER) currentSrc.value = PLACEHOLDER
}
</script>
