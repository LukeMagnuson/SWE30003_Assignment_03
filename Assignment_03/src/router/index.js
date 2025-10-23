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
  {
    path: '/admin',
    component: AdminDashboard,
    beforeEnter: (to, from, next) => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');
        const user = auth.validateSession(token);
        if (user && user.getRole && user.getRole() === 'Admin') {
          next();
        } else {
          next('/login');
        }
      } catch (err) {
        next('/login');
      }
    }
  }
];

export default router;
