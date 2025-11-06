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

      <details class="profile-edit" open>
        <summary>Update contact details</summary>
        <form class="form-grid" @submit.prevent="updateContact">
          <label>
            Phone
            <input type="tel" v-model="contactPhone" placeholder="e.g. 0412345678" />
          </label>
          <label v-if="isCustomer">
            Delivery address
            <input type="text" v-model="contactAddress" placeholder="e.g. 123 Main St" />
          </label>
          <div class="actions">
            <button type="submit" :disabled="savingContact">{{ savingContact ? 'Saving…' : 'Save changes' }}</button>
            <span class="msg ok" v-if="contactMsg">{{ contactMsg }}</span>
            <span class="msg err" v-if="contactErr">{{ contactErr }}</span>
          </div>
        </form>
      </details>

      <details class="password-edit">
        <summary>Change password</summary>
        <form class="form-grid" @submit.prevent="changePasswordSubmit">
          <label>
            Current password
            <input type="password" v-model="pwCurrent" autocomplete="current-password" required />
          </label>
          <label>
            New password
            <input type="password" v-model="pwNew" autocomplete="new-password" minlength="6" required />
          </label>
          <label>
            Confirm new password
            <input type="password" v-model="pwConfirm" autocomplete="new-password" minlength="6" required />
          </label>
          <div class="actions">
            <button type="submit" :disabled="changingPw">{{ changingPw ? 'Updating…' : 'Update password' }}</button>
            <span class="msg ok" v-if="pwMsg">{{ pwMsg }}</span>
            <span class="msg err" v-if="pwErr">{{ pwErr }}</span>
          </div>
        </form>
      </details>

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
import { ref, computed, onMounted, watch } from 'vue';
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
    initContactFields();
  } catch (e) {
    // token invalid -> route to login
    router.replace({ path: '/login', query: { unauthorised: 'true' } }).catch(() => {});
  } finally {
    loaded.value = true;
    // After user loads, fetch orders
    if (domainUser.value) loadOrders();
  }
});

// ---------- Profile editing state ----------
const contactPhone = ref('');
const contactAddress = ref('');
const savingContact = ref(false);
const contactMsg = ref('');
const contactErr = ref('');

function initContactFields() {
  const u = domainUser.value;
  if (!u) return;
  contactPhone.value = u.phone || '';
  if (u instanceof Customer) contactAddress.value = u.deliveryAddress || '';
}

watch(domainUser, () => initContactFields());

async function updateContact() {
  if (!domainUser.value) return;
  contactMsg.value = '';
  contactErr.value = '';
  savingContact.value = true;
  const base = 'http://localhost:3000';
  const uid = domainUser.value.userId;
  const isCust = domainUser.value instanceof Customer;
  const endpoint = `${base}/${isCust ? 'customers' : 'admins'}/${encodeURIComponent(uid)}`;
  const payload = isCust
    ? { phone: contactPhone.value || undefined, deliveryAddress: contactAddress.value || undefined }
    : { phone: contactPhone.value || undefined };
  try {
    const res = await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`Failed to update ${isCust ? 'customer' : 'admin'} profile`);
    // Update in-memory auth state and local UI snapshot
    try { auth.updateUserProfile(uid, payload); } catch { /* ignore */ }
    // reflect in displayed objects
    domainUser.value.phone = payload.phone;
    if (isCust) domainUser.value.deliveryAddress = payload.deliveryAddress;
    jsUser.value = domainUser.value.toJSON ? domainUser.value.toJSON() : { ...jsUser.value, ...payload };
    contactMsg.value = 'Saved';
  } catch (e) {
    contactErr.value = e?.message || 'Update failed';
  } finally {
    savingContact.value = false;
  }
}

// ---------- Password change state ----------
const pwCurrent = ref('');
const pwNew = ref('');
const pwConfirm = ref('');
const changingPw = ref(false);
const pwMsg = ref('');
const pwErr = ref('');

async function changePasswordSubmit() {
  if (!domainUser.value) return;
  pwMsg.value = '';
  pwErr.value = '';
  if (pwNew.value.length < 6) { pwErr.value = 'New password must be at least 6 characters'; return; }
  if (pwNew.value !== pwConfirm.value) { pwErr.value = 'New passwords do not match'; return; }
  changingPw.value = true;
  const uid = domainUser.value.userId;
  const base = 'http://localhost:3000';
  const isCust = domainUser.value instanceof Customer;
  const endpoint = `${base}/${isCust ? 'customers' : 'admins'}/${encodeURIComponent(uid)}`;
  try {
    // Update in-memory (validates current password)
    auth.changePassword(uid, pwCurrent.value, pwNew.value);
    // Persist to db.json
    const res = await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pwNew.value }) });
    if (!res.ok) throw new Error('Failed to update password in database');
    pwMsg.value = 'Password updated';
    pwCurrent.value = '';
    pwNew.value = '';
    pwConfirm.value = '';
  } catch (e) {
    // Best-effort rollback of in-memory change if DB write failed
    if (/Failed to update password/.test(String(e?.message || ''))) {
      try { auth.changePassword(uid, pwNew.value, pwCurrent.value); } catch { /* ignore */ }
    }
    pwErr.value = e?.message || 'Password update failed';
  } finally {
    changingPw.value = false;
  }
}
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

/* Profile edit forms */
.profile-edit, .password-edit { margin-top: 1rem; }
.form-grid { display: grid; gap: 0.5rem; max-width: 520px; }
.form-grid label { display: grid; gap: 0.25rem; }
.form-grid input { padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 6px; }
.actions { display: flex; align-items: center; gap: 0.5rem; }
.msg.ok { color: #065f46; }
.msg.err { color: #991b1b; }
</style>
