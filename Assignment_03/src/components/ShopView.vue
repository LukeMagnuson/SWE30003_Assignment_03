<template>
  <div>
    <h1>News List</h1>
    <!-- Search input -->
    <input v-model="searchTerm" placeholder="Search news..." />

    <ul>
      <!-- Filtered user list -->
      <li v-for="shopItem in paginatedUsers" :key="shopItem.id">
        <u>{{shopItem.name}}</u> by <b>{{ shopItem.inventory_count }}</b>
      </li>
    </ul>

    <!-- Pagination controls -->
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
      itemsPerPage: 5
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
    prevPage() { if (this.currentPage > 1) this.currentPage--; }
  },
  watch: {
    searchTerm() { this.currentPage = 1; }
  },
  async mounted() {
    try {
      this.catalogue = await ProductCatalogue.loadFromUrl('/data/shop.json');
    } catch (err) {
      console.error('Failed to load catalogue', err);
      this.catalogue = new ProductCatalogue([]);
    }
  }
};
</script>