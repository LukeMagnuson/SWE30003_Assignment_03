<template>
  <section class="profile">
    <h1>Profile</h1>

    <div v-if="!loaded" class="loading">Loading…</div>

    <div v-else-if="!user" class="not-logged">
      <p>You are not logged in.</p>
      <router-link to="/login">Go to Login</router-link>
    </div>

    <div v-else class="details">
      <h2>{{ user.name }} <small>({{ role }})</small></h2>
      <ul class="kv">
        <li><span>User ID</span><span>{{ user.userId }}</span></li>
        <li><span>Name</span><span>{{ user.name }}</span></li>
        <li><span>Email</span><span>{{ user.email }}</span></li>
        <li v-if="user.phone"><span>Phone</span><span>{{ user.phone }}</span></li>
        <li><span>Role</span><span>{{ role }}</span></li>
        <li><span>Created</span><span>{{ createdAtFormatted }}</span></li>
        <li v-if="isCustomer && customer.deliveryAddress"><span>Delivery Address</span><span>{{ customer.deliveryAddress }}</span></li>
        <li v-if="isCustomer && customer.cartId"><span>Cart ID</span><span>{{ customer.cartId }}</span></li>
        <li v-if="isCustomer"><span>Order History Count</span><span>{{ orderHistoryCount }}</span></li>
        <li v-if="isAdmin && admin.lastAction"><span>Last Admin Action</span><span>{{ admin.lastAction }}</span></li>
        <li v-if="isAdmin && permissions && permissions.length">
          <span>Permissions</span>
          <span>
            <code class="perms">{{ permissions.join(', ') }}</code>
          </span>
        </li>
      </ul>

      <details class="raw">
        <summary>Show raw JSON</summary>
        <pre>{{ json }}</pre>
      </details>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import auth from '../models/AuthenticationService';
import { Customer } from '../models/Customer';
import { Admin } from '../models/Admin';

const router = useRouter();
const STORAGE_KEY = 'auth_token';

const loaded = ref(false);
const jsUser = ref(null); // plain JS snapshot
const domainUser = ref(null); // actual class instance

const user = computed(() => jsUser.value);
const role = computed(() => (domainUser.value && domainUser.value.getRole ? domainUser.value.getRole() : ''));
const isCustomer = computed(() => domainUser.value instanceof Customer);
const isAdmin = computed(() => domainUser.value instanceof Admin);
const admin = computed(() => (isAdmin.value ? domainUser.value : null));
const customer = computed(() => (isCustomer.value ? domainUser.value : null));

const createdAtFormatted = computed(() => {
  if (!domainUser.value) return '';
  const d = domainUser.value.createdAt instanceof Date ? domainUser.value.createdAt : new Date(domainUser.value.createdAt);
  return isNaN(d.getTime()) ? '' : d.toLocaleString();
});

const permissions = computed(() => {
  // Admin has no public getter for permissions; use toJSON as a safe snapshot
  if (!domainUser.value || !(domainUser.value instanceof Admin)) return [];
  try {
    const json = domainUser.value.toJSON ? domainUser.value.toJSON() : {};
    return Array.isArray(json.permissions) ? json.permissions : [];
  } catch { return []; }
});

const orderHistoryCount = computed(() => {
  if (!(domainUser.value instanceof Customer)) return 0;
  try { return domainUser.value.getOrderHistory().length; } catch { return 0; }
});

const json = computed(() => {
  try {
    const snap = domainUser.value && domainUser.value.toJSON ? domainUser.value.toJSON() : (jsUser.value || {});
    return JSON.stringify(snap, null, 2);
  } catch { return '{}'; }
});

onMounted(() => {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    loaded.value = true;
    return;
  }
  try {
    const u = auth.validateSession(token);
    domainUser.value = u;
    // build a plain snapshot for easy printing
    const base = u && u.toJSON ? u.toJSON() : {
      userId: u.userId,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.getRole ? u.getRole() : ''
    };
    jsUser.value = base;
  } catch (e) {
    // token invalid -> route to login
    router.replace({ path: '/login', query: { unauthorised: 'true' } }).catch(() => {});
  } finally {
    loaded.value = true;
  }
});
</script>

<style scoped>
.profile { max-width: 800px; margin: 0 auto; padding: 1rem; }
.loading { color: #555; }
.kv { list-style: none; padding: 0; margin: 0; }
.kv li { display: grid; grid-template-columns: 200px 1fr; gap: 12px; padding: 8px 0; border-bottom: 1px solid #eee; }
.kv li span:first-child { color: #666; }
.raw { margin-top: 1rem; }
.perms { background: #f8fafc; padding: 2px 4px; border: 1px solid #e5e7eb; border-radius: 4px; }
</style>
