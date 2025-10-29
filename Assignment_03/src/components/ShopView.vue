<template>
  <div class="shop-view">
    <h1>Shop</h1>

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
    }
  },
  
  watch: {
    searchTerm() { this.currentPage = 1; }
  },
  async mounted() {
    // Try a set of likely locations for the static JSON file so the view works
    // whether the app is served by Vite dev server or via a built /dist.
    // Try db.json first (the app's JSON database), then the legacy shop.json locations.
    const candidates = ['/db.json', 'db.json', './db.json', '/data/shop.json', 'data/shop.json', './data/shop.json', '/public/data/shop.json'];
    let loaded = false;
    for (const url of candidates) {
      try {
        this.catalogue = await ProductCatalogue.loadFromUrl(url);
        console.info('Loaded product catalogue from:', url);
        loaded = true;
        break;
      } catch (err) {
        console.debug('Failed to load from', url, err && err.message ? err.message : err);
      }
    }
    if (!loaded) {
      console.error('Failed to load product data from any candidate URL, using empty catalogue');
      this.catalogue = new ProductCatalogue([]);
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