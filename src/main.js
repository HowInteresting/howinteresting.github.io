import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import "@/style/style.scss";
import Home from "@/pages/home.vue";
import Mulu from "@/pages/mulu.vue";
import Love from "@/pages/love.vue";
import LoveStory from "@/pages/lovestory.vue";
import Birth from "@/pages/birthday.vue";
import BirthPPT from "@/pages/birthdayppt.vue";
import BirthCake from "@/pages/birthdaycake.vue";
import Firework from "@/pages/firework.vue";
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
    { path: "/mulu", component: Mulu },
    // ❤️
    { path: "/love", name: "♥", component: Love },
    { path: "/lovewy", name: "♥wy", component: Love },
    { path: "/mylove", name: "我的爱", component: Love },
    { path: "/iloveu", name: "i♥u", component: Love },
    { path: "/wy", name: "wy", component: Love },
    { path: "/lxr", name: "我", component: Love },
    { path: "/qingshu", name: "情书", component: Love },
    { path: "/letter", name: "情书", component: Love },
    // 将匹配所有内容并将其放在 `route.params.pathMatch` 下
    { path: "/lovestory", name: "爱情故事", component: LoveStory },
    { path: "/404", name: "密码对了才能进", component: LoveStory },
    { path: "/:pathMatch(.*)*", redirect: "/404" },
    // 生日快乐
    { path: "/birthday", name: "生日快乐", component: Birth },
    { path: "/srkl", name: "生日快乐呀", component: BirthPPT },
    { path: "/cake", name: "生日蛋糕", component: BirthCake },
    { path: "/dangao", name: "生日蛋糕", component: BirthCake },
    // 浪漫烟花
    { path: "/firework", name: "浪漫烟花", component: Firework },
    { path: "/yanhua", name: "带你看烟花", component: Firework },
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
