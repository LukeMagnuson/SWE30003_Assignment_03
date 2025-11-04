<template>
  <div class="admin-dashboard">
    <h1>Admin Dashboard</h1>
    <p v-if="message" class="message">{{ message }}</p>

    <details class="product-management">
      <summary>Product Management</summary>

      <div class="management-contents">
        <AddProductForm ref="addForm" @add="onAddProduct" />

          <section class="list">
            <h2>Products</h2>

            <!-- Search (same UX as ShopView) -->
            <input v-model="searchTerm" placeholder="Search products..." class="search" />

            <ul class="product-list">
              <li
                v-for="p in filteredProducts"
                :key="p.productId"
                class="product-item clickable"
                @click="openDetails(p)"
                role="button"
                tabindex="0"
                @keydown.enter="openDetails(p)"
                @keydown.space.prevent="openDetails(p)"
              >
                <img :src="computeImageSrc(p)" :alt="p.name || ''" @error="onImgError($event)" />
              <div class="meta">
                  <div class="name">{{ p.name }} <small>({{ p.productId }})</small></div>
                  <div class="desc truncate-1">{{ p.description }}</div>
                  <div class="info">Stock: {{ p.quantityAvailable }} — ${{ (p.priceCents/100).toFixed(2) }}</div>
                <div class="actions">
                  <button @click.stop="removeProduct(p)">Remove</button>
                </div>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </details>

    <details class="user-management">
      <summary>User Management</summary>

      <div class="management-contents">
        <div class="toolbar">
          <input v-model="userSearchTerm" placeholder="Search users..." class="search" />
          <button @click="loadUsers">Refresh</button>
        </div>
        <p v-if="userMessage" class="message">{{ userMessage }}</p>

        <ul class="user-list">
          <li v-for="u in filteredUsers" :key="u.id" class="user-item">
            <div class="meta">
              <div class="name">{{ u.name }} <small>({{ u.role }})</small></div>
              <div class="desc">{{ u.email }} <span v-if="u.phone">• {{ u.phone }}</span></div>
              <div class="info">ID: <code>{{ u.id }}</code> • Created: {{ formatDate(u.createdAt || u.creationDate) }}</div>
              <div class="actions">
                <button class="danger" @click="removeUser(u)">Delete</button>
              </div>
            </div>
          </li>
        </ul>

        <div v-if="filteredUsers.length === 0" class="empty">No users found.</div>
      </div>
    </details>

    <details class="order-management">
      <summary>Order Management</summary>

      <div class="management-contents">
        <div class="toolbar">
          <button @click="loadOrders">Refresh</button>
        </div>
        <p v-if="ordersMessage" class="message">{{ ordersMessage }}</p>
        <ul class="order-list">
          <li v-for="o in orders" :key="o.id || o.orderId" class="order-item">
            <div class="row1">
              <div>
                <router-link :to="{ name: 'order', params: { orderId: o.orderId } }"><b>#{{ o.orderId }}</b></router-link>
                <span class="muted"> • {{ formatDate(o.createdAt) }}</span>
              </div>
              <div>
                <span class="badge" :class="`st-${o.status.toLowerCase()}`">{{ o.status }}</span>
                <span class="badge" :class="`pay-${(o.payment?.status||'').toLowerCase()}`">Payment: {{ o.payment?.status || 'N/A' }}</span>
              </div>
            </div>
            <div class="row2">
              <div class="cust">{{ o.customerContact?.name || o.customerId }}</div>
              <div class="total">${{ (o.totalCents/100).toFixed(2) }}</div>
            </div>
            <div class="row3">
              <button class="danger" @click="cancelOrder(o)" :disabled="busyOrderId===o.orderId">Cancel order</button>
            </div>
          </li>
        </ul>
        <div v-if="orders.length===0" class="empty">No orders found.</div>
      </div>
    </details>
    <!-- Product details overlay -->
    <ProductDetailsModal v-model="showDetails" :product="selectedProduct" @close="closeDetails" />
  </div>
</template>

<script>
import ProductCatalogue from '../models/ProductCatalogue';
import AddProductForm from './AddProductForm.vue';
import ProductDetailsModal from './ProductDetailsModal.vue';

export default {
  name: 'AdminDashboard',
  components: { AddProductForm, ProductDetailsModal },
  data() {
    return {
      catalogue: null,
      products: [],
      searchTerm: '',
      message: '',
      // users management state
      users: [],
      userSearchTerm: '',
      userMessage: '',
      // form state moved to AddProductForm component
      placeholder: '/images/Supa_Team_4.jpg',
      // modal state
  showDetails: false,
  selectedProduct: null,
      // orders state
      orders: [],
      ordersMessage: '',
      busyOrderId: ''
    };
  },
  computed: {
    filteredProducts() {
      if (!this.catalogue) return [];
      // ProductCatalogue.searchProducts returns Product instances
      return this.catalogue.searchProducts(this.searchTerm);
    },
    filteredUsers() {
      const k = (this.userSearchTerm || '').toLowerCase().trim();
      if (!k) return this.users;
      return this.users.filter(u => {
        return (
          String(u.name || '').toLowerCase().includes(k) ||
          String(u.email || '').toLowerCase().includes(k) ||
          String(u.role || '').toLowerCase().includes(k) ||
          String(u.id || '').toLowerCase().includes(k)
        );
      });
    }
  },
  methods: {
    openDetails(p) {
      this.selectedProduct = p;
      this.showDetails = true;
    },
    closeDetails() {
      this.showDetails = false;
      this.selectedProduct = null;
    },
    async loadCatalog() {
      try {
        const apiUrl = 'http://localhost:3000/products';
        this.catalogue = await ProductCatalogue.loadFromUrl(apiUrl);
        // json-server returns inventory_count and priceCents (or price) in DTO; keep the raw list too
        const res = await fetch(apiUrl);
        const arr = await res.json();
        this.products = arr;
      } catch (err) {
        console.error(err);
        this.message = 'Failed to load products';
        this.catalogue = new ProductCatalogue([]);
        this.products = [];
      }
    },
    formatDate(d) {
      if (!d) return '';
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? '' : dt.toLocaleString();
    },
    async loadUsers() {
      const base = 'http://localhost:3000';
      this.userMessage = '';
      try {
        const [cRes, aRes] = await Promise.all([
          fetch(`${base}/customers`),
          fetch(`${base}/admins`)
        ]);
        const customers = cRes.ok ? await cRes.json() : [];
        const admins = aRes.ok ? await aRes.json() : [];
        // Normalize shapes and combine
        const norm = (arr, role) => (Array.isArray(arr) ? arr.map(x => ({
          id: x.id || x.userId || '',
          name: x.name || '',
          email: (x.email || '').toLowerCase(),
          phone: x.phone || '',
          role: x.role || role,
          createdAt: x.createdAt || x.creationDate || ''
        })) : []);
        this.users = [...norm(customers, 'Customer'), ...norm(admins, 'Admin')]
          .sort((a,b) => String(a.id).localeCompare(String(b.id)));
      } catch (err) {
        console.error(err);
        this.userMessage = 'Failed to load users';
        this.users = [];
      }
    },
    async loadOrders() {
      this.ordersMessage = '';
      try {
        const base = 'http://localhost:3000';
        const [oRes, pRes] = await Promise.all([
          fetch(`${base}/orders`),
          fetch(`${base}/payments`)
        ]);
        const os = oRes.ok ? await oRes.json() : [];
        const ps = pRes.ok ? await pRes.json() : [];
        const payByOrder = new Map(ps.map(p => [p.orderId, p]));
        this.orders = os.map(o => ({ ...o, payment: payByOrder.get(o.orderId) }));
      } catch (err) {
        console.error(err);
        this.orders = [];
        this.ordersMessage = 'Failed to load orders';
      }
    },
    async cancelOrder(o) {
      if (!o) return;
      if (!confirm(`Cancel order #${o.orderId}? This will remove the order. If the payment is not completed yet, it will be deleted as well.`)) return;
      this.ordersMessage = '';
      this.busyOrderId = o.orderId;
      const base = 'http://localhost:3000';
      try {
        // Delete payment if still Initiated/Pending
        let pay = o.payment;
        if (!pay) {
          const pRes = await fetch(`${base}/payments?orderId=${encodeURIComponent(o.orderId)}`);
          if (pRes.ok) {
            const arr = await pRes.json();
            pay = Array.isArray(arr) ? arr[0] : null;
          }
        }
        if (pay && (pay.status === 'Initiated' || pay.status === 'Pending')) {
          let payId = pay.id ?? pay.paymentId;
          if (payId == null) {
            // Fallback lookup by orderId already done; skip deletion if we don't have an id
          } else {
            await fetch(`${base}/payments/${encodeURIComponent(payId)}`, { method: 'DELETE' });
          }
        }

        // Delete order
        let ordId = o.id ?? null;
        if (ordId == null) {
          const oRes = await fetch(`${base}/orders?orderId=${encodeURIComponent(o.orderId)}`);
          if (oRes.ok) {
            const arr = await oRes.json();
            if (Array.isArray(arr) && arr[0] && arr[0].id != null) ordId = arr[0].id;
          }
        }
        if (ordId == null) throw new Error('Order record id not found');
        const del = await fetch(`${base}/orders/${encodeURIComponent(ordId)}`, { method: 'DELETE' });
        if (!del.ok) throw new Error('Failed to delete order');
        this.ordersMessage = `Cancelled order ${o.orderId}`;
        await this.loadOrders();
      } catch (err) {
        console.error(err);
        this.ordersMessage = `Cancel failed: ${err.message || err}`;
      } finally {
        this.busyOrderId = '';
      }
    },
    async removeUser(u) {
      if (!u || !u.id) return;
      if (!confirm(`Delete user ${u.name || u.email || u.id}?`)) return;
      const base = 'http://localhost:3000';
      const role = String(u.role || '').toLowerCase();
      const coll = role === 'admin' ? 'admins' : 'customers';
      try {
        // Try direct delete by id first
        let res = await fetch(`${base}/${coll}/${encodeURIComponent(u.id)}`, { method: 'DELETE' });
        if (!res.ok) {
          // Fallback: find by email then delete by numeric id if present
          const q = await fetch(`${base}/${coll}?email=${encodeURIComponent(u.email || '')}`);
          if (q.ok) {
            const arr = await q.json();
            if (Array.isArray(arr) && arr.length > 0 && arr[0].id != null) {
              res = await fetch(`${base}/${coll}/${encodeURIComponent(arr[0].id)}`, { method: 'DELETE' });
            }
          }
        }
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
        this.userMessage = `Deleted user ${u.email || u.id}`;
        await this.loadUsers();
      } catch (err) {
        console.error(err);
        this.userMessage = `Delete failed: ${err.message || err}`;
      }
    },
    computeImageSrc(p) {
      const url = p.imageUrl || '';
      const trimmed = String(url).trim();
      if (!trimmed) return this.placeholder;
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      if (trimmed.startsWith('/')) return trimmed;
      return `/images/${trimmed}`;
    },
    onImgError(e) {
      if (e && e.target) e.target.src = this.placeholder;
    },
    async onAddProduct(dto) {
      const apiUrl = 'http://localhost:3000/products';
      try {
        const res = await fetch(apiUrl, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(dto) });
        if (!res.ok) throw new Error('Server returned ' + res.status);
        await this.loadCatalog();
        this.message = `Added ${dto.productId || dto.name}`;
        // reset child form
        if (this.$refs && this.$refs.addForm && this.$refs.addForm.resetForm) this.$refs.addForm.resetForm();
      } catch (err) {
        console.error(err);
        this.message = 'Add failed: ' + err.message;
      }
    },
    async removeProduct(p) {
      if (!confirm(`Remove ${p.name} (${p.productId})?`)) return;
      try {
        // json-server adds numeric id; delete by numeric id
        const apiUrl = 'http://localhost:3000/products';
        // try by numeric id field first
        if (p.id !== undefined) {
          const del = await fetch(`${apiUrl}/${p.id}`, { method: 'DELETE' });
          if (!del.ok) throw new Error('Delete failed: ' + del.status);
        } else {
          // fallback: search by productId
          const q = await fetch(`${apiUrl}?productId=${encodeURIComponent(p.productId)}`);
          const found = await q.json();
          if (!Array.isArray(found) || found.length === 0) throw new Error('Record not found');
          const del = await fetch(`${apiUrl}/${found[0].id}`, { method: 'DELETE' });
          if (!del.ok) throw new Error('Delete failed: ' + del.status);
        }
        this.message = `Removed ${p.productId || p.name}`;
        await this.loadCatalog();
      } catch (err) {
        console.error(err);
        this.message = 'Remove failed: ' + err.message;
      }
    }
  },
  mounted() {
    this.loadCatalog();
    this.loadUsers();
    this.loadOrders();
  }
  ,
  watch: {
    searchTerm() {
      // no-op placeholder; keeps reactivity and allows future behaviour
    }
  }
};
</script>

<style scoped>
.admin-dashboard { max-width: 1000px; margin: 0 auto; padding: 1rem; }
.management { margin-bottom: 1rem; background:#fafafa; padding:0.6rem; border-radius:6px; }
.row { display:flex; gap:0.5rem; margin-bottom:0.5rem; }
.row input, .row textarea { flex:1; padding:0.4rem; }
.search {
  display: block;
  margin: 0 0 1rem 0;
  padding: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}
.product-list { list-style:none; padding:0; display:grid; gap:0.6rem; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); }
.product-item { display:flex; gap:0.6rem; padding:0.6rem; border:1px solid #eee; border-radius:6px; background:#fff; }
.product-item img { width:96px; height:96px; object-fit:cover; border-radius:4px; }
.meta { flex:1; }
.name { font-weight:600; }
.desc { color:#555; font-size:0.9rem; margin:0.25rem 0; }
.actions { margin-top:0.5rem; }
.message { color:#060; }

/* Product management collapsible */
.product-management { margin-bottom: 1rem; }
.product-management summary { cursor: pointer; padding: 0.5rem 0.6rem; background:#f3f3f3; border-radius:6px; font-weight:600; }
.product-management .management-contents { margin-top:0.75rem; padding:0.6rem; background:#fff; border:1px solid #eee; border-radius:6px; }

/* User management */
.user-management { margin-bottom: 1rem; }
.user-management summary { cursor: pointer; padding: 0.5rem 0.6rem; background:#f3f3f3; border-radius:6px; font-weight:600; }
.user-management .management-contents { margin-top:0.75rem; padding:0.6rem; background:#fff; border:1px solid #eee; border-radius:6px; }
.toolbar { display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem; }
.user-list { list-style:none; padding:0; display:grid; gap:0.6rem; grid-template-columns: repeat(auto-fill,minmax(420px,1fr)); }
.user-item { display:flex; gap:0.6rem; padding:0.6rem; border:1px solid #eee; border-radius:6px; background:#fff; }
.empty { color:#777; font-style:italic; }
.clickable { cursor: pointer; }

/* Order management */
.order-management { margin-bottom: 1rem; }
.order-management summary { cursor: pointer; padding: 0.5rem 0.6rem; background:#f3f3f3; border-radius:6px; font-weight:600; }
.order-management .management-contents { margin-top:0.75rem; padding:0.6rem; background:#fff; border:1px solid #eee; border-radius:6px; }
.order-list { list-style:none; padding:0; display:grid; gap:0.6rem; }
.order-item { display:flex; flex-direction:column; gap:0.25rem; padding:0.6rem; border:1px solid #eee; border-radius:6px; background:#fff; }
.row1, .row2 { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; }
.muted { color:#6b7280; }
.badge { display:inline-block; padding:0.15rem 0.4rem; border-radius:999px; font-size:0.8rem; background:#eef2ff; color:#3730a3; margin-left:0.25rem; }
.badge.pay-completed { background:#ecfdf5; color:#065f46; }
.badge.pay-initiated { background:#fff7ed; color:#9a3412; }
.badge.st-pending { background:#fff7ed; color:#9a3412; }
.badge.st-paid { background:#ecfdf5; color:#065f46; }
</style>