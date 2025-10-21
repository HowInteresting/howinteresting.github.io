<template>
  <div class="fullscreen-iframe-container" ref="container">
    <iframe :src="ueditorValue" class="fullscreen-iframe" @load="loadedUrl"></iframe>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps({
  value: {
    type: String,
    default: "",
  },
});

const emits = defineEmits<{
  (evt: "update:value", v: string): void;
}>();

const ueditorValue = computed({
  get: () => props.value,
  set: (v) => emits("update:value", trimContent(v)),
});

const container = ref(null);
function adjustIframeSize() {
  const containerRef = container.value;
  const iframe = containerRef.querySelector("iframe");
  if (iframe) {
    iframe.style.height = `${containerRef.offsetHeight}px`;
    iframe.style.width = `${containerRef.offsetWidth}px`;
  }
}

function loadedUrl() {
  const containerRef = container.value;
  const iframe = containerRef.querySelector("iframe");
  // 假设同域
  const innerWidth = iframe.contentWindow.document.body.scrollWidth;
  console.log(1, innerWidth);
}

onMounted(() => {
  window.addEventListener("resize", adjustIframeSize);
});

onUnmounted(() => window.removeEventListener("resize", adjustIframeSize));
</script>

<style lang="scss" scoped>
.fullscreen-iframe-container {
  position: relative;
  width: 100%; /* 容器宽度 */
  height: 100%; /* 容器高度 */
  overflow: hidden; /* 隐藏溢出的内容 */
}
.fullscreen-iframe {
  position: absolute; /* 绝对定位 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  border: none; /* 无边框 */
  width: 100%; /* iframe宽度 */
  height: 100%; /* iframe高度 */
}
</style>
