<template>
  <section class="order-page">
    <h1>Order #{{ routeId }}</h1>

    <div v-if="loading" class="loading">Loading…</div>
    <div v-else-if="!order" class="empty">Order not found.</div>
    <div v-else class="content">
      <div class="meta">
        <div>
          <span class="badge" :class="`st-${order.status.toLowerCase()}`">{{ order.status }}</span>
          <span class="badge" :class="`pay-${(payment?.status||'').toLowerCase()}`">Payment: {{ payment?.status || 'N/A' }}</span>
        </div>
        <div class="muted">Placed: {{ fmt(order.createdAt) }}</div>
      </div>

      <div class="grid">
        <div class="panel">
          <h2>Invoice</h2>
          <div class="kv"><span>Invoice ID</span><span>{{ invoice?.invoiceId || '—' }}</span></div>
          <div class="kv"><span>Billing Name</span><span>{{ invoice?.billingName || order.customerContact?.name || '—' }}</span></div>
          <div class="kv"><span>Billing Address</span><span>{{ invoice?.billingAddress || order.customerContact?.deliveryAddress || '—' }}</span></div>
          <div class="kv"><span>Issued</span><span>{{ fmt(invoice?.issuedAt) }}</span></div>

          <table class="lines" v-if="order.items?.length">
            <thead>
              <tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Total</th></tr>
            </thead>
            <tbody>
              <tr v-for="l in order.items" :key="l.productId">
                <td>{{ l.name }}</td>
                <td class="num">{{ l.quantity }}</td>
                <td class="num">${{ (l.unitPriceCents/100).toFixed(2) }}</td>
                <td class="num">${{ (l.lineTotalCents/100).toFixed(2) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr><td colspan="3" class="num">Subtotal</td><td class="num">${{ (order.subtotalCents/100).toFixed(2) }}</td></tr>
              <tr><td colspan="3" class="num">GST (10%)</td><td class="num">${{ (order.gstCents/100).toFixed(2) }}</td></tr>
              <tr><td colspan="3" class="num total">Total</td><td class="num total">${{ (order.totalCents/100).toFixed(2) }}</td></tr>
            </tfoot>
          </table>
        </div>

        <div class="panel actions">
          <h2>Actions</h2>
          <button v-if="order.status==='Pending' && payment && payment.status==='Initiated'" @click="payNow" :disabled="busy">Complete payment</button>
          <a v-if="invoice" :href="invoiceJsonLink" target="_blank" class="secondary">View invoice JSON</a>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'OrderPage',
  data() {
    return {
      loading: true,
      busy: false,
      order: null,
      invoice: null,
      payment: null,
    };
  },
  computed: {
    routeId() { return this.$route.params.orderId; },
    invoiceJsonLink() {
      const id = this.invoice?.id ?? this.invoice?.invoiceId;
      return id ? `http://localhost:3000/invoices/${id}` : '#';
    }
  },
  methods: {
    fmt(d) { const dt = new Date(d); return isNaN(dt.getTime()) ? '' : dt.toLocaleString(); },
    async load() {
      this.loading = true;
      const base = 'http://localhost:3000';
      try {
        const [oRes, pRes, iRes] = await Promise.all([
          fetch(`${base}/orders?orderId=${encodeURIComponent(this.routeId)}`),
          fetch(`${base}/payments?orderId=${encodeURIComponent(this.routeId)}`),
          fetch(`${base}/invoices?orderId=${encodeURIComponent(this.routeId)}`)
        ]);
        const os = oRes.ok ? await oRes.json() : [];
        const ps = pRes.ok ? await pRes.json() : [];
        const is = iRes.ok ? await iRes.json() : [];
        this.order = os[0] || null;
        this.payment = ps[0] || null;
        this.invoice = is[0] || null;
      } finally {
        this.loading = false;
      }
    },
    async payNow() {
      if (!this.order || !this.payment) return;
      this.busy = true;
      try {
        const base = 'http://localhost:3000';
        const now = new Date().toISOString();
        const payId = this.payment.id ?? this.payment.paymentId;
        await fetch(`${base}/payments/${encodeURIComponent(payId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Completed', processedAt: now }) });
        const ordId = this.order.id ?? this.order.orderId;
        await fetch(`${base}/orders/${encodeURIComponent(ordId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Paid', paidAt: now }) });
        await this.load();
      } finally {
        this.busy = false;
      }
    }
  },
  mounted() {
    this.load();
  }
};
</script>

<style scoped>
.order-page { max-width: 960px; margin: 0 auto; padding: 1rem; }
.loading, .empty { color: #6b7280; }
.meta { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 0.75rem; }
.grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; align-items: start; }
.panel { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 1rem; }
.kv { display: grid; grid-template-columns: 180px 1fr; gap: 6px; margin-bottom: 0.25rem; }
.lines { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
.lines th, .lines td { border-bottom: 1px solid #eee; padding: 6px; text-align: left; }
.lines .num { text-align: right; }
.total { font-weight: 700; }
.badge { display:inline-block; padding: 0.15rem 0.4rem; border-radius: 999px; font-size: 0.8rem; background: #eef2ff; color: #3730a3; margin-left: 0.25rem; }
.badge.pay-completed { background: #ecfdf5; color: #065f46; }
.badge.pay-initiated { background: #fff7ed; color: #9a3412; }
.badge.st-pending { background: #fff7ed; color: #9a3412; }
.badge.st-paid { background: #ecfdf5; color: #065f46; }
.muted { color: #6b7280; }
@media (max-width: 800px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
