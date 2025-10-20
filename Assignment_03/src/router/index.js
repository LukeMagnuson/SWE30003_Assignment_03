import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import AboutPage from '../pages/AboutPage.vue';
import Test from '../pages/Test.vue';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import ShopView from '../components/ShopView.vue';

const routes = [
  { path: '/', component: HomePage },
  { path: '/about', component: AboutPage },
  { path: '/test', component: Test }, 
  { path: '/shop', component: ShopView }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
