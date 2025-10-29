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
import { UnauthorisedAccessError } from '../models/AuthenticationService';

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

// Global guard: protect routes that require admin access.
router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.requiresAdmin) {
    const token = localStorage.getItem('auth_token');
    try {
      if (!token) throw new UnauthorisedAccessError('No session token');
      const user = auth.validateSession(token);
      const role = user && (user.getRole ? user.getRole() : (user.role || ''));
      if (role === 'Admin') return next();
      // not admin -> fallthrough to redirect
    } catch (err) {
      // log for debugging and redirect to home with unauthorised flag
      // eslint-disable-next-line no-console
      console.warn(new UnauthorisedAccessError('Unauthorised access attempt to admin route'));
    }
    return next({ path: '/', query: { unauthorised: 'true' } });
  }
  return next();
});

export default router;
