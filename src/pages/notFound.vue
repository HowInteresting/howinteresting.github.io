<template>
  <main class="not-found">
    <p class="code">404</p>
    <h1>这页纸好像被风吹走了</h1>
    <p class="desc">
      找不到
      <code>{{ path }}</code>
      ，去下面这些页面逛逛吧
    </p>
    <nav class="links">
      <router-link to="/">首页</router-link>
      <router-link to="/firework">浪漫烟花</router-link>
      <router-link to="/poem">黑板诗笺</router-link>
      <router-link to="/ai">AI 助手</router-link>
    </nav>
  </main>
</template>

<script setup>
import { useRoute } from "vue-router";

const route = useRoute();
const path = computed(() => route.fullPath || "/");
</script>

<style lang="scss" scoped>
.not-found {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: #101014;
  background-image: radial-gradient(
    60vw 60vw at 50% -10%,
    rgba(255, 255, 255, 0.08),
    transparent 70%
  );
  color: #e8e8ea;
  font-family:
    -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei",
    sans-serif;
  text-align: center;
  -webkit-font-smoothing: antialiased;

  .code {
    margin: 0;
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: clamp(72px, 18vw, 112px);
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.04em;
    background: linear-gradient(180deg, #ffffff, #7d7d8a);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }

  h1 {
    margin: 18px 0 0;
    font-size: 20px;
    font-weight: 500;
  }

  .desc {
    max-width: 460px;
    margin: 10px 0 0;
    font-size: 14px;
    line-height: 1.7;
    color: #8f8f9c;
    word-break: break-all;

    code {
      font-family: "SF Mono", Menlo, Consolas, monospace;
      color: #c9c9d4;
    }
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 32px;

    a {
      padding: 10px 20px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 999px;
      color: #e8e8ea;
      font-size: 14px;
      text-decoration: none;
      transition:
        background 0.2s,
        border-color 0.2s,
        transform 0.2s;

      &:hover {
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
      }
    }
  }
}
</style>
