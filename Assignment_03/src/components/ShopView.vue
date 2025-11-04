<template>
  <div class="shop-view" ref="shopView">
    <h1>Catalogue</h1>

    <!-- Search -->
      <!-- Search / Controls -->
      <div class="toolbar">
        <input v-model="searchTerm" placeholder="Search products..." class="search" />
        <button class="secondary" @click="reloadFromApi" :disabled="loading">{{ loading ? 'Refreshing…' : 'Refresh' }}</button>
      </div>

    <!-- Product grid -->
    <ul class="product-list">
      <li
        v-for="shopItem in paginatedShopItems"
        :key="shopItem.productId"
        class="product-item clickable"
        @click="openDetails(shopItem)"
        role="button"
        tabindex="0"
        @keydown.enter="openDetails(shopItem)"
        @keydown.space.prevent="openDetails(shopItem)"
      >
        <img
          class="product-image"
          :src="computeImageSrc(shopItem)"
          :alt="shopItem.name"
          @error="onImageError($event)"
        />
        <div class="product-info">
          <div class="product-name">{{ shopItem.name }}</div>
          <div class="product-desc truncate-1">{{ shopItem.description }}</div>
          <div class="product-meta">
            <span class="stock">Stock: <b>{{ shopItem.quantityAvailable }}</b></span>
            <span class="price">Price: ${{ (shopItem.priceCents / 100).toFixed(2) }}</span>
          </div>
          <div class="product-actions">
            <input
              class="qty"
              type="number"
              min="1"
              :max="shopItem.quantityAvailable"
              :disabled="shopItem.quantityAvailable === 0"
              v-model.number="quantities[shopItem.productId]"
              @click.stop
            />
            <button
              @click.stop="addToCart(shopItem)"
              :disabled="shopItem.quantityAvailable === 0"
            >
              {{ shopItem.quantityAvailable === 0 ? 'Out of stock' : 'Add to cart' }}
            </button>
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

    <!-- Product details overlay -->
    <ProductDetailsModal v-model="showDetails" :product="selectedProduct" @close="closeDetails" />
  </div>
</template>

<script>
import ProductCatalogue from '../models/ProductCatalogue';
import cart from '../stores/cart';
import ProductDetailsModal from './ProductDetailsModal.vue';

export default {
  components: { ProductDetailsModal },
  data() {
    return {
      catalogue: null,
      searchTerm: '',
      currentPage: 1,
      itemsPerPage: 8,
      placeholder: '/images/Supa_Team_4.jpg',
      quantities: {},
      showDetails: false,
      selectedProduct: null,
      apiUrl: 'http://localhost:3000/products',
      loading: false,
      autoRefreshMs: 10000,
      _refreshTimer: null
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
    openDetails(product) {
      this.selectedProduct = product;
      this.showDetails = true;
    },
    closeDetails() {
      this.showDetails = false;
      this.selectedProduct = null;
    },
    async reloadFromApi() {
      if (!this.apiUrl) return;
      this.loading = true;
      try {
        this.catalogue = await ProductCatalogue.loadFromUrl(this.apiUrl);
      } catch (e) {
        console.error('Failed to load catalogue from API', e);
      } finally {
        this.loading = false;
        this.$nextTick(() => this.recalcItemsPerPage());
      }
    },
    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; },
    prevPage() { if (this.currentPage > 1) this.currentPage--; },

    // Recalculate itemsPerPage to fill the visible area based on container size.
    recalcItemsPerPage() {
      try {
        const container = this.$refs.shopView;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerTop = containerRect.top;

        // Estimate product item width/height. Use existing rendered element if available.
        const firstItem = container.querySelector('.product-item');
  const itemWidth = firstItem ? firstItem.offsetWidth : 260; // px
  const itemHeight = firstItem ? firstItem.offsetHeight : 220; // px

  // Use a consistent minimum item width to avoid text overflow when items shrink.
  const minItemWidth = 260; // pixels (matches CSS fixed column)
  const columns = Math.max(1, Math.floor(containerWidth / minItemWidth));

        // Determine available vertical space between top of container and top of footer (or bottom of viewport)
        const viewportHeight = window.innerHeight;
        let footerEl = document.querySelector('.site-footer') || document.querySelector('footer');
        const footerHeight = footerEl ? footerEl.offsetHeight : 0;
        const availableHeight = Math.max(0, viewportHeight - containerTop - footerHeight - 24); // 24px cushion

  const minItemHeight = 220; // fixed item height (matches CSS)
  const rows = Math.max(1, Math.floor(availableHeight / Math.max(minItemHeight, itemHeight)));
        const newItemsPerPage = Math.max(1, columns * rows);
        if (newItemsPerPage !== this.itemsPerPage) {
          this.itemsPerPage = newItemsPerPage;
          this.currentPage = 1;
        }
      } catch (e) {
        // swallow measurement errors silently
        console.debug('recalcItemsPerPage failed', e && e.message ? e.message : e);
      }
    },

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

    addToCart(product) {
      const max = product.quantityAvailable;
      const desired = Math.max(1, Math.floor(this.quantities[product.productId] ?? 1));
      const qty = Math.min(desired, max);
      try {
        cart.addProduct(product, qty);
        // reset to 1 after add
        this.setQty(product.productId, 1);
      } catch (e) {
        alert(e && e.message ? e.message : String(e));
      }
    },

    setQty(productId, value) {
      this.quantities[productId] = value;
    }
  },
  
  watch: {
    searchTerm() { this.currentPage = 1; }
  },
  async mounted() {
    // Load from live API for up-to-date stock visibility
    await this.reloadFromApi();

    // After catalogue is set and DOM rendered, calculate items per page and listen for resizes
    this.$nextTick(() => {
      this.recalcItemsPerPage();
    });
    this._onResize = () => this.recalcItemsPerPage();
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onResize);

    // Set up light auto-refresh to reflect stock changes (e.g., after checkouts)
    if (this.autoRefreshMs && Number.isFinite(this.autoRefreshMs) && this.autoRefreshMs > 0) {
      this._refreshTimer = setInterval(() => {
        // Keep same page and searchTerm; just refresh data
        this.reloadFromApi();
      }, this.autoRefreshMs);
    }
  }
  ,
  beforeUnmount() {
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('orientationchange', this._onResize);
    }
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  }
};
</script>

<style scoped>
.shop-view {
  /* make the shop view span the full width so product grid can fill horizontally */
  width: 100%;
  max-width: none;
  margin: 0;
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
.toolbar { display:flex; gap:0.5rem; align-items:center; margin-bottom:1rem; }
.search { flex:1; }
.product-list {
  list-style: none;
  padding: 0 1rem; /* keep a little horizontal padding from the viewport edges */
  display: grid;
  /* fixed-width columns so item boxes remain uniform */
  grid-template-columns: repeat(auto-fill, 260px);
  justify-content: space-between; /* distribute extra space between columns, do not stretch items */
  gap: 1rem;
}
.product-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 6px;
  align-items: stretch;
  background: #fff;
  width: 260px; /* fixed width to keep boxes uniform */
  height: 260px; /* fixed height so every item occupies the same space */
  box-sizing: border-box;
  overflow: hidden;
}
.product-image {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  background: #f6f6f6;
}
.product-info { display:flex; flex-direction:column; flex:1; }
.product-name { font-weight: 600; margin-bottom: 0.25rem; }
.product-desc {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.5rem;
  flex: 1 1 auto; /* allow description to take available space */
}
.product-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #333;
  margin: 0; /* remove bottom margin */
  margin-top: auto; /* push meta to bottom of the product-info column */
  justify-content: space-between;
  align-items: center;
}
.product-actions { margin-top: 0.25rem; }
.product-actions { display:flex; gap:0.5rem; align-items:center; }
.product-actions .qty { width: 64px; padding: 4px; }
.pagination { margin-top: 1rem; display:flex; gap:1rem; align-items:center; }
.admin-message { color: #064; margin-top: 0.5rem; }
.clickable { cursor: pointer; }
</style>