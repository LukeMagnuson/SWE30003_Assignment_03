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

      <details class="orders" open>
        <summary>Orders</summary>
        <div v-if="ordersLoading" class="loading">Loading orders…</div>
        <div v-else>
          <div v-if="orders.length === 0" class="empty">No orders yet.</div>
          <ul class="order-list" v-else>
            <li v-for="o in orders" :key="o.id || o.orderId" class="order-item">
              <div class="row1">
                <div>
                  <b>#{{ o.orderId }}</b>
                  <span class="muted"> • {{ formatDate(o.createdAt) }}</span>
                </div>
                <div>
                  <span class="badge" :class="`st-${o.status.toLowerCase()}`">{{ o.status }}</span>
                  <span class="badge" :class="`pay-${(o.payment?.status||'').toLowerCase()}`">Payment: {{ o.payment?.status || 'N/A' }}</span>
                </div>
              </div>
              <div class="row2">
                <div class="lines">
                  <span v-for="l in o.items" :key="l.productId">{{ l.name }} × {{ l.quantity }}</span>
                </div>
                <div class="total">${{ (o.totalCents/100).toFixed(2) }}</div>
              </div>
              <div class="row3">
                <button v-if="o.status==='Pending' && o.payment && o.payment.status==='Initiated'" @click="completePayment(o)" :disabled="busyOrderId===o.orderId">Complete payment</button>
                <router-link :to="{ name: 'order', params: { orderId: o.orderId } }" class="secondary">View order</router-link>
              </div>
            </li>
          </ul>
        </div>
      </details>

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
import Order from '../models/Order';
import Payment from '../models/Payment';
import Invoice from '../models/Invoice';

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

// Orders state
const ordersLoading = ref(false);
const orders = ref([]);
const busyOrderId = ref('');

function formatDate(d) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleString();
}

async function loadOrders() {
  ordersLoading.value = true;
  try {
    const base = 'http://localhost:3000';
    const uid = domainUser.value?.userId;
    const email = (domainUser.value?.email || '').toLowerCase();
    if (!uid && !email) { orders.value = []; return; }
    // Fetch all orders and filter client-side (json-server doesn't support deep query by nested fields like customerContact.email reliably)
    const [oRes, pRes, iRes] = await Promise.all([
      fetch(`${base}/orders`),
      fetch(`${base}/payments`),
      fetch(`${base}/invoices`)
    ]);
    const allOrders = oRes.ok ? await oRes.json() : [];
    const ps = pRes.ok ? await pRes.json() : [];
    const is = iRes.ok ? await iRes.json() : [];
    const mine = allOrders.filter(o => {
      const cid = String(o.customerId || '').toLowerCase();
      const cem = String(o.customerContact?.email || '').toLowerCase();
      return cid === String(uid).toLowerCase() || (email && cem === email);
    });
    // join
    const byOrderPayments = new Map(ps.map(p => [p.orderId, p]));
    const byOrderInvoices = new Map(is.map(inv => [inv.orderId, inv]));
    orders.value = mine.map(o => ({ ...o, payment: byOrderPayments.get(o.orderId), invoice: byOrderInvoices.get(o.orderId) }));
  } finally {
    ordersLoading.value = false;
  }
}

function invoiceLink(inv) {
  // Provide a JSON view via dev server; json-server returns the JSON directly at /invoices/:id
  const base = 'http://localhost:3000';
  const id = inv.id ?? inv.invoiceId;
  return id != null ? `${base}/invoices/${id}` : `${base}/invoices?orderId=${encodeURIComponent(inv.orderId)}`;
}

async function completePayment(o) {
  if (!o || !o.payment) return;
  busyOrderId.value = o.orderId;
  try {
    const base = 'http://localhost:3000';
    // mark payment completed
    const payId = o.payment.id ?? o.payment.paymentId;
    const nowIso = new Date().toISOString();
    const pRes = await fetch(`${base}/payments/${encodeURIComponent(payId)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Completed', processedAt: nowIso })
    });
    if (!pRes.ok) throw new Error('Failed to update payment');
    // mark order paid
    const ordId = o.id ?? o.orderId;
    const oRes = await fetch(`${base}/orders/${encodeURIComponent(ordId)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Paid', paidAt: nowIso })
    });
    if (!oRes.ok) throw new Error('Failed to update order');
    await loadOrders();
  } catch (e) {
    // eslint-disable-next-line no-alert
    alert(e && e.message ? e.message : String(e));
  } finally {
    busyOrderId.value = '';
  }
}

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
    // After user loads, fetch orders
    if (domainUser.value) loadOrders();
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

.orders { margin-top: 1rem; }
.order-list { list-style: none; padding: 0; display: grid; gap: 0.6rem; }
.order-item { border: 1px solid #eee; border-radius: 8px; padding: 0.6rem; background: #fff; }
.row1, .row2, .row3 { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.row2 .lines { display: flex; gap: 0.5rem; flex-wrap: wrap; color: #374151; }
.row2 .total { font-weight: 700; }
.badge { display: inline-block; padding: 0.15rem 0.4rem; border-radius: 999px; font-size: 0.8rem; background: #eef2ff; color: #3730a3; margin-left: 0.25rem; }
.badge.pay-completed { background: #ecfdf5; color: #065f46; }
.badge.pay-initiated { background: #fff7ed; color: #9a3412; }
.badge.st-pending { background: #fff7ed; color: #9a3412; }
.badge.st-paid { background: #ecfdf5; color: #065f46; }
.muted { color: #6b7280; }
.empty { color: #6b7280; }
</style>
