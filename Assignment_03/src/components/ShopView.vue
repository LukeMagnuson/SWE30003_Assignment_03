<template>
  <div class="shop-view">
    <h1>Shop</h1>

    <input v-model="searchTerm" placeholder="Search products..." class="search" />

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
      // placeholder - keep a fallback image path that exists in public/images/
      placeholder: '/images/Supa_Team_4.jpg'
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

    // compute an image src that works for:
    // - absolute URLs (http(s)://...)
    // - root-relative paths starting with '/'
    // - plain filenames or relative paths: prefix with '/images/' (helpful if DTO has just filename)
    computeImageSrc(product) {
      const url = product.imageUrl || '';
      const trimmed = String(url).trim();
      if (!trimmed) return this.placeholder;

      // absolute
      if (/^https?:\/\//i.test(trimmed)) return trimmed;

      // root relative already (e.g. /images/...)
      if (trimmed.startsWith('/')) return trimmed;

      // assume it's a filename or relative path -> serve from public/images
      return `/images/${trimmed}`;
    },

    // on image load error: set fallback placeholder
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
.product-info {
  flex: 1;
}
.product-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.product-desc {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.5rem;
}
.product-meta {
  display:flex;
  gap:1rem;
  font-size: 0.9rem;
  color:#333;
}
.pagination {
  margin-top: 1rem;
  display:flex;
  gap:1rem;
  align-items:center;
}
</style>