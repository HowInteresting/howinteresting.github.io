<template>
  <div class="fullscreen-iframe-container" ref="container">
    <iframe :src="ueditorValue" class="fullscreen-iframe" @load="loadedUrl"></iframe>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  value: {
    type: String,
    default: "",
  },
  // isScale
  isScale: {
    type: Boolean,
    default: false,
  },
  // 内部固定宽度，默认为题目要求的 1100
  internalWidth: {
    type: Number,
    default: 1100,
  },
  // 可选：内部固定高度（如果不可访问 iframe 内容时的回退值）
  internalHeight: {
    type: Number,
    default: 800,
  },
});

const emits = defineEmits(["update:value"]);

const ueditorValue = computed({
  get: () => props.value,
  set: (v) => emits("update:value", v),
});

const container = ref(null);

function adjustIframeScale() {
  if (!props.isScale) return;
  const containerRef = container.value;
  if (!containerRef) return;
  const iframe = containerRef.querySelector("iframe");
  if (!iframe) return;

  const internalWidth = props.internalWidth || 1100;
  const containerWidth = containerRef.clientWidth || containerRef.offsetWidth;
  const internalHeightFallback = props.internalHeight || 800;
  const containerHeight = containerRef.clientHeight || containerRef.offsetHeight;

  // scale based on width to keep internal width fixed to internalWidth
  const scale = containerWidth / internalWidth;

  // Make iframe base size equal to internalWidth and determine base height so
  // the scaled iframe fills the container vertically (no black gap at bottom).
  iframe.style.width = `${internalWidth}px`;
  iframe.style.transformOrigin = "0 0";
  iframe.style.transform = `scale(${scale})`;
  iframe.style.border = "none";

  // If we can read iframe content (same-origin), use its content height. We
  // will ensure the scaled iframe fills the container by setting the base
  // iframe height to at least containerHeight / scale. This avoids black gaps.
  try {
    const doc = iframe.contentWindow && iframe.contentWindow.document;
    if (doc) {
      const contentHeight = Math.max(
        doc.documentElement.scrollHeight,
        doc.body ? doc.body.scrollHeight : 0,
      );
      const neededBaseHeight = Math.max(contentHeight, containerHeight / scale);
      iframe.style.height = `${Math.ceil(neededBaseHeight)}px`;
      // set container height to the displayed (scaled) height so outer layout
      // doesn't leave extra space
      containerRef.style.height = `${Math.ceil(neededBaseHeight * scale)}px`;
      return;
    }
  } catch (e) {
    // cross-origin - cannot access content
  }

  // Cross-origin fallback: set base iframe height so after scaling it fills
  // the container height (no black gap). Use internalHeightFallback if needed.
  const baseHeight = Math.max(internalHeightFallback, containerHeight / scale);
  iframe.style.height = `${Math.ceil(baseHeight)}px`;
  containerRef.style.height = `${Math.ceil(baseHeight * scale)}px`;

  // Make iframe base size equal to internalWidth and scale it.
  iframe.style.width = `${internalWidth}px`;
  iframe.style.transformOrigin = "0 0";
  iframe.style.transform = `scale(${scale})`;
  iframe.style.border = "none";
}

function loadedUrl() {
  // Called when iframe finishes loading
  adjustIframeScale();
}

onMounted(() => {
  window.addEventListener("resize", adjustIframeScale);
  // run once after mount to pick up initial sizes
  setTimeout(adjustIframeScale, 50);
});

onUnmounted(() => window.removeEventListener("resize", adjustIframeScale));
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
