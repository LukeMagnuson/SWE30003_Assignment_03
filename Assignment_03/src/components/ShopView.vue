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
export default {
  data () {
    return {
      shopData: [],
      searchTerm: '',
      currentPage: 1,
      itemsPerPage: 5
    }
  },
  computed: {
    filteredShop () {
      return this.shopData.filter(shopData =>
        shopData.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      )
    },
    totalPages () {
      return Math.ceil(this.filteredShop.length / this.itemsPerPage)
    },
    paginatedUsers () {
      const start = (this.currentPage - 1) * this.itemsPerPage
      return this.filteredShop.slice(start, start + this.itemsPerPage)
    }
  },
  methods: {
    nextPage () {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },
    prevPage () {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    }
  },
  watch: {
    searchTerm () {
      this.currentPage = 1 // Reset to page 1 on search
    }
  },
  mounted () {
    fetch('data/shop.json')
    // fetch('/auth/users.json')
      .then(response =>
      {
        return response.json();
    })
      .then(data => {
        this.shopData = data;
      })
      .catch(error => {
        console.error('Error loading JSON:', error)
      })
  }
}
</script>