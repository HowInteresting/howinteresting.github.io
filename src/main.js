import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import "@/style/style.scss";
import Home from "@/pages/home.vue";
import Love from "@/pages/love.vue";
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
    { path: "/home", component: Home },
    { path: "/love", component: Love },
    { path: "/*", component: Home },
  ],
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
