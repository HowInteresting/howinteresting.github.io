import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import "@/style/style.scss";
import Home from "@/pages/home.vue";
import Love from "@/pages/love.vue";
import Birth from "@/pages/birthday.vue";
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
    { path: "/love", name: "一封情书", component: Love },
    { path: "/birthday", name: "生日快乐", component: Birth },
    // 将匹配所有内容并将其放在 `route.params.pathMatch` 下
    { path: "/:pathMatch(.*)*", component: Love },
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
