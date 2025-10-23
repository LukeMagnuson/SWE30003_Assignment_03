<template>
  <div class="shop-view">
    <h1>Shop</h1>

    <!-- ADMIN: add product form -->
    <section class="admin">
      <h2>Add Product</h2>
      <form @submit.prevent="onAddProduct">
        <div class="row">
          <input v-model="addForm.productId" placeholder="productId (SKU)" required />
          <input v-model="addForm.name" placeholder="Name" required />
          <input v-model.number="addForm.price" type="number" step="0.01" placeholder="Price (AUD)" required />
          <input v-model.number="addForm.quantity" type="number" min="0" placeholder="Quantity" required />
        </div>
        <div class="row">
          <input v-model="addForm.category" placeholder="Category (optional)" />
          <input v-model="addForm.imageUrl" placeholder="Image URL or filename (optional)" />
        </div>
        <div class="row">
          <textarea v-model="addForm.description" placeholder="Description (optional)"></textarea>
        </div>
        <div class="row">
          <button type="submit">Add Product</button>
          <button type="button" @click="resetAddForm">Reset</button>
        </div>
      </form>
      <p class="admin-message" v-if="adminMessage">{{ adminMessage }}</p>
    </section>

    <!-- Search -->
    <input v-model="searchTerm" placeholder="Search products..." class="search" />

    <!-- Product grid -->
    <ul class="product-list">
      <li v-for="shopItem in paginatedShopItems" :key="shopItem.productId" class="product-item">
        <img
          class="product-image"
          :src="computeImageSrc(shopItem)"
          :alt="shopItem.name"
          @error="onImageError($event)"
        />
        <div class="product-info">
          <div class="product-name">{{ shopItem.name }}</div>
          <div class="product-desc">{{ shopItem.description }}</div>
          <div class="product-meta">
            <span class="stock">Stock: <b>{{ shopItem.quantityAvailable }}</b></span>
            <span class="price">Price: ${{ (shopItem.priceCents / 100).toFixed(2) }}</span>
          </div>
          <div class="product-actions">
            <button @click="confirmRemove(shopItem)">Remove</button>
          </div>
        </div>
      </li>
    </ul>

    <!-- Pagination -->
    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
      Page {{ currentPage }} of {{ totalPages }}
      <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
    </div>
  </div>
</template>

<script>
import ProductCatalogue from '../models/ProductCatalogue';

export default {
  data() {
    return {
      catalogue: null,
      searchTerm: '',
      currentPage: 1,
      itemsPerPage: 8,
      placeholder: '/images/Supa_Team_4.jpg',
      adminMessage: '',
      addForm: {
        productId: '',
        name: '',
        price: 0.0,
        quantity: 0,
        category: '',
        imageUrl: '',
        description: ''
      }
    };
  },
  computed: {
    filteredShop() {
      if (!this.catalogue) return [];
      return this.catalogue.searchProducts(this.searchTerm);
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredShop.length / this.itemsPerPage));
    },
    paginatedShopItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredShop.slice(start, start + this.itemsPerPage);
    }
  },
  methods: {
    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; },
    prevPage() { if (this.currentPage > 1) this.currentPage--; },

    computeImageSrc(product) {
      const url = product.imageUrl || '';
      const trimmed = String(url).trim();
      if (!trimmed) return this.placeholder;
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      if (trimmed.startsWith('/')) return trimmed;
      return `/images/${trimmed}`;
    },

    onImageError(e) {
      if (e && e.target) {
        e.target.onerror = null;
        e.target.src = this.placeholder;
      }
    },

    resetAddForm() {
      this.addForm = {
        productId: '',
        name: '',
        price: 0.0,
        quantity: 0,
        category: '',
        imageUrl: '',
        description: ''
      };
      this.adminMessage = '';
    },

    async onAddProduct() {
      // construct DTO accepted by productFromDTO and json-server
      const dto = {
        productId: this.addForm.productId,
        name: this.addForm.name,
        price: this.addForm.price, // ProductCatalogue maps price (dollars) -> priceCents
        inventory_count: this.addForm.quantity,
        category: this.addForm.category || undefined,
        imageUrl: this.addForm.imageUrl || undefined,
        description: this.addForm.description || undefined
      };

      const apiUrl = 'http://localhost:3000/products';
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto)
        });
        if (!res.ok) {
          throw new Error(`Server returned ${res.status} ${res.statusText}`);
        }
        const saved = await res.json();
        this.adminMessage = `Added product ${saved.productId || saved.name}`;
        // reload catalogue from API so in-memory state matches server
        this.catalogue = await ProductCatalogue.loadFromUrl(apiUrl);
        this.resetAddForm();
      } catch (err) {
        this.adminMessage = `Failed to add product: ${err.message}`;
        console.error('Add product error', err);
      }
    },

    // Find json-server's numeric id for an item with given productId
    async findServerRecord(productId) {
      const apiUrl = 'http://localhost:3000/products';
      const res = await fetch(`${apiUrl}?productId=${encodeURIComponent(productId)}`);
      if (!res.ok) throw new Error(`Failed to query server: ${res.status}`);
      const arr = await res.json();
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;
    },

    async removeProductFromServer(productId) {
      try {
        const apiUrl = 'http://localhost:3000/products';
        const rec = await this.findServerRecord(productId);
        if (!rec || rec.id === undefined) {
          // fallback: try delete by numeric id if productId is numeric; else treat as not found
          this.adminMessage = `Product ${productId} not found on server`;
          return false;
        }
        const delRes = await fetch(`${apiUrl}/${rec.id}`, { method: 'DELETE' });
        if (!delRes.ok) throw new Error(`Delete failed: ${delRes.status}`);
        // reload catalogue to reflect deletion
        this.catalogue = await ProductCatalogue.loadFromUrl(apiUrl);
        return true;
      } catch (err) {
        this.adminMessage = `Failed to remove product: ${err.message}`;
        console.error('Remove product error', err);
        return false;
      }
    },

    confirmRemove(product) {
      if (!confirm(`Remove product ${product.name} (${product.productId})?`)) return;
      this.removeProductFromServer(product.productId)
        .then(ok => {
          if (ok) this.adminMessage = `Removed ${product.productId}`;
        })
        .catch(err => {
          console.error(err);
          this.adminMessage = `Error removing ${product.productId}: ${err.message}`;
        });
    }
  },
  watch: {
    searchTerm() { this.currentPage = 1; }
  },
  async mounted() {
    const apiUrl = 'http://localhost:3000/products';
    const fallbackUrl = '/data/shop.json';
    try {
      this.catalogue = await ProductCatalogue.loadFromUrl(apiUrl);
      console.info('Loaded product catalogue from API:', apiUrl);
    } catch (apiErr) {
      console.warn('Failed to load from API, falling back to static JSON:', apiErr);
      try {
        this.catalogue = await ProductCatalogue.loadFromUrl(fallbackUrl);
        console.info('Loaded product catalogue from fallback JSON:', fallbackUrl);
      } catch (jsonErr) {
        console.error('Failed to load product data from API and fallback JSON', jsonErr);
        this.catalogue = new ProductCatalogue([]);
      }
    }
  }
};
</script>

<style scoped>
.shop-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem;
}
.admin {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fafafa;
}
.admin .row { display:flex; gap:0.5rem; margin-bottom:0.5rem; }
.admin input, .admin textarea { flex:1; padding:0.4rem; }
.search {
  display:block;
  margin: 0 0 1rem 0;
  padding: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}
.product-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
.product-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 6px;
  align-items: flex-start;
  background: #fff;
}
.product-image {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  background: #f6f6f6;
}
.product-info { flex:1; }
.product-name { font-weight: 600; margin-bottom: 0.25rem; }
.product-desc { font-size: 0.9rem; color: #555; margin-bottom: 0.5rem; }
.product-meta { display:flex; gap:1rem; font-size: 0.9rem; color:#333; margin-bottom:0.5rem; }
.product-actions { margin-top: 0.25rem; }
.pagination { margin-top: 1rem; display:flex; gap:1rem; align-items:center; }
.admin-message { color: #064; margin-top: 0.5rem; }
</style>