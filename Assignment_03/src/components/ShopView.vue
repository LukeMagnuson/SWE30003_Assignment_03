<template>
  <div>
    <h1>Shop</h1>

    <input v-model="searchTerm" placeholder="Search products..." />

    <ul>
      <li v-for="shopItem in paginatedShopItems" :key="shopItem.productId">
        <u>{{ shopItem.name }}</u>
        — stock: <b>{{ shopItem.quantityAvailable }}</b>
        — price: ${{ (shopItem.priceCents / 100).toFixed(2) }}
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
      itemsPerPage: 8
    };
  },
  computed: {
    filteredShop() {
      if (!this.catalogue) return [];
      // ProductCatalogue.searchProducts returns Product[] (objects)
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
    prevPage() { if (this.currentPage > 1) this.currentPage--; }
  },
  watch: {
    searchTerm() { this.currentPage = 1; }
  },
  async mounted() {
    // Primary API URL (json-server)
    const apiUrl = 'http://localhost:3000/products';
    // Fallback local static JSON (if you have public/data/shop.json)
    const fallbackUrl = '/data/shop.json';

    try {
      // Try loading from json-server first
      this.catalogue = await ProductCatalogue.loadFromUrl(apiUrl);
      console.info('Loaded product catalogue from API:', apiUrl);
    } catch (apiErr) {
      console.warn('Failed to load from API, falling back to static JSON:', apiErr);
      try {
        this.catalogue = await ProductCatalogue.loadFromUrl(fallbackUrl);
        console.info('Loaded product catalogue from fallback JSON:', fallbackUrl);
      } catch (jsonErr) {
        console.error('Failed to load product data from API and fallback JSON', jsonErr);
        // fallback to empty catalogue so UI still works
        this.catalogue = new ProductCatalogue([]);
      }
    }
  }
};
</script>

<style scoped>
/* small spacing so the list looks nicer */
ul { padding-left: 0; list-style: none; }
li { margin: 0.6rem 0; }
.pagination { margin-top: 1rem; display:flex; gap:1rem; align-items:center; }
</style>