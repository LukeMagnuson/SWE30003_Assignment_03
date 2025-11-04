<template>
  <div class="cart-page">
    <h1>Your Cart</h1>

    <div v-if="items.length === 0" class="empty">Your shopping cart is empty.</div>

    <table v-else class="cart-table">
      <thead>
        <tr>
          <th style="width:60px;">Image</th>
          <th>Product</th>
          <th class="num">Unit Price</th>
          <th class="num" style="width:160px;">Quantity</th>
          <th class="num">Line Total</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="line in itemsWithProducts" :key="line.item.productId">
          <td>
            <img class="thumb" :src="imageSrc(line.product)" :alt="line.item.name" @error="onImgErr($event)" />
          </td>
          <td>
            <div class="name">{{ line.item.name }}</div>
            <div class="stock" v-if="line.product">In stock: {{ line.product.quantityAvailable }}</div>
            <div class="stock out" v-else>Product unavailable</div>
          </td>
          <td class="num">${{ (line.item.unitPriceCents / 100).toFixed(2) }}</td>
          <td class="num">
            <input
              type="number"
              min="0"
              :max="line.product ? line.product.quantityAvailable : 0"
              :disabled="!line.product"
              :value="line.item.quantity"
              @input="onQtyInput(line, $event)"
            />
          </td>
          <td class="num">${{ ((line.item.unitPriceCents * line.item.quantity) / 100).toFixed(2) }}</td>
          <td class="actions">
            <button class="link" @click="remove(line.item.productId)">Remove</button>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="num label">Subtotal</td>
          <td class="num">${{ (subtotalCents / 100).toFixed(2) }}</td>
          <td></td>
        </tr>
        <tr>
          <td colspan="4" class="num label">GST (10%)</td>
          <td class="num">${{ (gstCents / 100).toFixed(2) }}</td>
          <td></td>
        </tr>
        <tr>
          <td colspan="4" class="num label total">Total</td>
          <td class="num total">${{ (totalCents / 100).toFixed(2) }}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    <div class="checkout" v-if="items.length > 0">
      <button @click="checkout" :disabled="busy">Checkout</button>
      <span class="msg" v-if="message">{{ message }}</span>
    </div>
  </div>
</template>

<script>
import cart from '../stores/cart';
import ProductCatalogue from '../models/ProductCatalogue';

export default {
  data() {
    return {
      catalogue: null,
      busy: false,
      message: '',
      placeholder: '/images/Supa_Team_4.jpg',
    };
  },
  computed: {
    items() {
      return cart.items.value;
    },
    subtotalCents() { return cart.subtotalCents.value; },
    gstCents() { return cart.gstCents.value; },
    totalCents() { return cart.totalCents.value; },
    itemsWithProducts() {
      // map cart items to include live Product (for stock/max and image)
      return this.items.map((i) => ({
        item: i,
        product: this.catalogue ? this.catalogue.getProductById(i.productId) : null,
      }));
    },
  },
  methods: {
    imageSrc(product) {
      if (!product) return this.placeholder;
      const url = product.imageUrl || '';
      const trimmed = String(url).trim();
      if (!trimmed) return this.placeholder;
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      if (trimmed.startsWith('/')) return trimmed;
      return `/images/${trimmed}`;
    },
    onImgErr(e) {
      if (e && e.target) {
        e.target.onerror = null;
        e.target.src = this.placeholder;
      }
    },
    onQtyInput(line, ev) {
      const raw = Number(ev.target.value);
      const max = line.product ? line.product.quantityAvailable : 0;
      const clamped = Math.max(0, Math.min(max, Math.floor(isNaN(raw) ? 0 : raw)));
      if (clamped !== raw) ev.target.value = clamped;
      cart.updateQuantity(line.item.productId, clamped, max);
    },
    remove(productId) {
      cart.removeProduct(productId);
    },
    async checkout() {
      this.busy = true;
      this.message = '';
      try {
        // Validate stock availability just-in-time; then reduce stock and clear cart
        for (const line of this.itemsWithProducts) {
          if (!line.product) throw new Error(`Product ${line.item.productId} no longer available`);
          if (line.item.quantity > line.product.quantityAvailable) {
            throw new Error(`Not enough stock for ${line.item.name}`);
          }
        }
        // reduce stock
        for (const line of this.itemsWithProducts) {
          this.catalogue.reduceStock(line.item.productId, line.item.quantity);
        }
        cart.clear();
        this.message = 'Checkout complete! Thank you.';
      } catch (e) {
        this.message = e && e.message ? e.message : String(e);
      } finally {
        this.busy = false;
      }
    },
  },
  async mounted() {
    // Load catalogue to reference live stock and images
    const candidates = ['/db.json', 'db.json', './db.json', '/data/shop.json', 'data/shop.json', './data/shop.json', '/public/data/shop.json'];
    for (const url of candidates) {
      try {
        this.catalogue = await ProductCatalogue.loadFromUrl(url);
        break;
      } catch (_) {}
    }
    if (!this.catalogue) this.catalogue = new ProductCatalogue([]);
  },
};
</script>

<style scoped>
.cart-page { padding: 1rem; }
.empty { padding: 1rem; color: #555; }
.cart-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
.cart-table th, .cart-table td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
.cart-table th.num, .cart-table td.num { text-align: right; }
.cart-table .label { font-weight: 500; color:#333; }
.cart-table .total { font-weight: 700; }
.thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; background:#f6f6f6; }
.stock { font-size: 0.85rem; color: #555; }
.stock.out { color: #a33; }
.actions .link { background: none; border: none; color: #06c; cursor: pointer; }
.actions .link:hover { text-decoration: underline; }
.checkout { margin-top: 1rem; display:flex; align-items:center; gap: 1rem; }
.msg { color:#064; }
</style>
