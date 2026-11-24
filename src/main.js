import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import "@/style/style.scss";
import Home from "@/pages/home.vue";
import Firework from "@/pages/firework.vue";
import Poem from "@/pages/poem.vue";
import Ai from "@/pages/ai.vue";
import NotFound from "@/pages/notFound.vue";
import App from "@/App.vue";
// 引入 pinia
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
// swiper
import "swiper/css";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/firework", name: "浪漫烟花", component: Firework },
    { path: "/yanhua", name: "带你看烟花", component: Firework },
    { path: "/poem", name: "黑板诗笺", component: Poem },
    { path: "/ai", name: "AI 助手", component: Ai },
    { path: "/:pathMatch(.*)*", name: "页面走丢了", component: NotFound },
  ],
});

router.beforeEach((to, from, next) => {
  document.title = to.name ? to.name : import.meta.env.VITE_SITE_NAME; // 根据路由名称动态设置标题
  next();
});

app.use(pinia);
app.use(router);
app.mount("#app");

// PWA
navigator.serviceWorker.addEventListener("controllerchange", () => {
  // 弹出更新提醒
  console.log("站点已更新，刷新后生效");
  ElMessage("站点已更新，刷新后生效");
});
