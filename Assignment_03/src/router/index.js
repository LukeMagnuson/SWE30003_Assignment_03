import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import AboutPage from '../pages/AboutPage.vue';
import Test from '../pages/Test.vue';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import ShopView from '../components/ShopView.vue';
import LoginAdmin from '../components/LoginAdmin.vue';
import AdminDashboard from '../components/AdminDashboard.vue';
import auth from '../models/AuthenticationService';

const routes = [
  { path: '/', component: HomePage },
  { path: '/about', component: AboutPage },
  { path: '/test', component: Test },
  { path: '/shop', component: ShopView },
  { path: '/login', component: LoginAdmin },
  // mark admin route with a meta flag
  { path: '/admin', component: AdminDashboard, meta: { requiresAdmin: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
