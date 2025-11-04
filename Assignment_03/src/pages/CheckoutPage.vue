<template>
  <div class="checkout-page">
    <h1>Checkout</h1>

    <div v-if="itemCount === 0" class="empty">Your cart is empty. <router-link to="/shop">Go shopping</router-link>.</div>

    <div v-else class="layout">
      <section class="details">
        <h2>Contact & Delivery Details</h2>
        <form @submit.prevent="onSubmit">
          <div class="row">
            <label>Name<input v-model.trim="form.name" type="text" required /></label>
            <label>Email<input v-model.trim="form.email" type="email" required /></label>
          </div>
          <div class="row">
            <label>Phone<input v-model.trim="form.phone" type="tel" /></label>
          </div>
          <div class="row">
            <label class="full">Delivery Address<textarea v-model.trim="form.deliveryAddress" rows="3" required></textarea></label>
          </div>

          <div class="actions">
            <router-link class="secondary" to="/cart">Back to cart</router-link>
            <button type="submit" :disabled="busy">Place order</button>
            <span class="msg" v-if="message">{{ message }}</span>
          </div>
        </form>
      </section>

      <aside class="summary">
        <h2>Order Summary</h2>
        <ul class="lines">
          <li v-for="i in items" :key="i.productId">
            <span class="name">{{ i.name }} × {{ i.quantity }}</span>
            <span class="price">${{ ((i.unitPriceCents * i.quantity) / 100).toFixed(2) }}</span>
          </li>
        </ul>
        <div class="totals">
          <div><span>Subtotal</span><span>${{ (subtotalCents / 100).toFixed(2) }}</span></div>
          <div><span>GST (10%)</span><span>${{ (gstCents / 100).toFixed(2) }}</span></div>
          <div class="grand"><span>Total</span><span>${{ (totalCents / 100).toFixed(2) }}</span></div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import auth from '../models/AuthenticationService';
import { Customer } from '../models/Customer';
import Order from '../models/Order';
import Payment from '../models/Payment';
import Invoice from '../models/Invoice';
import cart from '../stores/cart';

export default {
  name: 'CheckoutPage',
  data() {
    return {
      busy: false,
      message: '',
      form: {
        name: '',
        email: '',
        phone: '',
        deliveryAddress: ''
      }
    };
  },
  computed: {
    items() { return cart.items.value; },
    itemCount() { return cart.itemCount.value; },
    subtotalCents() { return cart.subtotalCents.value; },
    gstCents() { return cart.gstCents.value; },
    totalCents() { return cart.totalCents.value; }
  },
  methods: {
    tryAutofillFromCustomer() {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        const user = auth.validateSession(token);
        if (user && typeof user.getRole === 'function' && user.getRole() === 'Customer') {
          // User is a Customer; pull details from the domain object without modifying it
          const c = user; // instanceof Customer at runtime
          this.form.name = c.name || this.form.name;
          this.form.email = c.email || this.form.email;
          this.form.phone = c.phone || this.form.phone;
          if (c.deliveryAddress) this.form.deliveryAddress = c.deliveryAddress;
        }
      } catch (_) {
        // ignore validation failures; form stays blank
      }
    },
    async onSubmit() {
      if (this.itemCount === 0) return;
      this.busy = true;
      this.message = '';
      try {
        // Identify user if logged in (associate order with any logged-in user, Customer or Admin)
        let customerId = 'guest';
        try {
          const token = localStorage.getItem('auth_token');
          if (token) {
            const u = auth.validateSession(token);
            if (u && u.userId) customerId = u.userId;
          }
        } catch (_) { /* leave as guest */ }

        // Stock check against db and prepare inventory updates
        const base = 'http://localhost:3000';
        const items = cart.items.value.map(i => ({ ...i }));
        const productFetches = items.map(i => fetch(`${base}/products?productId=${encodeURIComponent(i.productId)}`));
        const productResponses = await Promise.all(productFetches);
        const productArrays = await Promise.all(productResponses.map(r => r.ok ? r.json() : Promise.resolve([])));
        const products = productArrays.map(arr => Array.isArray(arr) ? arr[0] : null);
        for (let idx = 0; idx < items.length; idx++) {
          const line = items[idx];
          const prod = products[idx];
          if (!prod) throw new Error(`Product ${line.productId} not found`);
          const current = Number(prod.inventory_count ?? 0);
          if (line.quantity > current) throw new Error(`Not enough stock for ${line.name}`);
        }

        // Build domain objects from existing classes (without modifying them)
        const orderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
        const invoiceId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`;
        const paymentId = `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`;
        const order = Order.fromCart(orderId, customerId, items);
        const invoice = new Invoice(invoiceId, order, this.form.name, this.form.deliveryAddress || undefined);
        const payment = new Payment(paymentId, orderId, 'Card', order.totalCents);

        // Persist to json-server
        const orderDTO = { ...order.toJSON(), customerContact: { ...this.form } };
        const invDTO = invoice.toJSON();
        const payDTO = payment.toJSON();

        const [oRes, iRes, pRes] = await Promise.all([
          fetch(`${base}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderDTO) }),
          fetch(`${base}/invoices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invDTO) }),
          fetch(`${base}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payDTO) })
        ]);
        if (!oRes.ok || !iRes.ok || !pRes.ok) throw new Error('Failed to save order');

        // Deduct stock
        const patches = items.map(async (line, idx) => {
          const prod = products[idx];
          const newCount = Math.max(0, Number(prod?.inventory_count || 0) - line.quantity);
          let id = prod && prod.id;
          if (id == null) {
            // robust fallback: re-query to get json-server's numeric id
            const q = await fetch(`${base}/products?productId=${encodeURIComponent(line.productId)}`);
            if (q.ok) {
              const arr = await q.json();
              if (Array.isArray(arr) && arr[0] && arr[0].id != null) id = arr[0].id;
            }
          }
          if (id == null) return; // give up silently if id not retrievable
          await fetch(`${base}/products/${encodeURIComponent(id)}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inventory_count: newCount })
          });
        });
        await Promise.all(patches);

        // Clear cart
        cart.clear();
        this.$router.push({ name: 'order', params: { orderId } });
      } catch (e) {
        this.message = e && e.message ? e.message : String(e);
      } finally {
        this.busy = false;
      }
    }
  },
  mounted() {
    this.tryAutofillFromCustomer();
  }
};
</script>

<style scoped>
.checkout-page { padding: 1rem; }
.empty { padding: 1rem; color: #555; }
.layout { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; align-items: start; }
.details, .summary { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 1rem; }
.details h2, .summary h2 { margin-top: 0; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem; }
.row .full { grid-column: 1 / -1; }
label { display: flex; flex-direction: column; gap: 0.25rem; font-weight: 600; }
input, textarea { font-weight: 400; }
.actions { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem; }
.actions .secondary { text-decoration: none; padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #111827; }
.msg { color: #065f46; }
.lines { list-style: none; padding: 0; margin: 0 0 0.5rem 0; display: grid; gap: 0.5rem; }
.lines li { display: flex; justify-content: space-between; }
.totals { display: grid; gap: 0.25rem; }
.totals .grand { font-weight: 700; border-top: 1px solid #eee; padding-top: 0.25rem; }

@media (max-width: 800px) {
  .layout { grid-template-columns: 1fr; }
  .row { grid-template-columns: 1fr; }
}
</style>
