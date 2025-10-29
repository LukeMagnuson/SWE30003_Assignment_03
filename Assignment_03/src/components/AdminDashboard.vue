<template>
  <div class="admin-dashboard">
    <h1>Admin Dashboard</h1>
    <p v-if="message" class="message">{{ message }}</p>

    <AddProductForm ref="addForm" @add="onAddProduct" />

    <section class="list">
      <h2>Products</h2>
      <ul class="product-list">
        <li v-for="p in products" :key="p.productId" class="product-item">
          <img :src="computeImageSrc(p)" alt="" @error="onImgError($event)" />
          <div class="meta">
            <div class="name">{{ p.name }} <small>({{ p.productId }})</small></div>
            <div class="desc">{{ p.description }}</div>
            <div class="info">Stock: {{ p.inventory_count ?? p.quantityAvailable }} — ${{ ((p.priceCents ?? (p.price*100))/100).toFixed(2) }}</div>
            <div class="actions">
              <button @click="removeProduct(p)">Remove</button>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import ProductCatalogue from '../models/ProductCatalogue';
import AddProductForm from './AddProductForm.vue';

export default {
  name: 'AdminDashboard',
  components: { AddProductForm },
  data() {
    return {
      catalogue: null,
      products: [],
      message: '',
      // form state moved to AddProductForm component
      placeholder: '/images/Supa_Team_4.jpg'
    };
  },
  methods: {
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
  }
};
</script>

<style scoped>
.admin-dashboard { max-width: 1000px; margin: 0 auto; padding: 1rem; }
.management { margin-bottom: 1rem; background:#fafafa; padding:0.6rem; border-radius:6px; }
.row { display:flex; gap:0.5rem; margin-bottom:0.5rem; }
.row input, .row textarea { flex:1; padding:0.4rem; }
.product-list { list-style:none; padding:0; display:grid; gap:0.6rem; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); }
.product-item { display:flex; gap:0.6rem; padding:0.6rem; border:1px solid #eee; border-radius:6px; background:#fff; }
.product-item img { width:96px; height:96px; object-fit:cover; border-radius:4px; }
.meta { flex:1; }
.name { font-weight:600; }
.desc { color:#555; font-size:0.9rem; margin:0.25rem 0; }
.actions { margin-top:0.5rem; }
.message { color:#060; }
</style>